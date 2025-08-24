"use client";

import { useCallback, useState } from "react";
import {
    useCreateRepositoryToken,
    useDeleteRepositoryToken,
    useRepositoryTokens,
    useUpdateRepositoryToken,
} from "@/hooks/use-repository-tokens";
import type {
    CreateRepositoryToken,
    Repository,
    UpdateRepositoryToken,
} from "@/lib/validations/repository";
import { RepositoryTokenModal } from "./repository-token-modal";

interface RepositoryTokenManagerProps {
    opened: boolean;
    onClose: () => void;
    repository: Repository | null;
}

export function RepositoryTokenManager({
    opened,
    onClose,
    repository,
}: RepositoryTokenManagerProps) {
    const [editingTokenId, setEditingTokenId] = useState<string>("");

    // Fetch tokens when modal is opened and repository is available
    const {
        data: tokensData,
        isLoading: isLoadingTokens,
        error: tokensError,
    } = useRepositoryTokens(repository?.id || "", opened && !!repository?.id);

    // Mutations - all hooks called at top level
    const createTokenMutation = useCreateRepositoryToken(repository?.id || "");
    const updateTokenMutation = useUpdateRepositoryToken(
        repository?.id || "",
        editingTokenId,
    );
    const deleteTokenMutation = useDeleteRepositoryToken(repository?.id || "");

    // Handlers
    const handleCreateToken = useCallback(
        async (data: CreateRepositoryToken) => {
            if (!repository?.id) throw new Error("Repository ID is required");
            await createTokenMutation.mutateAsync(data);
        },
        [repository?.id, createTokenMutation],
    );

    const handleUpdateToken = useCallback(
        async (tokenId: string, data: UpdateRepositoryToken) => {
            if (!repository?.id) throw new Error("Repository ID is required");

            // Set the token ID for the mutation hook
            setEditingTokenId(tokenId);

            try {
                // Use the update mutation
                await updateTokenMutation.mutateAsync(data);
            } finally {
                // Reset the editing token ID
                setEditingTokenId("");
            }
        },
        [repository?.id, updateTokenMutation],
    );

    const handleDeleteToken = useCallback(
        async (tokenId: string) => {
            if (!repository?.id) throw new Error("Repository ID is required");
            await deleteTokenMutation.mutateAsync(tokenId);
        },
        [repository?.id, deleteTokenMutation],
    );

    // Handle errors
    if (tokensError) {
        console.error("Error loading repository tokens:", tokensError);
    }

    return (
        <RepositoryTokenModal
            opened={opened}
            onClose={onClose}
            repository={repository}
            tokens={tokensData?.tokens || []}
            onCreateToken={handleCreateToken}
            onUpdateToken={handleUpdateToken}
            onDeleteToken={handleDeleteToken}
        />
    );
}
