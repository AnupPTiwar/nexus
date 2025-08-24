"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
    CreateRepositoryToken,
    RepositoryToken,
    RepositoryTokensResponse,
    UpdateRepositoryToken,
} from "@/lib/validations/repository";

// Fetch repository tokens
export function useRepositoryTokens(repositoryId: string, enabled = true) {
    return useQuery<RepositoryTokensResponse>({
        queryKey: ["repository-tokens", repositoryId],
        queryFn: async () => {
            const response = await fetch(
                `/api/repositories/${repositoryId}/tokens`,
            );
            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to fetch repository tokens",
                );
            }
            return response.json();
        },
        enabled: !!repositoryId && enabled,
    });
}

// Create repository token
export function useCreateRepositoryToken(repositoryId: string) {
    const queryClient = useQueryClient();

    return useMutation<RepositoryToken, Error, CreateRepositoryToken>({
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
            // Invalidate and refetch repository tokens
            queryClient.invalidateQueries({
                queryKey: ["repository-tokens", repositoryId],
            });
            // Also invalidate repositories list in case token count changed
            queryClient.invalidateQueries({
                queryKey: ["repositories"],
            });
        },
    });
}

// Update repository token
export function useUpdateRepositoryToken(
    repositoryId: string,
    tokenId: string,
) {
    const queryClient = useQueryClient();

    return useMutation<RepositoryToken, Error, UpdateRepositoryToken>({
        mutationFn: async (data) => {
            const response = await fetch(
                `/api/repositories/${repositoryId}/tokens/${tokenId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to update repository token",
                );
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch repository tokens
            queryClient.invalidateQueries({
                queryKey: ["repository-tokens", repositoryId],
            });
        },
    });
}

// Delete repository token
export function useDeleteRepositoryToken(repositoryId: string) {
    const queryClient = useQueryClient();

    return useMutation<{ message: string }, Error, string>({
        mutationFn: async (tokenId) => {
            const response = await fetch(
                `/api/repositories/${repositoryId}/tokens/${tokenId}`,
                {
                    method: "DELETE",
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to delete repository token",
                );
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch repository tokens
            queryClient.invalidateQueries({
                queryKey: ["repository-tokens", repositoryId],
            });
            // Also invalidate repositories list in case token count changed
            queryClient.invalidateQueries({
                queryKey: ["repositories"],
            });
        },
    });
}

// Validate repository token with GitHub
export function useValidateRepositoryToken(repositoryId: string) {
    const queryClient = useQueryClient();

    return useMutation<
        RepositoryToken,
        Error,
        { tokenId: string; token: string }
    >({
        mutationFn: async ({ tokenId, token }) => {
            const response = await fetch(
                `/api/repositories/${repositoryId}/tokens/${tokenId}/validate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to validate repository token",
                );
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch repository tokens
            queryClient.invalidateQueries({
                queryKey: ["repository-tokens", repositoryId],
            });
        },
    });
}
