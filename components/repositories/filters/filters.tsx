"use client";

import { Button, Group, Select, TextInput } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import type { RepositoriesQuery } from "@/lib/validations/repository";

interface FiltersProps {
    filters: RepositoriesQuery;
    onFiltersChange: (filters: Partial<RepositoriesQuery>) => void;
    onClearFilters: () => void;
}

export function Filters({ filters, onFiltersChange, onClearFilters }: FiltersProps) {
    const hasActiveFilters = Boolean(
        filters.search || 
        filters.visibility || 
        filters.isActive !== undefined || 
        filters.isSyncing !== undefined
    );

    return (
        <Group gap="md" mb="lg">
            <TextInput
                placeholder="Search repositories..."
                leftSection={<IconSearch size={16} />}
                value={filters.search || ""}
                onChange={(event) =>
                    onFiltersChange({ search: event.currentTarget.value || undefined })
                }
                style={{ flex: 1, minWidth: 200 }}
            />

            <Select
                placeholder="Visibility"
                data={[
                    { value: "PUBLIC", label: "Public" },
                    { value: "PRIVATE", label: "Private" },
                ]}
                value={filters.visibility || null}
                onChange={(value) =>
                    onFiltersChange({ visibility: value as "PUBLIC" | "PRIVATE" | undefined })
                }
                clearable
                w={150}
            />

            <Select
                placeholder="Status"
                data={[
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" },
                ]}
                value={filters.isActive !== undefined ? String(filters.isActive) : null}
                onChange={(value) =>
                    onFiltersChange({ 
                        isActive: value ? value === "true" : undefined 
                    })
                }
                clearable
                w={120}
            />

            <Select
                placeholder="Sync Status"
                data={[
                    { value: "true", label: "Syncing" },
                    { value: "false", label: "Not Syncing" },
                ]}
                value={filters.isSyncing !== undefined ? String(filters.isSyncing) : null}
                onChange={(value) =>
                    onFiltersChange({ 
                        isSyncing: value ? value === "true" : undefined 
                    })
                }
                clearable
                w={140}
            />

            <Select
                placeholder="Sort by"
                data={[
                    { value: "createdAt", label: "Created Date" },
                    { value: "name", label: "Name" },
                    { value: "githubOwner", label: "Owner" },
                    { value: "lastSyncAt", label: "Last Sync" },
                    { value: "visibility", label: "Visibility" },
                ]}
                value={filters.sortBy}
                onChange={(value) =>
                    onFiltersChange({ sortBy: value as any })
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
