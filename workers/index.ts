#!/usr/bin/env node
import "dotenv/config";
import { Worker } from "bullmq";
import type { RepositorySyncJobData } from "../types/queue";
import { processSyncJob } from "./processors/sync-processor";
import redis from "./redis";

// Create workers for different job types
const workers: Worker[] = [];

// Repository sync worker
const syncWorker = new Worker<RepositorySyncJobData>(
    "repository-sync",
    processSyncJob,
    {
        connection: redis,
        concurrency: 3, // Process up to 3 sync jobs concurrently
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 20 },
    },
);

workers.push(syncWorker);

// Worker event handlers
syncWorker.on("ready", () => {
    console.log("🚀 Repository sync worker is ready and waiting for jobs...");
});

syncWorker.on("active", (job) => {
    console.log(
        `📋 Processing sync job ${job.id} for repository ${job.data.repositoryId}`,
    );
});

syncWorker.on("completed", (job, result) => {
    console.log(`✅ Sync job ${job.id} completed successfully:`, {
        totalProcessed: result.totalProcessed,
        totalFailed: result.totalFailed,
        duration: Date.now() - (job.processedOn || job.timestamp),
    });
});

syncWorker.on("failed", (job, error) => {
    console.error(`❌ Sync job ${job?.id} failed:`, error.message);
});

syncWorker.on("stalled", (jobId) => {
    console.warn(`⏰ Sync job ${jobId} stalled and will be retried`);
});

syncWorker.on("progress", (job, progress) => {
    console.log(`📊 Sync job ${job.id} progress:`, progress);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down workers gracefully...`);

    try {
        // Close all workers
        await Promise.all(workers.map((worker) => worker.close()));
        console.log("✅ All workers closed successfully");

        // Close Redis connection
        await redis.quit();
        console.log("✅ Redis connection closed");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught exception:", error);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
});

console.log("🔧 BullMQ workers started successfully");
console.log("📡 Connected to Redis:", redis.options.host);
console.log("👥 Workers running:", workers.length);
console.log("🎯 Concurrency level:", syncWorker.opts.concurrency);
console.log("📝 Press Ctrl+C to stop workers");
