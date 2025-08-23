"use client";

import { Button, Group, Pagination, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandGithub, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CreateRepositoryModal } from "@/components/repositories/create-repository-modal";
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
        console.log("Edit repository:", repository);
    };

    const handleManageTokens = (repository: Repository) => {
        console.log("Manage tokens for repository:", repository);
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
        </>
    );
}
