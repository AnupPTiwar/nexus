"use client";

import {
    Center,
    Paper,
    ScrollArea,
    Skeleton,
    Table,
    Text,
} from "@mantine/core";
import type { User } from "@/lib/validations/user";
import { TableHead } from "./table-head";
import { UserTableRow } from "./table-row";

interface TableContainerProps {
    users: User[];
    isLoading: boolean;
    sortBy: string;
    sortOrder: "asc" | "desc";
    onSort: (field: string) => void;
    onManagePermissions: (user: User) => void;
}

export function TableContainer({
    users,
    isLoading,
    sortBy,
    sortOrder,
    onSort,
    onManagePermissions,
}: TableContainerProps) {
    if (isLoading) {
        return (
            <Paper radius="md" withBorder>
                <ScrollArea>
                    <Table striped highlightOnHover>
                        <TableHead
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSort={onSort}
                        />
                        <Table.Tbody>
                            {Array.from({ length: 5 }, (_, index) => index).map((id) => (
                                <Table.Tr key={`skeleton-${id}`}>
                                    <Table.Td>
                                        <Skeleton height={40} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Skeleton height={20} width={80} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Skeleton height={20} width={40} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Skeleton height={20} width={40} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Skeleton height={20} width={100} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Skeleton height={20} width={100} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Skeleton height={30} width={120} />
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Paper>
        );
    }

    if (users.length === 0) {
        return (
            <Paper radius="md" withBorder p="xl">
                <Center h={200}>
                    <Text c="dimmed">No users found</Text>
                </Center>
            </Paper>
        );
    }

    return (
        <Paper radius="md" withBorder>
            <ScrollArea>
                <Table striped highlightOnHover>
                    <TableHead
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={onSort}
                    />
                    <Table.Tbody>
                        {users.map((user) => (
                            <UserTableRow
                                key={user.id}
                                user={user}
                                onManagePermissions={onManagePermissions}
                            />
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Paper>
    );
}
