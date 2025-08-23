"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
    CreateRepository,
    CreateRepositoryToken,
    RepositoriesQuery,
    RepositoriesResponse,
    Repository,
    RepositoryStats,
    RepositoryTokensResponse,
    SyncRepository,
    UpdateRepository,
} from "@/lib/validations/repository";

const REPOSITORIES_QUERY_KEY = "repositories";
const REPOSITORY_STATS_QUERY_KEY = "repository-stats";
const REPOSITORY_TOKENS_QUERY_KEY = "repository-tokens";

// Fetch repositories hook
export function useRepositories(params: RepositoriesQuery) {
    return useQuery<RepositoriesResponse>({
        queryKey: [REPOSITORIES_QUERY_KEY, params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });

            const response = await fetch(
                `/api/repositories?${searchParams.toString()}`,
            );
            if (!response.ok) {
                throw new Error("Failed to fetch repositories");
            }
            return response.json();
        },
    });
}

// Fetch single repository hook
export function useRepository(repositoryId: string) {
    return useQuery<Repository>({
        queryKey: [REPOSITORIES_QUERY_KEY, repositoryId],
        queryFn: async () => {
            const response = await fetch(`/api/repositories/${repositoryId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch repository");
            }
            return response.json();
        },
        enabled: !!repositoryId,
    });
}

// Create repository hook
export function useCreateRepository() {
    const queryClient = useQueryClient();

    return useMutation<Repository, Error, CreateRepository>({
        mutationFn: async (data) => {
            const response = await fetch("/api/repositories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create repository");
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate repositories query to refetch
            queryClient.invalidateQueries({
                queryKey: [REPOSITORIES_QUERY_KEY],
            });
            queryClient.invalidateQueries({
                queryKey: [REPOSITORY_STATS_QUERY_KEY],
            });
        },
    });
}

// Update repository hook
export function useUpdateRepository(repositoryId: string) {
    const queryClient = useQueryClient();

    return useMutation<Repository, Error, UpdateRepository>({
        mutationFn: async (data) => {
            const response = await fetch(`/api/repositories/${repositoryId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update repository");
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate queries to refetch
            queryClient.invalidateQueries({
                queryKey: [REPOSITORIES_QUERY_KEY],
            });
            queryClient.invalidateQueries({
                queryKey: [REPOSITORIES_QUERY_KEY, repositoryId],
            });
            queryClient.invalidateQueries({
                queryKey: [REPOSITORY_STATS_QUERY_KEY],
            });
        },
    });
}

// Delete repository hook
export function useDeleteRepository() {
    const queryClient = useQueryClient();

    return useMutation<{ message: string }, Error, string>({
        mutationFn: async (repositoryId) => {
            const response = await fetch(`/api/repositories/${repositoryId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete repository");
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate repositories query to refetch
            queryClient.invalidateQueries({
                queryKey: [REPOSITORIES_QUERY_KEY],
            });
            queryClient.invalidateQueries({
                queryKey: [REPOSITORY_STATS_QUERY_KEY],
            });
        },
    });
}

// Sync repository hook
export function useSyncRepository(repositoryId: string) {
    const queryClient = useQueryClient();

    return useMutation<
        { message: string; repositoryId: string; force: boolean },
        Error,
        SyncRepository
    >({
        mutationFn: async (data) => {
            const response = await fetch(
                `/api/repositories/${repositoryId}/sync`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to sync repository");
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate queries to refetch
            queryClient.invalidateQueries({
                queryKey: [REPOSITORIES_QUERY_KEY],
            });
            queryClient.invalidateQueries({
                queryKey: [REPOSITORIES_QUERY_KEY, repositoryId],
            });
        },
    });
}

// Repository stats hook
export function useRepositoryStats() {
    return useQuery<RepositoryStats>({
        queryKey: [REPOSITORY_STATS_QUERY_KEY],
        queryFn: async () => {
            const response = await fetch("/api/repositories/stats");
            if (!response.ok) {
                throw new Error("Failed to fetch repository stats");
            }
            return response.json();
        },
    });
}

// Repository tokens hooks
export function useRepositoryTokens(
    repositoryId: string,
    params: { page?: number; limit?: number } = {},
) {
    return useQuery<RepositoryTokensResponse>({
        queryKey: [REPOSITORY_TOKENS_QUERY_KEY, repositoryId, params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });

            const response = await fetch(
                `/api/repositories/${repositoryId}/tokens?${searchParams.toString()}`,
            );
            if (!response.ok) {
                throw new Error("Failed to fetch repository tokens");
            }
            return response.json();
        },
        enabled: !!repositoryId,
    });
}

// Create repository token hook
export function useCreateRepositoryToken(repositoryId: string) {
    const queryClient = useQueryClient();

    return useMutation<any, Error, CreateRepositoryToken>({
        mutationFn: async (data) => {
            const response = await fetch(
                `/api/repositories/${repositoryId}/tokens`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to create repository token",
                );
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate repository tokens query to refetch
            queryClient.invalidateQueries({
                queryKey: [REPOSITORY_TOKENS_QUERY_KEY, repositoryId],
            });
        },
    });
}
