"use client";

import {
    Card,
    Group,
    Progress,
    Stack,
    Text,
    Badge,
    ActionIcon,
    Collapse,
} from "@mantine/core";
import {
    IconRefresh,
    IconX,
    IconCheck,
    IconAlertCircle,
    IconChevronDown,
    IconChevronUp,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";

export interface SyncProgress {
    workflows: { total: number; completed: number; failed: number };
    runs: { total: number; completed: number; failed: number };
    branches: { total: number; completed: number; failed: number };
}

export interface SyncActivityData {
    jobId: string;
    repositoryId: string;
    repository: {
        name: string;
        owner: string;
    };
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    progress: SyncProgress;
    processedItems?: number;
    failedItems?: number;
    stage?: string;
    message?: string;
    startedAt?: Date;
    completedAt?: Date;
}

interface SyncActivityCardProps {
    syncData: SyncActivityData;
    onDismiss?: () => void;
}

export function SyncActivityCard({ syncData, onDismiss }: SyncActivityCardProps) {
    const [expanded, { toggle }] = useDisclosure(false);
    const [elapsedTime, setElapsedTime] = useState<string>("");

    // Calculate overall progress
    const calculateOverallProgress = () => {
        const { workflows, runs, branches } = syncData.progress;
        const total = workflows.total + runs.total + branches.total;
        const completed = workflows.completed + runs.completed + branches.completed;
        
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    };

    // Update elapsed time
    useEffect(() => {
        if (!syncData.startedAt || syncData.status === "COMPLETED" || syncData.status === "FAILED") {
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(syncData.startedAt!).getTime();
            const now = Date.now();
            const diff = now - start;
            
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            
            setElapsedTime(`${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [syncData.startedAt, syncData.status]);

    const getStatusIcon = () => {
        switch (syncData.status) {
            case "PROCESSING":
                return <IconRefresh size={16} className="animate-spin" />;
            case "COMPLETED":
                return <IconCheck size={16} />;
            case "FAILED":
                return <IconAlertCircle size={16} />;
            default:
                return <IconRefresh size={16} />;
        }
    };

    const getStatusColor = () => {
        switch (syncData.status) {
            case "PROCESSING":
                return "blue";
            case "COMPLETED":
                return "green";
            case "FAILED":
                return "red";
            default:
                return "gray";
        }
    };

    const overallProgress = calculateOverallProgress();

    return (
        <Card padding="sm" radius="md" withBorder>
            <Stack gap="xs">
                {/* Header */}
                <Group justify="space-between" align="start">
                    <Stack gap={4}>
                        <Group gap="xs">
                            <Badge
                                size="sm"
                                color={getStatusColor()}
                                leftSection={getStatusIcon()}
                                variant="light"
                            >
                                {syncData.status}
                            </Badge>
                            {elapsedTime && (
                                <Text size="xs" c="dimmed">
                                    {elapsedTime}
                                </Text>
                            )}
                        </Group>
                        <Text size="sm" fw={500}>
                            {syncData.repository.owner}/{syncData.repository.name}
                        </Text>
                    </Stack>
                    <Group gap={4}>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={toggle}
                            title={expanded ? "Collapse" : "Expand"}
                        >
                            {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </ActionIcon>
                        {onDismiss && (syncData.status === "COMPLETED" || syncData.status === "FAILED") && (
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                onClick={onDismiss}
                                title="Dismiss"
                            >
                                <IconX size={14} />
                            </ActionIcon>
                        )}
                    </Group>
                </Group>

                {/* Current stage message */}
                {syncData.message && (
                    <Text size="xs" c="dimmed">
                        {syncData.message}
                    </Text>
                )}

                {/* Overall progress bar */}
                {syncData.status === "PROCESSING" && (
                    <Progress
                        value={overallProgress}
                        size="sm"
                        radius="md"
                        striped
                        animated
                    />
                )}

                {/* Detailed progress */}
                <Collapse in={expanded}>
                    <Stack gap="xs" mt="xs">
                        {/* Workflows progress */}
                        {syncData.progress.workflows.total > 0 && (
                            <Stack gap={4}>
                                <Group justify="space-between">
                                    <Text size="xs" fw={500}>Workflows</Text>
                                    <Text size="xs" c="dimmed">
                                        {syncData.progress.workflows.completed}/{syncData.progress.workflows.total}
                                    </Text>
                                </Group>
                                <Progress
                                    value={(syncData.progress.workflows.completed / syncData.progress.workflows.total) * 100}
                                    size="xs"
                                    radius="md"
                                    color={syncData.progress.workflows.failed > 0 ? "orange" : "blue"}
                                />
                                {syncData.progress.workflows.failed > 0 && (
                                    <Text size="xs" c="red">
                                        {syncData.progress.workflows.failed} failed
                                    </Text>
                                )}
                            </Stack>
                        )}

                        {/* Runs progress */}
                        {syncData.progress.runs.total > 0 && (
                            <Stack gap={4}>
                                <Group justify="space-between">
                                    <Text size="xs" fw={500}>Workflow Runs</Text>
                                    <Text size="xs" c="dimmed">
                                        {syncData.progress.runs.completed}/{syncData.progress.runs.total}
                                    </Text>
                                </Group>
                                <Progress
                                    value={(syncData.progress.runs.completed / syncData.progress.runs.total) * 100}
                                    size="xs"
                                    radius="md"
                                    color={syncData.progress.runs.failed > 0 ? "orange" : "green"}
                                />
                                {syncData.progress.runs.failed > 0 && (
                                    <Text size="xs" c="red">
                                        {syncData.progress.runs.failed} failed
                                    </Text>
                                )}
                            </Stack>
                        )}

                        {/* Branches progress */}
                        {syncData.progress.branches.total > 0 && (
                            <Stack gap={4}>
                                <Group justify="space-between">
                                    <Text size="xs" fw={500}>Branches</Text>
                                    <Text size="xs" c="dimmed">
                                        {syncData.progress.branches.completed}/{syncData.progress.branches.total}
                                    </Text>
                                </Group>
                                <Progress
                                    value={(syncData.progress.branches.completed / syncData.progress.branches.total) * 100}
                                    size="xs"
                                    radius="md"
                                    color={syncData.progress.branches.failed > 0 ? "orange" : "grape"}
                                />
                                {syncData.progress.branches.failed > 0 && (
                                    <Text size="xs" c="red">
                                        {syncData.progress.branches.failed} failed
                                    </Text>
                                )}
                            </Stack>
                        )}

                        {/* Summary stats */}
                        {(syncData.status === "COMPLETED" || syncData.status === "FAILED") && (
                            <Group gap="xs" mt="xs">
                                <Badge size="xs" variant="light" color="blue">
                                    Processed: {syncData.processedItems || 0}
                                </Badge>
                                {syncData.failedItems && syncData.failedItems > 0 && (
                                    <Badge size="xs" variant="light" color="red">
                                        Failed: {syncData.failedItems}
                                    </Badge>
                                )}
                            </Group>
                        )}
                    </Stack>
                </Collapse>
            </Stack>
        </Card>
    );
}