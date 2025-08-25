"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { SyncActivityData } from "@/components/sync/sync-activity-card";

// Hook to subscribe to sync job progress via SSE
export function useSyncProgress(jobId: string | null) {
    const [syncData, setSyncData] = useState<SyncActivityData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!jobId) return;

        let eventSource: EventSource | null = null;

        const connect = () => {
            eventSource = new EventSource(`/api/sse/sync/${jobId}`);

            eventSource.onopen = () => {
                setIsConnected(true);
                setError(null);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (
                        data.type === "sync_status" ||
                        data.type === "progress_update"
                    ) {
                        setSyncData(data.data);
                    }
                } catch (err) {
                    console.error("Failed to parse sync progress:", err);
                }
            };

            eventSource.onerror = () => {
                setIsConnected(false);
                setError("Connection lost. Reconnecting...");

                // Reconnect after 5 seconds
                setTimeout(() => {
                    if (eventSource?.readyState === EventSource.CLOSED) {
                        connect();
                    }
                }, 5000);
            };
        };

        connect();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [jobId]);

    return { syncData, error, isConnected };
}

// Hook to get all active sync jobs for the current user
export function useActiveSyncJobs() {
    return useQuery<SyncActivityData[]>({
        queryKey: ["sync-jobs", "active"],
        queryFn: async () => {
            const response = await fetch("/api/sync/active");
            if (!response.ok)
                throw new Error("Failed to fetch active sync jobs");
            return response.json();
        },
        refetchInterval: 10000, // Refetch every 10 seconds
    });
}

// Hook to manage multiple sync job streams
export function useSyncActivityStreams() {
    const [syncJobs, setSyncJobs] = useState<Map<string, SyncActivityData>>(
        new Map(),
    );
    const [connections, setConnections] = useState<Map<string, EventSource>>(
        new Map(),
    );

    const disconnectFromJobRef = useCallback((jobId: string) => {
        setConnections((prev) => {
            const eventSource = prev.get(jobId);
            if (eventSource) {
                eventSource.close();
                const updated = new Map(prev);
                updated.delete(jobId);
                return updated;
            }
            return prev;
        });
    }, []);

    const connectToJob = useCallback(
        (jobId: string) => {
            // Don't reconnect if already connected
            setConnections((prev) => {
                if (prev.has(jobId)) {
                    console.log(`⚠️ Already connected to sync job: ${jobId}`);
                    return prev;
                }

                console.log(`🔌 Connecting to sync job: ${jobId}`);
                const eventSource = new EventSource(`/api/sse/sync/${jobId}`);

                eventSource.onopen = () => {
                    console.log(`✅ Connected to sync job: ${jobId}`);
                };

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log(`📊 Received data for job ${jobId}:`, data);

                        if (
                            data.type === "sync_status" ||
                            data.type === "progress_update"
                        ) {
                            console.log(`🔄 Updating sync job ${jobId} with:`, data.data);
                            setSyncJobs((prevJobs) => {
                                const updated = new Map(prevJobs);
                                updated.set(jobId, data.data);
                                console.log(`📋 Current sync jobs:`, Array.from(updated.values()));
                                return updated;
                            });

                            // Remove completed/failed jobs after 30 seconds
                            if (
                                data.data.status === "COMPLETED" ||
                                data.data.status === "FAILED"
                            ) {
                                setTimeout(() => {
                                    disconnectFromJobRef(jobId);
                                    setSyncJobs((prevJobs) => {
                                        const updated = new Map(prevJobs);
                                        updated.delete(jobId);
                                        return updated;
                                    });
                                }, 30000);
                            }
                        }
                    } catch (err) {
                        console.error("Failed to parse sync progress:", err);
                    }
                };

                eventSource.onerror = (error) => {
                    console.error(`❌ Connection lost for job ${jobId}:`, error);
                    console.error(`EventSource readyState: ${eventSource.readyState}`);
                };

                const updated = new Map(prev);
                updated.set(jobId, eventSource);
                return updated;
            });
        },
        [disconnectFromJobRef],
    );

    const disconnectFromJob = disconnectFromJobRef;

    const dismissJob = useCallback(
        (jobId: string) => {
            disconnectFromJob(jobId);
            setSyncJobs((prev) => {
                const updated = new Map(prev);
                updated.delete(jobId);
                return updated;
            });
        },
        [disconnectFromJob],
    );

    // Clean up all connections on unmount
    useEffect(() => {
        return () => {
            connections.forEach((eventSource) => {
                eventSource.close();
            });
        };
    }, [connections]);

    return {
        syncJobs: Array.from(syncJobs.values()),
        connectToJob,
        disconnectFromJob,
        dismissJob,
    };
}
