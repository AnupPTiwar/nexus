"use client";

import { Avatar, Badge, Button, Group, Stack, Table, Text } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import type { User } from "@/lib/validations/user";

interface TableRowProps {
    user: User;
    onManagePermissions: (user: User) => void;
}

const statusColors = {
    ACTIVE: "green",
    INACTIVE: "orange",
    LOCKED: "red",
    PENDING_VERIFICATION: "yellow",
};

export function UserTableRow({ user, onManagePermissions }: TableRowProps) {
    const formatDate = (date: Date | string | null) => {
        if (!date) return "Never";
        const d = new Date(date);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Table.Tr>
            <Table.Td>
                <Group gap="sm">
                    <Avatar
                        size="md"
                        radius="md"
                        src={user.image}
                    >
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </Avatar>
                    <Stack gap={2}>
                        <Text size="sm" fw={500}>
                            {user.name || "Unknown User"}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {user.email || "No email"}
                        </Text>
                    </Stack>
                </Group>
            </Table.Td>
            
            <Table.Td>
                <Badge
                    variant="light"
                    color={statusColors[user.status]}
                    size="sm"
                >
                    {user.status}
                </Badge>
            </Table.Td>
            
            <Table.Td>
                <Text size="sm">{user._count?.repositories || 0}</Text>
            </Table.Td>
            
            <Table.Td>
                <Text size="sm">{user._count?.workflowRuns || 0}</Text>
            </Table.Td>
            
            <Table.Td>
                <Badge variant="light" color="blue" size="sm">
                    {user.permissions.length} permissions
                </Badge>
            </Table.Td>
            
            <Table.Td>
                <Text size="sm" c="dimmed">
                    {formatDate(user.lastLoginAt)}
                </Text>
            </Table.Td>
            
            <Table.Td>
                <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<IconEdit size={14} />}
                    onClick={() => onManagePermissions(user)}
                >
                    Manage Permissions
                </Button>
            </Table.Td>
        </Table.Tr>
    );
}