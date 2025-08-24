"use client";

import { Center, Paper, Skeleton, Stack, Table, Text } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import type { User } from "@/lib/validations/user";
import { TableHead } from "./table-head";
import { UserTableRow } from "./table-row";

interface TableContainerProps {
    users: User[];
    isLoading: boolean;
    onEdit: (user: User) => void;
    onManagePermissions: (user: User) => void;
}

export function TableContainer({
    users,
    isLoading,
    onEdit,
    onManagePermissions,
}: TableContainerProps) {
    if (isLoading) {
        return (
            <Paper withBorder radius="md">
                <Table>
                    <TableHead />
                    <Table.Tbody>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Table.Tr key={index}>
                                {Array.from({ length: 8 }).map(
                                    (_, cellIndex) => (
                                        <Table.Td key={cellIndex}>
                                            <Skeleton height={20} width="80%" />
                                        </Table.Td>
                                    ),
                                )}
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
        );
    }

    if (users.length === 0) {
        return (
            <Paper withBorder radius="md" p="xl">
                <Center>
                    <Stack align="center" gap="md">
                        <IconUsers
                            size={48}
                            stroke={1.5}
                            color="var(--mantine-color-gray-5)"
                        />
                        <Stack align="center" gap="xs">
                            <Text size="lg" fw={500}>
                                No users found
                            </Text>
                            <Text size="sm" c="dimmed" ta="center">
                                No users match your current filters
                            </Text>
                        </Stack>
                    </Stack>
                </Center>
            </Paper>
        );
    }

    return (
        <Paper withBorder radius="md">
            <Table>
                <TableHead />
                <Table.Tbody>
                    {users.map((user) => (
                        <UserTableRow
                            key={user.id}
                            user={user}
                            onEdit={onEdit}
                            onManagePermissions={onManagePermissions}
                        />
                    ))}
                </Table.Tbody>
            </Table>
        </Paper>
    );
}