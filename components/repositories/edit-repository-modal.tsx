"use client";

import {
    Button,
    Group,
    Modal,
    Select,
    Stack,
    Switch,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconDeviceFloppy, IconEdit } from "@tabler/icons-react";
import { useEffect } from "react";
import { useUpdateRepository } from "@/hooks/use-repositories";
import type {
    Repository,
    UpdateRepository,
} from "@/lib/validations/repository";

interface EditRepositoryModalProps {
    opened: boolean;
    onClose: () => void;
    repository: Repository | null;
}

export function EditRepositoryModal({
    opened,
    onClose,
    repository,
}: EditRepositoryModalProps) {
    const updateMutation = useUpdateRepository(repository?.id || "");

    const form = useForm<UpdateRepository>({
        initialValues: {
            name: "",
            githubOwner: "",
            githubUrl: "",
            description: "",
            visibility: "PRIVATE",
            isActive: true,
            webhookSecret: "",
        },
        validate: {
            name: (value) => (!value ? "Repository name is required" : null),
            githubOwner: (value) =>
                !value ? "GitHub owner is required" : null,
            githubUrl: (value) => {
                if (!value) return "GitHub URL is required";
                try {
                    new URL(value);
                    if (!value.includes("github.com")) {
                        return "Must be a valid GitHub URL";
                    }
                    return null;
                } catch {
                    return "Must be a valid URL";
                }
            },
        },
    });

    // Update form when repository changes
    // biome-ignore lint/correctness/useExhaustiveDependencies: <form cannot be added as dependency>
    useEffect(() => {
        if (repository) {
            form.setValues({
                name: repository.name,
                githubOwner: repository.githubOwner,
                githubUrl: repository.githubUrl,
                description: repository.description || "",
                visibility: repository.visibility,
                isActive: repository.isActive,
                webhookSecret: repository.webhookSecret || "",
            });
        }
    }, [repository]);

    const handleSubmit = async (values: UpdateRepository) => {
        if (!repository) return;

        try {
            await updateMutation.mutateAsync(values);
            notifications.show({
                title: "Repository Updated",
                message: `Repository "${values.name}" has been updated successfully.`,
                color: "green",
            });
            onClose();
        } catch (error) {
            notifications.show({
                title: "Update Failed",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to update repository",
                color: "red",
            });
        }
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <IconEdit size={20} />
                    <Text fw={600}>Edit Repository</Text>
                </Group>
            }
            size="lg"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="GitHub URL"
                        placeholder="https://github.com/owner/repository"
                        required
                        {...form.getInputProps("githubUrl")}
                    />

                    <Group grow>
                        <TextInput
                            label="Repository Name"
                            placeholder="my-awesome-repo"
                            required
                            {...form.getInputProps("name")}
                        />

                        <TextInput
                            label="GitHub Owner"
                            placeholder="username or organization"
                            required
                            {...form.getInputProps("githubOwner")}
                        />
                    </Group>

                    <Select
                        label="Visibility"
                        data={[
                            { value: "PRIVATE", label: "Private" },
                            { value: "PUBLIC", label: "Public" },
                        ]}
                        required
                        {...form.getInputProps("visibility")}
                    />

                    <Textarea
                        label="Description"
                        placeholder="Brief description of the repository..."
                        rows={3}
                        {...form.getInputProps("description")}
                    />

                    <TextInput
                        label="Webhook Secret"
                        placeholder="Optional webhook secret for GitHub events"
                        description="Used to verify webhook signatures from GitHub"
                        {...form.getInputProps("webhookSecret")}
                    />

                    <Switch
                        label="Active"
                        description="Whether this repository is active and can trigger workflows"
                        {...form.getInputProps("isActive", {
                            type: "checkbox",
                        })}
                    />

                    <Group justify="flex-end" gap="sm">
                        <Button variant="light" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            leftSection={<IconDeviceFloppy size={16} />}
                            loading={updateMutation.isPending}
                        >
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
