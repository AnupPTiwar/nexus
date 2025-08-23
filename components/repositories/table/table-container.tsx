"use client";

import { Center, Paper, Skeleton, Stack, Table, Text } from "@mantine/core";
import { IconDatabase } from "@tabler/icons-react";
import type { Repository } from "@/lib/validations/repository";
import { TableHead } from "./table-head";
import { RepositoryTableRow } from "./table-row";

interface TableContainerProps {
    repositories: Repository[];
    isLoading: boolean;
    onEdit: (repository: Repository) => void;
    onManageTokens: (repository: Repository) => void;
}

export function TableContainer({
    repositories,
    isLoading,
    onEdit,
    onManageTokens,
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

    if (repositories.length === 0) {
        return (
            <Paper withBorder radius="md" p="xl">
                <Center>
                    <Stack align="center" gap="md">
                        <IconDatabase
                            size={48}
                            stroke={1.5}
                            color="var(--mantine-color-gray-5)"
                        />
                        <Stack align="center" gap="xs">
                            <Text size="lg" fw={500}>
                                No repositories found
                            </Text>
                            <Text size="sm" c="dimmed" ta="center">
                                Add your first repository to get started with
                                workflow management
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
                    {repositories.map((repository) => (
                        <RepositoryTableRow
                            key={repository.id}
                            repository={repository}
                            onEdit={onEdit}
                            onManageTokens={onManageTokens}
                        />
                    ))}
                </Table.Tbody>
            </Table>
        </Paper>
    );
}
