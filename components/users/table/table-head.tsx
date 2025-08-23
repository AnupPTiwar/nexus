"use client";

import { Center, Group, Table, Text, UnstyledButton } from "@mantine/core";
import {
    IconChevronDown,
    IconChevronUp,
    IconSelector,
} from "@tabler/icons-react";

interface TableHeadProps {
    sortBy: string;
    sortOrder: "asc" | "desc";
    onSort: (field: string) => void;
}

interface ThProps {
    children: React.ReactNode;
    sortable?: boolean;
    field?: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    onSort?: (field: string) => void;
}

function Th({
    children,
    sortable = false,
    field,
    sortBy,
    sortOrder,
    onSort,
}: ThProps) {
    const Icon =
        sortable && field === sortBy
            ? sortOrder === "asc"
                ? IconChevronUp
                : IconChevronDown
            : IconSelector;

    return (
        <Table.Th>
            {sortable && field && onSort ? (
                <UnstyledButton
                    onClick={() => onSort(field)}
                    style={{ width: "100%" }}
                >
                    <Group justify="space-between">
                        <Text fw={500} size="sm">
                            {children}
                        </Text>
                        <Center>
                            <Icon size={14} stroke={1.5} />
                        </Center>
                    </Group>
                </UnstyledButton>
            ) : (
                <Text fw={500} size="sm">
                    {children}
                </Text>
            )}
        </Table.Th>
    );
}

export function TableHead({ sortBy, sortOrder, onSort }: TableHeadProps) {
    return (
        <Table.Thead>
            <Table.Tr>
                <Th sortBy={sortBy} sortOrder={sortOrder}>
                    User
                </Th>
                <Th
                    sortable
                    field="status"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                >
                    Status
                </Th>
                <Th sortBy={sortBy} sortOrder={sortOrder}>
                    Repositories
                </Th>
                <Th sortBy={sortBy} sortOrder={sortOrder}>
                    Workflow Runs
                </Th>
                <Th sortBy={sortBy} sortOrder={sortOrder}>
                    Permissions
                </Th>
                <Th
                    sortable
                    field="lastLoginAt"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                >
                    Last Login
                </Th>
                <Th sortBy={sortBy} sortOrder={sortOrder}>
                    Actions
                </Th>
            </Table.Tr>
        </Table.Thead>
    );
}
