import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import redis from "@/workers/redis";

// SSE endpoint for sync job progress
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
                        // Owner or user with manage permission
                        { userId: session.user.id },
                        {
                            repositoryTokens: {
                                some: {
                                    userId: session.user.id,
                                    isActive: true,
                                },
                            },
                        },
                    ],
                },
            },
            include: {
                repository: {
                    select: {
                        id: true,
                        name: true,
                        githubOwner: true,
                    },
                },
            },
        });

        if (!syncJob) {
            return new Response("Sync job not found or access denied", { status: 404 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                // Send initial sync job status
                const initialData = {
                    type: "sync_status",
                    data: {
                        jobId: syncJob.id,
                        repositoryId: syncJob.repository.id,
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
                    encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`),
                );

                // Subscribe to Redis for progress updates
                const subscriber = redis.duplicate();
                
                const progressChannel = `sync:progress:${jobId}`;

                await subscriber.subscribe(progressChannel);
                
                subscriber.on("message", (channel, message) => {
                    if (channel === progressChannel) {
                        try {
                            const progressData = JSON.parse(message);
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({
                                        type: "progress_update",
                                        data: progressData,
                                    })}\n\n`,
                                ),
                            );

                            // If sync is completed or failed, close the stream
                            if (progressData.status === "COMPLETED" || progressData.status === "FAILED") {
                                setTimeout(() => {
                                    controller.close();
                                }, 1000);
                            }
                        } catch (error) {
                            console.error("Failed to parse progress message:", error);
                        }
                    }
                });

                // Keep-alive heartbeat
                const heartbeat = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode(": heartbeat\n\n"));
                    } catch {
                        clearInterval(heartbeat);
                        subscriber.disconnect();
                    }
                }, 30000); // Every 30 seconds

                // Cleanup on disconnect
                request.signal.addEventListener("abort", () => {
                    clearInterval(heartbeat);
                    subscriber.unsubscribe(progressChannel).then(() => {
                        subscriber.disconnect();
                    }).catch(console.error);
                    controller.close();
                });
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("SSE sync endpoint error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}