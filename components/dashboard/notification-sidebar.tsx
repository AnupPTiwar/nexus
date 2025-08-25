"use client";

import {
    ActionIcon,
    Badge,
    Center,
    Divider,
    Group,
    ScrollArea,
    Stack,
    Text,
} from "@mantine/core";
import { IconBell, IconBellOff, IconX } from "@tabler/icons-react";
import { useEffect } from "react";
import { SyncActivityCard } from "@/components/sync/sync-activity-card";
import { useSyncActivityStreams } from "@/hooks/use-sync-activity";

interface NotificationSidebarProps {
    onClose?: () => void;
}

export function NotificationSidebar({ onClose }: NotificationSidebarProps) {
    const { syncJobs, connectToJob, dismissJob } = useSyncActivityStreams();

    // Load existing active sync jobs on component mount
    useEffect(() => {
        const loadActiveSyncJobs = async () => {
            try {
                console.log("🔍 Loading existing active sync jobs...");
                const response = await fetch("/api/sync/active");
                if (response.ok) {
                    const activeSyncJobs = await response.json();
                    console.log("📋 Found active sync jobs:", activeSyncJobs);
                    
                    // Connect to each active sync job
                    activeSyncJobs.forEach((job: any) => {
                        console.log("🔗 Connecting to existing sync job:", job.jobId);
                        connectToJob(job.jobId);
                    });
                }
            } catch (error) {
                console.error("Failed to load active sync jobs:", error);
            }
        };

        loadActiveSyncJobs();
    }, [connectToJob]);

    // Listen for real-time sync events and connect to active jobs
    useEffect(() => {
        console.log("Setting up SSE connection for notifications...");
        const eventSource = new EventSource("/api/sse/notifications");

        eventSource.onopen = () => {
            console.log("✅ SSE connection established for notifications");
        };

        eventSource.onmessage = (event) => {
            console.log("📨 Received SSE message:", event.data);
            try {
                const eventData = JSON.parse(event.data);
                console.log("📊 Parsed event data:", eventData);
                
                if (eventData.type === "sync_progress" && eventData.syncJobId) {
                    console.log("🔄 New sync progress, connecting to job:", eventData.syncJobId);
                    // Auto-connect to new sync jobs when they start
                    connectToJob(eventData.syncJobId);
                }
            } catch (error) {
                console.error("Failed to parse SSE message:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("❌ SSE connection error for notifications:", error);
        };

        return () => {
            console.log("🔌 Closing SSE connection for notifications");
            eventSource.close();
        };
    }, [connectToJob]);

    return (
        <Stack h="100%" gap="sm">
            {/* Header */}
            <Group justify="space-between">
                <Group gap="xs">
                    <IconBell size={20} />
                    <Text fw={600}>Live Activity</Text>
                    {syncJobs.length > 0 && (
                        <Badge size="sm" color="blue" variant="filled">
                            {syncJobs.length}
                        </Badge>
                    )}
                </Group>
                {onClose && (
                    <ActionIcon size="sm" variant="subtle" onClick={onClose}>
                        <IconX size={16} />
                    </ActionIcon>
                )}
            </Group>

            <Divider />

            {/* Content */}
            <ScrollArea style={{ flex: 1 }}>
                <Stack gap="sm">
                    {/* Active sync jobs */}
                    {syncJobs.length > 0 ? (
                        <>
                            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                                Active Operations
                            </Text>
                            {syncJobs.map((job) => (
                                <SyncActivityCard
                                    key={job.jobId}
                                    syncData={job}
                                    onDismiss={() => dismissJob(job.jobId)}
                                />
                            ))}
                        </>
                    ) : (
                        <Center py="xl">
                            <Stack gap="xs" align="center">
                                <IconBellOff
                                    size={32}
                                    color="var(--mantine-color-gray-5)"
                                />
                                <Text c="dimmed" size="sm" ta="center">
                                    No active operations
                                </Text>
                                <Text c="dimmed" size="xs" ta="center">
                                    Start a repository sync to see live progress
                                    here
                                </Text>
                            </Stack>
                        </Center>
                    )}
                </Stack>
            </ScrollArea>
        </Stack>
    );
}
