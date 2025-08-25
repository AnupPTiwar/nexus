import IORedis from "ioredis";

// Redis connection
const redis = new IORedis({
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
