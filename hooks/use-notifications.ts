"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
    Notification,
    NotificationFilters,
    NotificationStats,
} from "@/types/notification";

interface NotificationsQuery extends NotificationFilters {
    limit?: number;
    offset?: number;
}

interface NotificationsResponse {
    notifications: Notification[];
    total: number;
    hasMore: boolean;
}

// Fetch notifications with filters
export function useNotifications(query: NotificationsQuery = {}) {
    return useQuery<NotificationsResponse>({
        queryKey: ["notifications", query],
        queryFn: async () => {
            const searchParams = new URLSearchParams();

            // Add query parameters
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (Array.isArray(value)) {
                        value.forEach((v) => {
                            searchParams.append(key, String(v));
                        });
                    } else if (
                        key === "dateRange" &&
                        typeof value === "object"
                    ) {
                        searchParams.append(
                            "dateFrom",
                            value.from.toISOString(),
                        );
                        searchParams.append("dateTo", value.to.toISOString());
                    } else {
                        searchParams.append(key, String(value));
                    }
                }
            });

            const response = await fetch(`/api/notifications?${searchParams}`);
            if (!response.ok) throw new Error("Failed to fetch notifications");
            return response.json();
        },
        staleTime: 30 * 1000, // 30 seconds
    });
}

// Get notification statistics
export function useNotificationStats() {
    return useQuery<NotificationStats>({
        queryKey: ["notifications", "stats"],
        queryFn: async () => {
            const response = await fetch("/api/notifications/stats");
            if (!response.ok)
                throw new Error("Failed to fetch notification stats");
            return response.json();
        },
        staleTime: 30 * 1000, // 30 seconds
    });
}

// Mark notification as read
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (notificationId) => {
            const response = await fetch(
                `/api/notifications/${notificationId}/read`,
                {
                    method: "POST",
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to mark notification as read",
                );
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            const response = await fetch("/api/notifications/read-all", {
                method: "POST",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to mark all notifications as read",
                );
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

// Dismiss (delete) notification
export function useDismissNotification() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (notificationId) => {
            const response = await fetch(
                `/api/notifications/${notificationId}`,
                {
                    method: "DELETE",
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to dismiss notification",
                );
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

// Dismiss all notifications
export function useDismissAllNotifications() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            const response = await fetch("/api/notifications", {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to dismiss all notifications",
                );
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

// Real-time notifications via SSE
export function useNotificationStream() {
    const queryClient = useQueryClient();

    return useQuery<EventSource | null>({
        queryKey: ["notifications", "stream"],
        queryFn: async () => {
            const eventSource = new EventSource("/api/notifications/stream");

            eventSource.onmessage = (event) => {
                try {
                    const notificationEvent = JSON.parse(event.data);

                    // Invalidate queries to refetch notifications
                    queryClient.invalidateQueries({
                        queryKey: ["notifications"],
                    });

                    // Could also show toast notifications here
                    console.log("New notification:", notificationEvent);
                } catch (error) {
                    console.error("Failed to parse notification event:", error);
                }
            };

            eventSource.onerror = (error) => {
                console.error("Notification stream error:", error);
                eventSource.close();
            };

            return eventSource;
        },
        staleTime: Number.POSITIVE_INFINITY, // Keep connection open
        gcTime: Number.POSITIVE_INFINITY, // Don't garbage collect
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
