"use client";

import { Button, Group, Paper, Select, TextInput } from "@mantine/core";
import { IconFilter, IconSearch, IconX } from "@tabler/icons-react";
import { useState } from "react";

interface FiltersProps {
    onFilterChange: (filters: FilterValues) => void;
    isLoading?: boolean;
}

export interface FilterValues {
    search: string;
    status: string;
}

export function Filters({ onFilterChange, isLoading = false }: FiltersProps) {
    const [filters, setFilters] = useState<FilterValues>({
        search: "",
        status: "",
    });

    const handleSearchChange = (value: string) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleStatusChange = (value: string | null) => {
        const newFilters = { ...filters, status: value || "" };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearFilters = () => {
        const newFilters = { search: "", status: "" };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const hasActiveFilters = filters.search || filters.status;

    return (
        <Paper p="md" radius="md" withBorder mb="lg">
            <Group justify="space-between">
                <Group gap="md" style={{ flex: 1 }}>
                    <TextInput
                        placeholder="Search by name or email..."
                        leftSection={<IconSearch size={16} />}
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.currentTarget.value)}
                        disabled={isLoading}
                        style={{ flex: 1, maxWidth: 300 }}
                    />
                    
                    <Select
                        placeholder="Filter by status"
                        data={[
                            { value: "ACTIVE", label: "Active" },
                            { value: "INACTIVE", label: "Inactive" },
                            { value: "LOCKED", label: "Locked" },
                            { value: "PENDING_VERIFICATION", label: "Pending Verification" },
                        ]}
                        value={filters.status}
                        onChange={handleStatusChange}
                        clearable
                        disabled={isLoading}
                        leftSection={<IconFilter size={16} />}
                        style={{ width: 200 }}
                    />
                </Group>

                {hasActiveFilters && (
                    <Button
                        variant="subtle"
                        leftSection={<IconX size={16} />}
                        onClick={handleClearFilters}
                        disabled={isLoading}
                    >
                        Clear filters
                    </Button>
                )}
            </Group>
        </Paper>
    );
}