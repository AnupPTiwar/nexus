import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import redis from "@/workers/redis";

// SSE endpoint for real-time notifications
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({
                        type: "connected",
                        userId: session.user.id,
                        timestamp: new Date().toISOString(),
                    })}\n\n`,
                ),
            );

            // Subscribe to user's notification channel
            const subscriber = redis.duplicate();

            const channel = `notifications:${session.user.id}`;

            // Subscribe to user's notification channel
            await subscriber.subscribe(channel);

            subscriber.on("message", (ch, message) => {
                if (ch === channel) {
                    try {
                        // Message should already be JSON from the notification service
                        controller.enqueue(
                            encoder.encode(`data: ${message}\n\n`),
                        );
                    } catch (error) {
                        console.error("Error sending notification SSE:", error);
                    }
                }
            });

            // Keep connection alive with heartbeat
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": heartbeat\n\n"));
                } catch (error) {
                    clearInterval(heartbeat);
                    subscriber.disconnect();
                }
            }, 30000); // Every 30 seconds

            // Clean up on close
            request.signal.addEventListener("abort", () => {
                clearInterval(heartbeat);
                subscriber
                    .unsubscribe(channel)
                    .then(() => {
                        subscriber.disconnect();
                    })
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
