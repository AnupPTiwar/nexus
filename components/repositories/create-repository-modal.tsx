"use client";

import {
    Button,
    Group,
    Modal,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconBrandGithub, IconPlus } from "@tabler/icons-react";
import { useCreateRepository } from "@/hooks/use-repositories";
import type { CreateRepository } from "@/lib/validations/repository";

interface CreateRepositoryModalProps {
    opened: boolean;
    onClose: () => void;
}

export function CreateRepositoryModal({
    opened,
    onClose,
}: CreateRepositoryModalProps) {
    const createMutation = useCreateRepository();

    const form = useForm<CreateRepository>({
        initialValues: {
            name: "",
            githubOwner: "",
            githubUrl: "",
            description: "",
            visibility: "PRIVATE",
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

    const handleSubmit = async (values: CreateRepository) => {
        try {
            await createMutation.mutateAsync(values);
            notifications.show({
                title: "Repository Created",
                message: `Repository "${values.name}" has been created successfully.`,
                color: "green",
            });
            form.reset();
            onClose();
        } catch (error) {
            notifications.show({
                title: "Creation Failed",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to create repository",
                color: "red",
            });
        }
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    // Auto-fill name and owner from GitHub URL
    const handleGitHubUrlChange = (url: string) => {
        form.setFieldValue("githubUrl", url);

        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === "github.com") {
                const pathParts = urlObj.pathname.split("/").filter(Boolean);
                if (pathParts.length >= 2) {
                    const [owner, repo] = pathParts;
                    if (!form.values.githubOwner) {
                        form.setFieldValue("githubOwner", owner);
                    }
                    if (!form.values.name) {
                        form.setFieldValue("name", repo);
                    }
                }
            }
        } catch {
            // Invalid URL, ignore
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <IconBrandGithub size={20} />
                    <Text fw={600}>Add Repository</Text>
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
                        onChange={(event) =>
                            handleGitHubUrlChange(event.currentTarget.value)
                        }
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

                    <Group justify="flex-end" gap="sm">
                        <Button variant="light" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            leftSection={<IconPlus size={16} />}
                            loading={createMutation.isPending}
                        >
                            Add Repository
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
