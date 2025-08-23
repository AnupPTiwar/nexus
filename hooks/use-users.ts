"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserPermissions, User, UsersQuery, UsersResponse } from "@/lib/validations/user";

const USERS_QUERY_KEY = "users";

// Fetch users hook
export function useUsers(params: UsersQuery) {
    return useQuery<UsersResponse>({
        queryKey: [USERS_QUERY_KEY, params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });

            const response = await fetch(`/api/users?${searchParams.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            return response.json();
        },
    });
}

// Update user permissions hook
export function useUpdateUserPermissions(userId: string) {
    const queryClient = useQueryClient();

    return useMutation<User, Error, UpdateUserPermissions>({
        mutationFn: async (data) => {
            const response = await fetch(`/api/users/${userId}/permissions`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to update user permissions");
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate users query to refetch
            queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
        },
    });
}

// User stats hook
export function useUserStats() {
    return useQuery({
        queryKey: ["user-stats"],
        queryFn: async () => {
            // For now, return static data
            // Later this can be replaced with an actual API call
            return {
                totalUsers: 156,
                activeUsers: 142,
                inactiveUsers: 8,
                lockedUsers: 6,
                newUsersThisMonth: 12,
                averagePermissions: 4.2,
            };
        },
    });
}