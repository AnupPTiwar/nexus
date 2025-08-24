"use client";

import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Group,
    Stack,
    Text,
} from "@mantine/core";
import {
    IconAlertTriangle,
    IconCheck,
    IconExternalLink,
    IconEye,
    IconInfoCircle,
    IconX,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import type {
    Notification,
    NotificationTileConfig,
    NotificationTileProps,
    NotificationType,
} from "@/types/notification";

// Notification tile configurations
const TILE_CONFIGS: Record<NotificationType, NotificationTileConfig> = {
    SUCCESS: {
        type: "SUCCESS",
        icon: IconCheck,
        color: "teal",
        backgroundColor: "var(--mantine-color-teal-0)",
        borderColor: "var(--mantine-color-teal-3)",
        actions: [
            {
                id: "view",
                label: "View",
                variant: "subtle",
                color: "teal",
                icon: IconExternalLink,
                onClick: () => {},
            },
        ],
    },
    ERROR: {
        type: "ERROR",
        icon: IconX,
        color: "red",
        backgroundColor: "var(--mantine-color-red-0)",
        borderColor: "var(--mantine-color-red-3)",
        actions: [
            {
                id: "retry",
                label: "Retry",
                variant: "outline",
                color: "red",
                onClick: () => {},
            },
            {
                id: "view",
                label: "View Details",
                variant: "subtle",
                color: "red",
                icon: IconExternalLink,
                onClick: () => {},
            },
        ],
    },
    WARNING: {
        type: "WARNING",
        icon: IconAlertTriangle,
        color: "yellow",
        backgroundColor: "var(--mantine-color-yellow-0)",
        borderColor: "var(--mantine-color-yellow-3)",
        actions: [
            {
                id: "acknowledge",
                label: "Acknowledge",
                variant: "outline",
                color: "yellow",
                onClick: () => {},
            },
        ],
    },
    INFO: {
        type: "INFO",
        icon: IconInfoCircle,
        color: "blue",
        backgroundColor: "var(--mantine-color-blue-0)",
        borderColor: "var(--mantine-color-blue-3)",
        actions: [
            {
                id: "view",
                label: "View",
                variant: "subtle",
                color: "blue",
                icon: IconExternalLink,
                onClick: () => {},
            },
        ],
    },
};

export function NotificationTile({
    notification,
    onRead,
    onDismiss,
    onAction,
    compact = false,
}: NotificationTileProps) {
    const config = TILE_CONFIGS[notification.type];
    const IconComponent = config.icon;

    const formattedTime = useMemo(
        () => formatDistanceToNow(notification.createdAt, { addSuffix: true }),
        [notification.createdAt],
    );

    const handleRead = () => {
        if (!notification.isRead && onRead) {
            onRead(notification.id);
        }
    };

    const handleDismiss = () => {
        if (onDismiss) {
            onDismiss(notification.id);
        }
    };

    const handleAction = (actionId: string) => {
        if (onAction) {
            onAction(notification.id, actionId);
        }
    };

    const resourceInfo = getResourceInfo(notification);

    return (
        <Card
            key={notification.id}
            p={compact ? "xs" : "sm"}
            radius="md"
            withBorder
            style={{
                backgroundColor: notification.isRead
                    ? undefined
                    : config.backgroundColor,
                borderColor: notification.isRead
                    ? undefined
                    : config.borderColor,
                borderWidth: notification.isRead ? 1 : 2,
            }}
        >
            <Stack gap={compact ? "xs" : "sm"}>
                <Group justify="space-between" align="flex-start">
                    <Group gap="sm" align="flex-start">
                        <div style={{ color: `var(--mantine-color-${config.color}-6)` }}>
                            <IconComponent size={compact ? 18 : 20} />
                        </div>
                        <Stack gap="xs" style={{ flex: 1 }}>
                            <Group gap="xs" wrap="nowrap">
                                <Text
                                    fw={notification.isRead ? 500 : 600}
                                    size={compact ? "sm" : "md"}
                                    c={
                                        notification.isRead
                                            ? "dimmed"
                                            : undefined
                                    }
                                >
                                    {notification.title}
                                </Text>
                                {!notification.isRead && (
                                    <Badge
                                        size="xs"
                                        color={config.color}
                                        variant="filled"
                                    >
                                        New
                                    </Badge>
                                )}
                            </Group>

                            <Text
                                size={compact ? "xs" : "sm"}
                                c={notification.isRead ? "dimmed" : undefined}
                                lineClamp={compact ? 2 : 3}
                            >
                                {notification.message}
                            </Text>

                            {resourceInfo && (
                                <Group gap="xs">
                                    <Badge
                                        size="xs"
                                        variant="light"
                                        color="gray"
                                    >
                                        {resourceInfo.type}
                                    </Badge>
                                    {resourceInfo.name && (
                                        <Text size="xs" c="dimmed">
                                            {resourceInfo.name}
                                        </Text>
                                    )}
                                </Group>
                            )}

                            <Group justify="space-between" align="center">
                                <Text size="xs" c="dimmed">
                                    {formattedTime}
                                </Text>

                                {!compact &&
                                    config.actions &&
                                    config.actions.length > 0 && (
                                        <Group gap="xs">
                                            {config.actions.map((action) => {
                                                const ActionIcon = action.icon;
                                                return (
                                                    <Button
                                                        key={action.id}
                                                        size="xs"
                                                        variant={action.variant}
                                                        color={action.color}
                                                        leftSection={
                                                            ActionIcon ? (
                                                                <ActionIcon
                                                                    size={12}
                                                                />
                                                            ) : undefined
                                                        }
                                                        onClick={() =>
                                                            handleAction(
                                                                action.id,
                                                            )
                                                        }
                                                    >
                                                        {action.label}
                                                    </Button>
                                                );
                                            })}
                                        </Group>
                                    )}
                            </Group>
                        </Stack>
                    </Group>

                    <Group gap="xs">
                        {!notification.isRead && (
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                onClick={handleRead}
                                title="Mark as read"
                            >
                                <IconEye size={14} />
                            </ActionIcon>
                        )}
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={handleDismiss}
                            title="Dismiss"
                        >
                            <IconX size={14} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Stack>
        </Card>
    );
}

// Helper function to extract resource information from notification metadata
function getResourceInfo(notification: Notification): {
    type: string;
    name?: string;
} | null {
    const { resourceType, metadata } = notification;

    switch (resourceType) {
        case "REPOSITORY":
            return {
                type: "Repository",
                name:
                    metadata?.repositoryOwner && metadata?.repositoryName
                        ? `${metadata.repositoryOwner}/${metadata.repositoryName}`
                        : undefined,
            };
        case "WORKFLOW":
            return {
                type: "Workflow",
                name: metadata?.workflowName as string,
            };
        case "WORKFLOW_RUN":
            return {
                type: "Workflow Run",
                name: metadata?.workflowName as string,
            };
        case "SYNC_JOB":
            return {
                type: "Sync Job",
                name: `${metadata?.totalProcessed || 0} items processed`,
            };
        case "USER":
            return {
                type: "User",
            };
        case "SYSTEM":
            return {
                type: "System",
            };
        default:
            return null;
    }
}
