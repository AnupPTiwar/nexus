import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import redis from "@/workers/redis";

// SSE endpoint for workflow run updates
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get("repositoryId");
    const workflowId = searchParams.get("workflowId");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({
                        type: "connected",
                        userId: session.user.id,
                        repositoryId,
                        workflowId,
                        timestamp: new Date().toISOString(),
                    })}\n\n`,
                ),
            );

            const subscriber = redis.duplicate();
            await subscriber.connect();

            const channels: string[] = [];

            // Subscribe to workflow run updates
            if (workflowId) {
                channels.push(`workflow:${workflowId}:runs`);
            } else if (repositoryId) {
                channels.push(`repository:${repositoryId}:workflow-runs`);
            } else {
                // Subscribe to all workflow runs for user's repositories
                channels.push(`user:${session.user.id}:workflow-runs`);
            }

            // Subscribe to channels
            for (const channel of channels) {
                await subscriber.subscribe(channel);
            }
            
            subscriber.on("message", (channel, message) => {
                if (channels.includes(channel)) {
                    try {
                        controller.enqueue(
                            encoder.encode(`data: ${message}\n\n`),
                        );
                    } catch (error) {
                        console.error("Error sending workflow run SSE:", error);
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
            }, 30000);

            // Cleanup on disconnect
            request.signal.addEventListener("abort", () => {
                clearInterval(heartbeat);
                Promise.all(channels.map(ch => subscriber.unsubscribe(ch)))
                    .then(() => subscriber.disconnect())
                    .catch(console.error);
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
}