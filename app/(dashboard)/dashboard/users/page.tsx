"use client";

import { Button, Group, Pagination, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconUsers } from "@tabler/icons-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Filters } from "@/components/users/filters";
import { PermissionsModal } from "@/components/users/permissions-modal";
import { StatsContainer } from "@/components/users/stats";
import { TableContainer } from "@/components/users/table";
import { useUsers } from "@/hooks/use-users";
import type { User, UsersQuery } from "@/lib/validations/user";

export default function UsersPage() {
    const [
        permissionsModalOpened,
        { open: openPermissionsModal, close: closePermissionsModal },
    ] = useDisclosure(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [filters, setFilters] = useState<UsersQuery>({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    const { data, isLoading } = useUsers(filters);

    const handleFiltersChange = (newFilters: Partial<UsersQuery>) => {
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

    const handleEdit = (user: User) => {
        console.log("Edit user:", user);
    };

    const handleManagePermissions = (user: User) => {
        setSelectedUser(user);
        openPermissionsModal();
    };

    const handlePermissionsClose = () => {
        setSelectedUser(null);
        closePermissionsModal();
    };

    return (
        <>
            <PageHeader
                title="Users"
                description="Manage user access and permissions"
                icon={IconUsers}
                color="blue"
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
                    onClick={() => console.log("Add user")}
                >
                    Add User
                </Button>
            </Group>

            <Stack gap="md">
                <TableContainer
                    users={data?.users || []}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onManagePermissions={handleManagePermissions}
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

            {selectedUser && (
                <PermissionsModal
                    opened={permissionsModalOpened}
                    onClose={handlePermissionsClose}
                    user={selectedUser}
                />
            )}
        </>
    );
}
