"use client";

import { Pagination, Stack } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { PageHeader } from "@/components/page-header";
import type { FilterValues } from "@/components/users/filters/filters";
import { Filters } from "@/components/users/filters/filters";
import { PermissionsModal } from "@/components/users/permissions-modal";
import { StatsContainer } from "@/components/users/stats";
import { TableContainer } from "@/components/users/table";
import { useUsers } from "@/hooks/use-users";
import type { User, UserStatus, UsersQuery } from "@/lib/validations/user";

export default function UsersPage() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [permissionsModalOpened, setPermissionsModalOpened] = useState(false);

    const [query, setQuery] = useState<UsersQuery>({
        page: 1,
        limit: 10,
        search: "",
        status: undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    const { data, isLoading } = useUsers(query);

    const handleFilterChange = useCallback((filters: FilterValues) => {
        setQuery((prev) => ({
            ...prev,
            page: 1, // Reset to first page when filtering
            search: filters.search,
            status: (filters.status || undefined) as UserStatus | undefined,
        }));
    }, []);

    const handleSort = useCallback((field: string) => {
        setQuery((prev) => ({
            ...prev,
            sortBy: field as UsersQuery["sortBy"],
            sortOrder:
                prev.sortBy === field && prev.sortOrder === "asc"
                    ? "desc"
                    : "asc",
        }));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setQuery((prev) => ({ ...prev, page }));
    }, []);

    const handleManagePermissions = useCallback((user: User) => {
        setSelectedUser(user);
        setPermissionsModalOpened(true);
    }, []);

    const handleClosePermissionsModal = useCallback(() => {
        setPermissionsModalOpened(false);
        setSelectedUser(null);
    }, []);

    return (
        <>
            <PageHeader
                title="Users"
                description="Manage team members and their access permissions"
                icon={IconUsers}
                color="cyan"
            />

            <Stack gap="lg">
                <StatsContainer />

                <Filters
                    onFilterChange={handleFilterChange}
                    isLoading={isLoading}
                />

                <TableContainer
                    users={data?.users || []}
                    isLoading={isLoading}
                    sortBy={query.sortBy}
                    sortOrder={query.sortOrder}
                    onSort={handleSort}
                    onManagePermissions={handleManagePermissions}
                />

                {data?.pagination && data.pagination.totalPages > 1 && (
                    <Pagination
                        total={data.pagination.totalPages}
                        value={data.pagination.page}
                        onChange={handlePageChange}
                        size="sm"
                        withEdges
                        style={{ alignSelf: "center" }}
                        disabled={isLoading}
                    />
                )}
            </Stack>

            <PermissionsModal
                opened={permissionsModalOpened}
                onClose={handleClosePermissionsModal}
                user={selectedUser}
            />
        </>
    );
}
