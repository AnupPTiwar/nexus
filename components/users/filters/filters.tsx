"use client";

import { Button, Group, Select, TextInput } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import type { UsersQuery } from "@/lib/validations/user";
import type { UserStatus } from "@/prisma";

interface FiltersProps {
    filters: UsersQuery;
    onFiltersChange: (filters: Partial<UsersQuery>) => void;
    onClearFilters: () => void;
}

export function Filters({
    filters,
    onFiltersChange,
    onClearFilters,
}: FiltersProps) {
    const hasActiveFilters = Boolean(filters.search || filters.status);

    return (
        <Group gap="md" mb="lg">
            <TextInput
                placeholder="Search users..."
                leftSection={<IconSearch size={16} />}
                value={filters.search || ""}
                onChange={(event) =>
                    onFiltersChange({
                        search: event.currentTarget.value || undefined,
                    })
                }
                style={{ flex: 1, minWidth: 200 }}
            />

            <Select
                placeholder="Status"
                data={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "LOCKED", label: "Locked" },
                    {
                        value: "PENDING_VERIFICATION",
                        label: "Pending Verification",
                    },
                ]}
                value={filters.status || null}
                onChange={(value) =>
                    onFiltersChange({
                        status: (value as UserStatus) || undefined,
                    })
                }
                clearable
                w={180}
            />

            <Select
                placeholder="Sort by"
                data={[
                    { value: "createdAt", label: "Created Date" },
                    { value: "name", label: "Name" },
                    { value: "email", label: "Email" },
                    { value: "lastLoginAt", label: "Last Login" },
                    { value: "status", label: "Status" },
                ]}
                value={filters.sortBy}
                onChange={(value) =>
                    onFiltersChange({ sortBy: value as typeof filters.sortBy })
                }
                w={140}
            />

            <Select
                placeholder="Order"
                data={[
                    { value: "desc", label: "Descending" },
                    { value: "asc", label: "Ascending" },
                ]}
                value={filters.sortOrder}
                onChange={(value) =>
                    onFiltersChange({ sortOrder: value as "asc" | "desc" })
                }
                w={120}
            />

            {hasActiveFilters && (
                <Button
                    variant="light"
                    color="gray"
                    leftSection={<IconX size={16} />}
                    onClick={onClearFilters}
                >
                    Clear
                </Button>
            )}
        </Group>
    );
}
