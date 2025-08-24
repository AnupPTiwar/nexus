"use client";

import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Group,
    Loader,
    Modal,
    Paper,
    Select,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
    Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
    IconCheck,
    IconCopy,
    IconEdit,
    IconEye,
    IconEyeOff,
    IconInfoCircle,
    IconKey,
    IconPlus,
    IconShieldCheck,
    IconTrash,
    IconUser,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
    canCreateRepositoryToken,
    canDeleteRepositoryToken,
    canUpdateRepositoryToken,
} from "@/lib/permission";
import type {
    CreateRepositoryToken,
    Repository,
    RepositoryToken,
} from "@/lib/validations/repository";

interface RepositoryTokenModalProps {
    opened: boolean;
    onClose: () => void;
    repository: Repository | null;
    tokens: RepositoryToken[];
    onCreateToken?: (data: CreateRepositoryToken) => Promise<void>;
    onUpdateToken?: (
        tokenId: string,
        data: {
            alias?: string;
            type?: "PUBLIC" | "PRIVATE";
            isActive?: boolean;
        },
    ) => Promise<void>;
    onDeleteToken?: (tokenId: string) => Promise<void>;
}

export function RepositoryTokenModal({
    opened,
    onClose,
    repository,
    tokens,
    onCreateToken,
    onUpdateToken,
    onDeleteToken,
}: RepositoryTokenModalProps) {
    const { data: session } = useSession();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingToken, setEditingToken] = useState<RepositoryToken | null>(
        null,
    );
    const [showTokenValue, setShowTokenValue] = useState<
        Record<string, boolean>
    >({});
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const createForm = useForm<CreateRepositoryToken>({
        initialValues: {
            token: "",
            alias: "",
            type: "PRIVATE",
        },
        validate: {
            token: (value) => {
                if (!value) return "Token is required";
                if (
                    !value.startsWith("ghp_") &&
                    !value.startsWith("github_pat_") &&
                    !value.startsWith("ghs_")
                ) {
                    return "Must be a valid GitHub token (ghp_, github_pat_, or ghs_)";
                }
                return null;
            },
            alias: (value) => {
                if (!value || value.trim().length === 0) {
                    return "Alias is required to identify this token";
                }
                if (value.length < 3) {
                    return "Alias must be at least 3 characters";
                }
                if (value.length > 50) {
                    return "Alias must be 50 characters or less";
                }
                return null;
            },
        },
    });

    const editForm = useForm<{
        alias?: string;
        type?: "PUBLIC" | "PRIVATE";
        isActive?: boolean;
    }>({
        initialValues: {
            alias: "",
            type: "PRIVATE",
            isActive: true,
        },
    });

    // Permission checks
    const canCreate =
        repository && session?.user
            ? canCreateRepositoryToken(
                  session.user.permissions,
                  repository,
                  session.user.id,
              )
            : false;

    const canUpdate = (token: RepositoryToken) =>
        repository && session?.user
            ? canUpdateRepositoryToken(
                  session.user.permissions,
                  repository,
                  token,
                  session.user.id,
              )
            : false;

    const canDelete = (token: RepositoryToken) =>
        repository && session?.user
            ? canDeleteRepositoryToken(
                  session.user.permissions,
                  repository,
                  token,
                  session.user.id,
              )
            : false;

    const handleCreateSubmit = async (values: CreateRepositoryToken) => {
        if (!onCreateToken) return;
        setIsCreating(true);
        setIsValidating(true);

        try {
            await onCreateToken(values);
            createForm.reset();
            setShowAddForm(false);
            notifications.show({
                title: "Token Added Successfully",
                message: "Repository token has been validated and added.",
                color: "green",
                icon: <IconCheck size={16} />,
            });
        } catch (error) {
            notifications.show({
                title: "Failed to Add Token",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to add token",
                color: "red",
            });
        } finally {
            setIsCreating(false);
            setIsValidating(false);
        }
    };

    const handleEditSubmit = async (values: {
        alias?: string;
        type?: "PUBLIC" | "PRIVATE";
        isActive?: boolean;
    }) => {
        if (!editingToken || !onUpdateToken) return;
        setIsUpdating(true);

        try {
            await onUpdateToken(editingToken.id, values);
            setEditingToken(null);
            editForm.reset();
            notifications.show({
                title: "Token Updated",
                message: "Repository token has been updated successfully.",
                color: "green",
                icon: <IconCheck size={16} />,
            });
        } catch (error) {
            notifications.show({
                title: "Failed to Update Token",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to update token",
                color: "red",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (token: RepositoryToken) => {
        if (!onDeleteToken) return;
        setIsDeleting(token.id);

        try {
            await onDeleteToken(token.id);
            notifications.show({
                title: "Token Deleted",
                message: "Repository token has been deleted successfully.",
                color: "green",
                icon: <IconCheck size={16} />,
            });
        } catch (error) {
            notifications.show({
                title: "Failed to Delete Token",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete token",
                color: "red",
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const handleStartEdit = (token: RepositoryToken) => {
        setEditingToken(token);
        editForm.setValues({
            alias: token.alias || "",
            type: token.type,
            isActive: token.isActive,
        });
    };

    const toggleTokenVisibility = (tokenId: string) => {
        setShowTokenValue((prev) => ({
            ...prev,
            [tokenId]: !prev[tokenId],
        }));
    };

    const handleClose = () => {
        createForm.reset();
        editForm.reset();
        setShowAddForm(false);
        setEditingToken(null);
        setShowTokenValue({});
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <IconKey size={20} />
                    <Text fw={600}>Repository Tokens</Text>
                    {repository && (
                        <Badge variant="light" color="blue">
                            {repository.name}
                        </Badge>
                    )}
                </Group>
            }
            size="xl"
        >
            <Stack gap="lg">
                {/* Info Alert */}
                <Alert
                    icon={<IconShieldCheck size={16} />}
                    color="blue"
                    variant="light"
                >
                    <Stack gap="xs">
                        <Text size="sm" fw={500}>
                            GitHub Token Requirements:
                        </Text>
                        <Group gap="xs">
                            <Text size="sm" span>
                                • Token must have
                            </Text>
                            <Badge size="xs" variant="light">
                                repo
                            </Badge>
                            <Text size="sm" span>
                                and
                            </Text>
                            <Badge size="xs" variant="light">
                                workflow
                            </Badge>
                            <Text size="sm" span>
                                permissions
                            </Text>
                        </Group>
                        <Text size="sm">
                            • Token will be validated against the repository
                        </Text>
                        <Text size="sm">
                            • All tokens are encrypted and stored securely
                        </Text>
                    </Stack>
                </Alert>

                {/* Add Token Section */}
                {canCreate && (
                    <Paper p="md" withBorder>
                        <Stack gap="md">
                            {!showAddForm ? (
                                <Group justify="space-between">
                                    <Text fw={500}>Add New Token</Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => setShowAddForm(true)}
                                    >
                                        Add Token
                                    </Button>
                                </Group>
                            ) : (
                                <form
                                    onSubmit={createForm.onSubmit(
                                        handleCreateSubmit,
                                    )}
                                >
                                    <Stack gap="md">
                                        <Text fw={500}>
                                            Add New GitHub Token
                                        </Text>

                                        {isValidating && (
                                            <Alert
                                                icon={<Loader size={16} />}
                                                color="blue"
                                                variant="light"
                                            >
                                                Validating token with GitHub...
                                            </Alert>
                                        )}

                                        <TextInput
                                            label={
                                                <Group gap="xs">
                                                    <Text span>
                                                        Token Alias
                                                    </Text>
                                                    <Tooltip label="A friendly name to identify this token in the list">
                                                        <IconInfoCircle
                                                            size={14}
                                                            style={{
                                                                opacity: 0.7,
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </Group>
                                            }
                                            placeholder="e.g., Production Workflow Token"
                                            description="Required: A descriptive name to identify this token"
                                            required
                                            withAsterisk
                                            {...createForm.getInputProps(
                                                "alias",
                                            )}
                                        />

                                        <TextInput
                                            label="GitHub Token"
                                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            description="Personal access token or fine-grained token from GitHub"
                                            required
                                            withAsterisk
                                            type="password"
                                            {...createForm.getInputProps(
                                                "token",
                                            )}
                                        />

                                        <Select
                                            label="Token Type"
                                            data={[
                                                {
                                                    value: "PRIVATE",
                                                    label: "Private Token",
                                                },
                                                {
                                                    value: "PUBLIC",
                                                    label: "Public Token",
                                                },
                                                {
                                                    value: "APP",
                                                    label: "GitHub App Token",
                                                },
                                            ]}
                                            required
                                            {...createForm.getInputProps(
                                                "type",
                                            )}
                                        />

                                        <Group justify="flex-end" gap="sm">
                                            <Button
                                                variant="light"
                                                onClick={() => {
                                                    setShowAddForm(false);
                                                    createForm.reset();
                                                }}
                                                disabled={isCreating}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                loading={isCreating}
                                                leftSection={
                                                    !isCreating && (
                                                        <IconPlus size={16} />
                                                    )
                                                }
                                            >
                                                {isCreating
                                                    ? "Validating & Adding..."
                                                    : "Add Token"}
                                            </Button>
                                        </Group>
                                    </Stack>
                                </form>
                            )}
                        </Stack>
                    </Paper>
                )}

                {/* Edit Token Form */}
                {editingToken && (
                    <Paper p="md" withBorder>
                        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
                            <Stack gap="md">
                                <Text fw={500}>Edit Token</Text>

                                <TextInput
                                    label="Alias"
                                    placeholder="My GitHub Token"
                                    {...editForm.getInputProps("alias")}
                                />

                                <Select
                                    label="Token Type"
                                    data={[
                                        {
                                            value: "PRIVATE",
                                            label: "Private Token",
                                        },
                                        {
                                            value: "PUBLIC",
                                            label: "Public Token",
                                        },
                                        {
                                            value: "APP",
                                            label: "GitHub App Token",
                                        },
                                    ]}
                                    {...editForm.getInputProps("type")}
                                />

                                <Switch
                                    label="Active"
                                    description="Whether this token can be used for operations"
                                    {...editForm.getInputProps("isActive", {
                                        type: "checkbox",
                                    })}
                                />

                                <Group justify="flex-end" gap="sm">
                                    <Button
                                        variant="light"
                                        onClick={() => setEditingToken(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={isUpdating}>
                                        {isUpdating
                                            ? "Updating..."
                                            : "Update Token"}
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Paper>
                )}

                {/* Tokens List */}
                <Paper p="md" withBorder>
                    <Stack gap="md">
                        <Text fw={500}>
                            Repository Tokens ({tokens.length})
                        </Text>

                        {tokens.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">
                                No tokens configured for this repository
                            </Text>
                        ) : (
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Token</Table.Th>
                                        <Table.Th>Type</Table.Th>
                                        <Table.Th>GitHub User</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Last Used</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {tokens.map((token) => (
                                        <Table.Tr key={token.id}>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Text
                                                        size="sm"
                                                        ff="monospace"
                                                    >
                                                        {showTokenValue[
                                                            token.id
                                                        ]
                                                            ? "Token hidden for security"
                                                            : "ghp_****...****"}
                                                    </Text>
                                                    <ActionIcon
                                                        size="sm"
                                                        variant="subtle"
                                                        onClick={() =>
                                                            toggleTokenVisibility(
                                                                token.id,
                                                            )
                                                        }
                                                    >
                                                        {showTokenValue[
                                                            token.id
                                                        ] ? (
                                                            <IconEyeOff
                                                                size={14}
                                                            />
                                                        ) : (
                                                            <IconEye
                                                                size={14}
                                                            />
                                                        )}
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        size="sm"
                                                        variant="subtle"
                                                        onClick={() =>
                                                            notifications.show({
                                                                title: "Token Hidden",
                                                                message:
                                                                    "Token is encrypted and cannot be displayed for security",
                                                                color: "orange",
                                                            })
                                                        }
                                                    >
                                                        <IconCopy size={14} />
                                                    </ActionIcon>
                                                </Group>
                                                {token.alias && (
                                                    <Text size="xs" c="dimmed">
                                                        {token.alias}
                                                    </Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    variant="light"
                                                    color={
                                                        token.type === "PRIVATE"
                                                            ? "blue"
                                                            : token.type ===
                                                                "PUBLIC"
                                                              ? "green"
                                                              : "orange"
                                                    }
                                                >
                                                    {token.type}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                {token.githubLogin ? (
                                                    <Group gap="xs">
                                                        <IconUser size={14} />
                                                        <Text size="sm">
                                                            {token.githubLogin}
                                                        </Text>
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" c="dimmed">
                                                        Not validated
                                                    </Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    variant="light"
                                                    color={
                                                        token.isActive
                                                            ? "green"
                                                            : "red"
                                                    }
                                                >
                                                    {token.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {token.lastUsedAt
                                                        ? new Date(
                                                              token.lastUsedAt,
                                                          ).toLocaleDateString()
                                                        : "Never"}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    {canUpdate(token) && (
                                                        <Tooltip label="Edit token">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="subtle"
                                                                onClick={() =>
                                                                    handleStartEdit(
                                                                        token,
                                                                    )
                                                                }
                                                            >
                                                                <IconEdit
                                                                    size={14}
                                                                />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                    {canDelete(token) && (
                                                        <Tooltip label="Delete token">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="subtle"
                                                                color="red"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        token,
                                                                    )
                                                                }
                                                                loading={
                                                                    isDeleting ===
                                                                    token.id
                                                                }
                                                                disabled={
                                                                    isDeleting !==
                                                                    null
                                                                }
                                                            >
                                                                <IconTrash
                                                                    size={14}
                                                                />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        )}
                    </Stack>
                </Paper>
            </Stack>
        </Modal>
    );
}
