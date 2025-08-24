"use client";

import {
    ActionIcon,
    Avatar,
    Badge,
    Group,
    Table,
    Text,
    Tooltip,
} from "@mantine/core";
import { IconEdit, IconShield } from "@tabler/icons-react";
import type { User } from "@/lib/validations/user";

interface UserTableRowProps {
    user: User;
    onEdit: (user: User) => void;
    onManagePermissions: (user: User) => void;
}

export function UserTableRow({
    user,
    onEdit,
    onManagePermissions,
}: UserTableRowProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "green";
            case "INACTIVE":
                return "orange";
            case "LOCKED":
                return "red";
            case "PENDING_VERIFICATION":
                return "yellow";
            default:
                return "gray";
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "Never";
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Table.Tr>
            <Table.Td>
                <Group gap="sm">
                    <Avatar src={user.image} alt={user.name || ""} size="sm">
                        {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text size="sm" fw={500}>
                        {user.name || "Unknown User"}
                    </Text>
                </Group>
            </Table.Td>

            <Table.Td>
                <Text size="sm" c="dimmed">
                    {user.email || "No email"}
                </Text>
            </Table.Td>

            <Table.Td>
                <Badge
                    size="sm"
                    variant="light"
                    color={getStatusColor(user.status)}
                >
                    {user.status.replace(/_/g, " ")}
                </Badge>
            </Table.Td>

            <Table.Td>
                <Badge size="sm" variant="light" color="blue">
                    {user.permissions.length} permissions
                </Badge>
            </Table.Td>

            <Table.Td>
                <Text size="sm" c="dimmed">
                    {formatDate(user.lastLoginAt)}
                </Text>
            </Table.Td>

            <Table.Td>
                <Text size="sm">{user._count?.repositories || 0}</Text>
            </Table.Td>

            <Table.Td>
                <Text size="sm">{user._count?.workflowRuns || 0}</Text>
            </Table.Td>

            <Table.Td>
                <Group gap="xs">
                    <Tooltip label="Edit user">
                        <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={() => onEdit(user)}
                        >
                            <IconEdit size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Manage permissions">
                        <ActionIcon
                            variant="light"
                            color="grape"
                            size="sm"
                            onClick={() => onManagePermissions(user)}
                        >
                            <IconShield size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    );
}
