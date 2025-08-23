"use client";

import {
    Avatar,
    Badge,
    Button,
    Checkbox,
    Divider,
    Group,
    Modal,
    Paper,
    ScrollArea,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconShieldCheck, IconUserEdit } from "@tabler/icons-react";
import { useState } from "react";
import { useUpdateUserPermissions } from "@/hooks/use-users";
import type {
    ResourceAction,
    ResourceType,
    User,
} from "@/lib/validations/user";

interface PermissionsModalProps {
    opened: boolean;
    onClose: () => void;
    user: User | null;
}

const RESOURCE_TYPES: ResourceType[] = [
    "USER",
    "REPOSITORY",
    "WORKFLOW",
    "WORKFLOW_RUN",
    "TOKEN",
    "AUDIT",
    "NOTIFICATION",
];

const RESOURCE_ACTIONS: ResourceAction[] = [
    "READ",
    "CREATE",
    "UPDATE",
    "DELETE",
    "MANAGE",
];

const ACTION_DESCRIPTIONS = {
    READ: "View and list resources",
    CREATE: "Create new resources",
    UPDATE: "Modify existing resources",
    DELETE: "Remove resources",
    MANAGE: "Full administrative control",
};

export function PermissionsModal({
    opened,
    onClose,
    user,
}: PermissionsModalProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
        new Set(user?.permissions || []),
    );

    const updatePermissions = useUpdateUserPermissions(user?.id || "");

    const handleTogglePermission = (permission: string) => {
        const newPermissions = new Set(selectedPermissions);
        if (newPermissions.has(permission)) {
            newPermissions.delete(permission);
        } else {
            newPermissions.add(permission);
        }
        setSelectedPermissions(newPermissions);
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            await updatePermissions.mutateAsync({
                permissions: Array.from(selectedPermissions),
            });
            notifications.show({
                title: "Success",
                message: "User permissions updated successfully",
                color: "green",
            });
            onClose();
        } catch {
            notifications.show({
                title: "Error",
                message: "Failed to update permissions",
                color: "red",
            });
        }
    };

    const handleSelectAll = (resource: ResourceType) => {
        const newPermissions = new Set(selectedPermissions);
        RESOURCE_ACTIONS.forEach((action) => {
            newPermissions.add(`${resource}:${action}`);
        });
        setSelectedPermissions(newPermissions);
    };

    const handleDeselectAll = (resource: ResourceType) => {
        const newPermissions = new Set(selectedPermissions);
        RESOURCE_ACTIONS.forEach((action) => {
            newPermissions.delete(`${resource}:${action}`);
        });
        setSelectedPermissions(newPermissions);
    };

    if (!user) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconUserEdit size={20} />
                    <Text fw={600}>Manage User Permissions</Text>
                </Group>
            }
            size="xl"
        >
            <Stack gap="md">
                {/* User Info */}
                <Paper p="md" radius="md" withBorder>
                    <Group gap="md">
                        <Avatar size="lg" radius="md" src={user.image}>
                            {user.name?.[0]?.toUpperCase() ||
                                user.email?.[0]?.toUpperCase() ||
                                "U"}
                        </Avatar>
                        <Stack gap={2}>
                            <Group gap="xs">
                                <Text fw={600} size="lg">
                                    {user.name || "Unknown User"}
                                </Text>
                                <Badge variant="light" color="blue" size="sm">
                                    {user.status}
                                </Badge>
                            </Group>
                            <Text size="sm" c="dimmed">
                                {user.email || "No email"}
                            </Text>
                            <Group gap="xs" mt="xs">
                                <IconShieldCheck size={14} />
                                <Text size="xs" c="dimmed">
                                    Currently has {user.permissions.length}{" "}
                                    permissions
                                </Text>
                            </Group>
                        </Stack>
                    </Group>
                </Paper>

                <Divider />

                {/* Permissions Grid */}
                <ScrollArea h={400}>
                    <Stack gap="lg">
                        {RESOURCE_TYPES.map((resource) => (
                            <Paper key={resource} p="md" radius="md" withBorder>
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Title order={5}>{resource}</Title>
                                        <Group gap="xs">
                                            <Button
                                                size="xs"
                                                variant="light"
                                                onClick={() =>
                                                    handleSelectAll(resource)
                                                }
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                onClick={() =>
                                                    handleDeselectAll(resource)
                                                }
                                            >
                                                Clear
                                            </Button>
                                        </Group>
                                    </Group>

                                    <Stack gap="xs">
                                        {RESOURCE_ACTIONS.map((action) => {
                                            const permission = `${resource}:${action}`;
                                            return (
                                                <Checkbox
                                                    key={permission}
                                                    label={
                                                        <Group gap="xs">
                                                            <Badge
                                                                variant="light"
                                                                size="sm"
                                                            >
                                                                {action}
                                                            </Badge>
                                                            <Text
                                                                size="xs"
                                                                c="dimmed"
                                                            >
                                                                {
                                                                    ACTION_DESCRIPTIONS[
                                                                        action
                                                                    ]
                                                                }
                                                            </Text>
                                                        </Group>
                                                    }
                                                    checked={selectedPermissions.has(
                                                        permission,
                                                    )}
                                                    onChange={() =>
                                                        handleTogglePermission(
                                                            permission,
                                                        )
                                                    }
                                                />
                                            );
                                        })}
                                    </Stack>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </ScrollArea>

                <Divider />

                {/* Actions */}
                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        {selectedPermissions.size} permissions selected
                    </Text>
                    <Group>
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            loading={updatePermissions.isPending}
                            leftSection={<IconShieldCheck size={16} />}
                        >
                            Save Permissions
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    );
}
