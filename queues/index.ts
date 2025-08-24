import { Queue } from "bullmq";
import IORedis from "ioredis";

// Redis connection
const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
});

// Sync queue for repository operations
export const syncQueue = new Queue("repository-sync", {
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
    },
});

// Notification queue for email/SSE
export const notificationQueue = new Queue("notifications", {
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
    },
});

// Webhook processing queue
export const webhookQueue = new Queue("webhooks", {
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 10,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
    },
});

// Export redis connection for SSE and other uses
export { redis };
