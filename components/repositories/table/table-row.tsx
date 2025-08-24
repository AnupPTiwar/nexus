"use client";

import {
    ActionIcon,
    Badge,
    Group,
    Menu,
    Stack,
    Table,
    Text,
    Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
    IconBrandGithub,
    IconDots,
    IconEdit,
    IconEye,
    IconEyeOff,
    IconKey,
    IconRefresh,
    IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useSession } from "next-auth/react";
import {
    useDeleteRepository,
    useSyncRepository,
} from "@/hooks/use-repositories";
import { hasPermission } from "@/lib/permission";
import type { Repository } from "@/lib/validations/repository";

dayjs.extend(relativeTime);

interface RepositoryTableRowProps {
    repository: Repository;
    onEdit: (repository: Repository) => void;
    onManageTokens: (repository: Repository) => void;
}

export function RepositoryTableRow({
    repository,
    onEdit,
    onManageTokens,
}: RepositoryTableRowProps) {
    const { data: session } = useSession();
    const syncMutation = useSyncRepository(repository.id);
    const deleteMutation = useDeleteRepository();

    // Check if user can edit this repository
    const isOwner = repository.user?.email === session?.user?.email;
    const isPublic = repository.visibility === "PUBLIC";
    const hasManagePermission = session?.user?.permissions
        ? hasPermission(session.user.permissions, "REPOSITORY:MANAGE")
        : false;
    const canEdit = isOwner || (isPublic && hasManagePermission);

    const handleSync = async () => {
        try {
            await syncMutation.mutateAsync({
                force: false,
                syncWorkflows: true,
                syncRuns: true,
                syncBranches: true,
                fullSync: false,
            });
            notifications.show({
                title: "Sync Started",
                message: `Repository "${repository.name}" sync has been initiated.`,
                color: "blue",
            });
        } catch (error) {
            notifications.show({
                title: "Sync Failed",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to sync repository",
                color: "red",
            });
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${repository.name}"?`)) {
            return;
        }

        try {
            await deleteMutation.mutateAsync(repository.id);
            notifications.show({
                title: "Repository Deleted",
                message: `Repository "${repository.name}" has been deleted.`,
                color: "green",
            });
        } catch (error) {
            notifications.show({
                title: "Delete Failed",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete repository",
                color: "red",
            });
        }
    };

    const getStatusBadge = () => {
        if (repository.isSyncing) {
            return (
                <Badge color="blue" variant="light">
                    Syncing
                </Badge>
            );
        }
        if (repository.isActive) {
            return (
                <Badge color="green" variant="light">
                    Active
                </Badge>
            );
        }
        return (
            <Badge color="red" variant="light">
                Inactive
            </Badge>
        );
    };

    const getVisibilityIcon = () => {
        return repository.visibility === "PUBLIC" ? (
            <IconEye size={16} />
        ) : (
            <IconEyeOff size={16} />
        );
    };

    return (
        <Table.Tr>
            <Table.Td>
                <Group gap="sm">
                    <ActionIcon
                        variant="light"
                        color="dark"
                        size="sm"
                        component="a"
                        href={repository.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <IconBrandGithub size={16} />
                    </ActionIcon>
                    <Stack gap={0}>
                        <Text size="sm" fw={500}>
                            {repository.name}
                        </Text>
                        {repository.description && (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                                {repository.description}
                            </Text>
                        )}
                    </Stack>
                </Group>
            </Table.Td>

            <Table.Td>
                <Text size="sm">{repository.githubOwner}</Text>
            </Table.Td>

            <Table.Td>
                <Group gap="xs">
                    {getVisibilityIcon()}
                    <Text size="sm" tt="capitalize">
                        {repository.visibility.toLowerCase()}
                    </Text>
                </Group>
            </Table.Td>

            <Table.Td>{getStatusBadge()}</Table.Td>

            <Table.Td>
                <Text size="sm">{repository._count?.workflows || 0}</Text>
            </Table.Td>

            <Table.Td>
                <Text size="sm">
                    {repository._count?.repositoryTokens || 0}
                </Text>
            </Table.Td>

            <Table.Td>
                <Text size="sm" c="dimmed">
                    {repository.lastSyncAt
                        ? dayjs(repository.lastSyncAt).fromNow()
                        : "Never"}
                </Text>
            </Table.Td>

            <Table.Td>
                <Group gap="xs">
                    <Tooltip label="Sync Repository">
                        <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={handleSync}
                            loading={syncMutation.isPending}
                            disabled={repository.isSyncing}
                        >
                            <IconRefresh size={16} />
                        </ActionIcon>
                    </Tooltip>

                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <ActionIcon variant="light" color="gray" size="sm">
                                <IconDots size={16} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            {canEdit && (
                                <Menu.Item
                                    leftSection={<IconEdit size={16} />}
                                    onClick={() => onEdit(repository)}
                                >
                                    Edit Repository
                                </Menu.Item>
                            )}
                            <Menu.Item
                                leftSection={<IconKey size={16} />}
                                onClick={() => onManageTokens(repository)}
                            >
                                Manage Tokens
                            </Menu.Item>
                            {canEdit && <Menu.Divider />}
                            {canEdit && (
                                <Menu.Item
                                    leftSection={<IconTrash size={16} />}
                                    color="red"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                >
                                    Delete Repository
                                </Menu.Item>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Table.Td>
        </Table.Tr>
    );
}
