"use client";

import { Button, Group, Pagination, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandGithub, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CreateRepositoryModal } from "@/components/repositories/create-repository-modal";
import { EditRepositoryModal } from "@/components/repositories/edit-repository-modal";
import { RepositoryTokenManager } from "@/components/repositories/repository-token-manager";
import { Filters } from "@/components/repositories/filters";
import { StatsContainer } from "@/components/repositories/stats";
import { TableContainer } from "@/components/repositories/table";
import { useRepositories } from "@/hooks/use-repositories";
import type {
    RepositoriesQuery,
    Repository,
} from "@/lib/validations/repository";

export default function RepositoriesPage() {
    const [
        createModalOpened,
        { open: openCreateModal, close: closeCreateModal },
    ] = useDisclosure(false);
    
    const [
        editModalOpened,
        { open: openEditModal, close: closeEditModal },
    ] = useDisclosure(false);
    
    const [
        tokenModalOpened,
        { open: openTokenModal, close: closeTokenModal },
    ] = useDisclosure(false);
    
    const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);

    const [filters, setFilters] = useState<RepositoriesQuery>({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    const { data, isLoading } = useRepositories(filters);

    const handleFiltersChange = (newFilters: Partial<RepositoriesQuery>) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
            page: newFilters.page || 1,
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            page: 1,
            limit: 10,
            sortBy: "createdAt",
            sortOrder: "desc",
        });
    };

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleEdit = (repository: Repository) => {
        setSelectedRepository(repository);
        openEditModal();
    };

    const handleManageTokens = (repository: Repository) => {
        setSelectedRepository(repository);
        openTokenModal();
    };

    return (
        <>
            <PageHeader
                title="Repositories"
                description="Manage your GitHub repositories and workflow integrations"
                icon={IconBrandGithub}
                color="dark"
            />

            <StatsContainer />

            <Group justify="space-between" mb="lg">
                <Filters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={handleClearFilters}
                />
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={openCreateModal}
                >
                    Add Repository
                </Button>
            </Group>

            <Stack gap="md">
                <TableContainer
                    repositories={data?.repositories || []}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onManageTokens={handleManageTokens}
                />

                {data?.pagination && data.pagination.totalPages > 1 && (
                    <Group justify="center">
                        <Pagination
                            total={data.pagination.totalPages}
                            value={data.pagination.page}
                            onChange={handlePageChange}
                        />
                    </Group>
                )}
            </Stack>

            <CreateRepositoryModal
                opened={createModalOpened}
                onClose={closeCreateModal}
            />
            
            <EditRepositoryModal
                opened={editModalOpened}
                onClose={closeEditModal}
                repository={selectedRepository}
            />
            
            <RepositoryTokenManager
                opened={tokenModalOpened}
                onClose={closeTokenModal}
                repository={selectedRepository}
            />
        </>
    );
}
