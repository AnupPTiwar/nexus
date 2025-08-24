import Redis from "ioredis";

// Redis configuration for workers
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
    lazyConnect: true,
    keepAlive: 30000,
    commandTimeout: 5000,
    db: 0,
    maxRetriesPerRequest: null,
});

// Handle Redis connection events
redis.on("connect", () => {
    console.log("✅ Worker Redis connection established");
});

redis.on("error", (error) => {
    console.error("❌ Worker Redis connection error:", error);
});

redis.on("reconnecting", (times: number) => {
    console.log(`🔄 Worker Redis reconnecting (attempt ${times})`);
});

export default redis;
