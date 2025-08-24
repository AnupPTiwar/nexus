import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/queues";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> },
) {
    try {
        const session = await auth();
        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { jobId } = await params;

        // Verify user has access to this sync job
        const syncJob = await prisma.syncJob.findFirst({
            where: {
                id: jobId,
                repository: {
                    OR: [
                        { userId: session.user.id },
                        // Add other access conditions here if needed
                    ],
                },
            },
            include: {
                repository: {
                    select: {
                        name: true,
                        githubOwner: true,
                    },
                },
            },
        });

        if (!syncJob) {
            return new Response("Sync job not found", { status: 404 });
        }

        // Set up SSE headers
        const responseHeaders = new Headers({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        });

        // Create readable stream for SSE
        const stream = new ReadableStream({
            start(controller) {
                // Send initial sync job status
                const initialData = {
                    type: "sync_status",
                    data: {
                        jobId: syncJob.id,
                        status: syncJob.status,
                        progress: syncJob.progress,
                        processedItems: syncJob.processedItems,
                        failedItems: syncJob.failedItems,
                        repository: {
                            name: syncJob.repository.name,
                            owner: syncJob.repository.githubOwner,
                        },
                        startedAt: syncJob.startedAt,
                        completedAt: syncJob.completedAt,
                    },
                };

                controller.enqueue(
                    new TextEncoder().encode(
                        `data: ${JSON.stringify(initialData)}\n\n`,
                    ),
                );

                // Subscribe to Redis updates for this job
                const subscriber = redis.duplicate();
                const progressChannel = `sync:progress:${jobId}`;

                subscriber.subscribe(progressChannel);

                subscriber.on("message", (channel, message) => {
                    if (channel === progressChannel) {
                        try {
                            const progressData = JSON.parse(message);
                            controller.enqueue(
                                new TextEncoder().encode(
                                    `data: ${JSON.stringify({
                                        type: "progress_update",
                                        data: progressData,
                                    })}\n\n`,
                                ),
                            );
                        } catch (error) {
                            console.error(
                                "Failed to parse progress message:",
                                error,
                            );
                        }
                    }
                });

                // Handle connection cleanup
                const cleanup = () => {
                    subscriber.unsubscribe();
                    subscriber.disconnect();
                };

                // Clean up after 30 minutes or when connection is closed
                const timeout = setTimeout(
                    () => {
                        controller.close();
                        cleanup();
                    },
                    30 * 60 * 1000,
                ); // 30 minutes

                // Handle client disconnect
                request.signal.addEventListener("abort", () => {
                    clearTimeout(timeout);
                    controller.close();
                    cleanup();
                });

                // Periodically send keep-alive messages
                const keepAlive = setInterval(() => {
                    try {
                        controller.enqueue(
                            new TextEncoder().encode(": keep-alive\n\n"),
                        );
                    } catch {
                        clearInterval(keepAlive);
                        clearTimeout(timeout);
                        cleanup();
                    }
                }, 30000); // Every 30 seconds

                // Clean up interval when stream closes
                const originalClose = controller.close.bind(controller);
                controller.close = () => {
                    clearInterval(keepAlive);
                    clearTimeout(timeout);
                    cleanup();
                    return originalClose();
                };
            },
        });

        return new Response(stream, { headers: responseHeaders });
    } catch (error) {
        console.error("SSE endpoint error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
