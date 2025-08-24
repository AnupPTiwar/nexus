"use client";

import {
    ActionIcon,
    Badge,
    Button,
    Center,
    Divider,
    Group,
    Loader,
    Paper,
    ScrollArea,
    Select,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import {
    IconBell,
    IconBellOff,
    IconCheck,
    IconFilter,
    IconSearch,
    IconX,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type {
    Notification,
    NotificationFilters,
    NotificationPanelConfig,
    NotificationResourceType,
    NotificationType,
} from "@/types/notification";
import { NotificationTile } from "./notification-tile";

interface NotificationPanelProps {
    notifications: Notification[];
    isLoading?: boolean;
    error?: string;
    config?: Partial<NotificationPanelConfig>;
    onRead?: (notificationId: string) => void;
    onReadAll?: () => void;
    onDismiss?: (notificationId: string) => void;
    onDismissAll?: () => void;
    onAction?: (notificationId: string, action: string) => void;
    onFiltersChange?: (filters: NotificationFilters) => void;
}

const DEFAULT_CONFIG: NotificationPanelConfig = {
    maxItems: 50,
    autoMarkReadDelay: 3000,
    groupByType: false,
    showTimestamps: true,
    enableActions: true,
    compactMode: false,
};

export function NotificationPanel({
    notifications,
    isLoading = false,
    error,
    config = {},
    onRead,
    onReadAll,
    onDismiss,
    onDismissAll,
    onAction,
    onFiltersChange,
}: NotificationPanelProps) {
    const [filters, setFilters] = useState<NotificationFilters>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // Filter and search notifications
    const filteredNotifications = useMemo(() => {
        let filtered = notifications;

        // Apply filters
        if (filters.types?.length) {
            filtered = filtered.filter((n) => filters.types?.includes(n.type));
        }

        if (filters.resourceTypes?.length) {
            filtered = filtered.filter((n) =>
                filters.resourceTypes?.includes(n.resourceType),
            );
        }

        if (filters.isRead !== undefined) {
            filtered = filtered.filter((n) => n.isRead === filters.isRead);
        }

        if (filters.dateRange) {
            filtered = filtered.filter(
                (n) =>
                    filters.dateRange &&
                    n.createdAt >= filters.dateRange.from &&
                    n.createdAt <= filters.dateRange.to,
            );
        }

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (n) =>
                    n.title.toLowerCase().includes(query) ||
                    n.message.toLowerCase().includes(query),
            );
        }

        // Sort by creation date (newest first)
        filtered = filtered.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        );

        // Limit items
        return filtered.slice(0, finalConfig.maxItems);
    }, [notifications, filters, searchQuery, finalConfig.maxItems]);

    // Statistics
    const stats = useMemo(() => {
        const unread = notifications.filter((n) => !n.isRead).length;
        return {
            total: notifications.length,
            unread,
            filtered: filteredNotifications.length,
        };
    }, [notifications, filteredNotifications]);

    const handleFiltersChange = (newFilters: Partial<NotificationFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        onFiltersChange?.(updatedFilters);
    };

    const handleMarkAllRead = () => {
        if (onReadAll) {
            onReadAll();
        }
    };

    const handleDismissAll = () => {
        if (onDismissAll) {
            onDismissAll();
        }
    };

    return (
        <Paper w={400} p="md" h="100vh" style={{ position: "fixed", right: 0, top: 0, zIndex: 100 }}>
            <Stack gap="md" h="100%">
                {/* Header */}
                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <IconBell size={20} />
                        <Text fw={600} size="lg">
                            Notifications
                        </Text>
                        {stats.unread > 0 && (
                            <Badge size="sm" color="blue" variant="filled">
                                {stats.unread}
                            </Badge>
                        )}
                    </Group>
                    <Group gap="xs">
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => setShowFilters(!showFilters)}
                            title="Toggle filters"
                        >
                            <IconFilter size={16} />
                        </ActionIcon>
                    </Group>
                </Group>

                {/* Search and filters */}
                <Stack gap="xs">
                    <TextInput
                        placeholder="Search notifications..."
                        leftSection={<IconSearch size={16} />}
                        rightSection={
                            searchQuery ? (
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            ) : null
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="sm"
                    />

                    {showFilters && (
                        <Stack gap="xs">
                            <Group grow>
                                <Select
                                    placeholder="Filter by type"
                                    data={[
                                        { value: "SUCCESS", label: "Success" },
                                        { value: "ERROR", label: "Error" },
                                        { value: "WARNING", label: "Warning" },
                                        { value: "INFO", label: "Info" },
                                    ]}
                                    value={filters.types?.[0]}
                                    onChange={(value) =>
                                        handleFiltersChange({
                                            types: value
                                                ? [value as NotificationType]
                                                : undefined,
                                        })
                                    }
                                    size="xs"
                                    clearable
                                />
                                <Select
                                    placeholder="Filter by resource"
                                    data={[
                                        {
                                            value: "REPOSITORY",
                                            label: "Repository",
                                        },
                                        {
                                            value: "WORKFLOW",
                                            label: "Workflow",
                                        },
                                        {
                                            value: "WORKFLOW_RUN",
                                            label: "Workflow Run",
                                        },
                                        {
                                            value: "SYNC_JOB",
                                            label: "Sync Job",
                                        },
                                        { value: "USER", label: "User" },
                                        { value: "SYSTEM", label: "System" },
                                    ]}
                                    value={filters.resourceTypes?.[0]}
                                    onChange={(value) =>
                                        handleFiltersChange({
                                            resourceTypes: value
                                                ? [
                                                      value as NotificationResourceType,
                                                  ]
                                                : undefined,
                                        })
                                    }
                                    size="xs"
                                    clearable
                                />
                            </Group>
                            <Select
                                placeholder="Show read/unread"
                                data={[
                                    { value: "unread", label: "Unread only" },
                                    { value: "read", label: "Read only" },
                                    {
                                        value: "all",
                                        label: "All notifications",
                                    },
                                ]}
                                value={
                                    filters.isRead === false
                                        ? "unread"
                                        : filters.isRead === true
                                          ? "read"
                                          : "all"
                                }
                                onChange={(value) =>
                                    handleFiltersChange({
                                        isRead:
                                            value === "unread"
                                                ? false
                                                : value === "read"
                                                  ? true
                                                  : undefined,
                                    })
                                }
                                size="xs"
                            />
                        </Stack>
                    )}
                </Stack>

                {/* Action buttons */}
                {stats.unread > 0 && (
                    <Group gap="xs">
                        <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconCheck size={14} />}
                            onClick={handleMarkAllRead}
                        >
                            Mark all read
                        </Button>
                        <Button
                            size="xs"
                            variant="light"
                            color="red"
                            leftSection={<IconBellOff size={14} />}
                            onClick={handleDismissAll}
                        >
                            Dismiss all
                        </Button>
                    </Group>
                )}

                <Divider />

                {/* Stats */}
                <Group gap="md" justify="center">
                    <Text size="xs" c="dimmed">
                        Total: {stats.total}
                    </Text>
                    <Text size="xs" c="dimmed">
                        Unread: {stats.unread}
                    </Text>
                    <Text size="xs" c="dimmed">
                        Showing: {stats.filtered}
                    </Text>
                </Group>

                <Divider />

                {/* Notifications list */}
                <ScrollArea style={{ flex: 1 }}>
                    <Stack gap="sm">
                        {isLoading && (
                            <Center py="xl">
                                <Loader size="sm" />
                            </Center>
                        )}

                        {error && (
                            <Text c="red" size="sm" ta="center">
                                {error}
                            </Text>
                        )}

                        {!isLoading &&
                            !error &&
                            filteredNotifications.length === 0 && (
                                <Center py="xl">
                                    <Stack gap="xs" align="center">
                                        <IconBellOff
                                            size={32}
                                            color="var(--mantine-color-gray-5)"
                                        />
                                        <Text c="dimmed" size="sm">
                                            {notifications.length === 0
                                                ? "No notifications yet"
                                                : "No notifications match your filters"}
                                        </Text>
                                    </Stack>
                                </Center>
                            )}

                        {!isLoading &&
                            !error &&
                            filteredNotifications.map((notification) => (
                                <NotificationTile
                                    key={notification.id}
                                    notification={notification}
                                    onRead={onRead}
                                    onDismiss={onDismiss}
                                    onAction={onAction}
                                    compact={finalConfig.compactMode}
                                />
                            ))}
                    </Stack>
                </ScrollArea>
            </Stack>
        </Paper>
    );
}
