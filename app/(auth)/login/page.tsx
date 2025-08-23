"use client";

import {
    Button,
    Card,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconBrandGithub,
    IconGitBranch,
    IconLock,
    IconShieldCheck,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    const handleGitHubLogin = () => {
        signIn("github", { callbackUrl });
    };

    return (
        <Stack gap="xl" align="center" w="100%" maw={400}>
            {/* Logo and Title */}
            <Group gap="xs">
                <ThemeIcon size={56} radius="md" variant="light" color="blue">
                    <IconGitBranch size={32} stroke={1.5} />
                </ThemeIcon>
                <Stack gap={0}>
                    <Title order={1} size="h2">
                        Nexus Platform
                    </Title>
                    <Text size="sm" c="dimmed">
                        Workflow Management System
                    </Text>
                </Stack>
            </Group>

            {/* Login Card */}
            <Card w="100%" padding="xl" radius="md" withBorder>
                <Stack gap="lg">
                    <Stack gap="xs">
                        <Title order={2} size="h3" ta="center">
                            Sign In
                        </Title>
                        <Text size="sm" c="dimmed" ta="center">
                            Access your GitHub workflow management dashboard
                        </Text>
                    </Stack>

                    <Divider />

                    <Button
                        fullWidth
                        size="lg"
                        radius="md"
                        variant="filled"
                        color="dark"
                        leftSection={<IconBrandGithub size={20} />}
                        onClick={handleGitHubLogin}
                    >
                        Continue with GitHub
                    </Button>

                    <Stack gap="xs">
                        <Group gap="xs" justify="center">
                            <ThemeIcon size="sm" variant="light" color="green">
                                <IconShieldCheck size={14} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">
                                Secure OAuth authentication
                            </Text>
                        </Group>
                        <Group gap="xs" justify="center">
                            <ThemeIcon size="sm" variant="light" color="blue">
                                <IconLock size={14} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">
                                Your data is encrypted and protected
                            </Text>
                        </Group>
                    </Stack>
                </Stack>
            </Card>

            {/* Footer Info */}
            <Paper p="md" radius="md" w="100%" withBorder>
                <Stack gap="xs">
                    <Text size="sm" fw={600}>
                        Why GitHub Authentication?
                    </Text>
                    <Stack gap={4}>
                        <Text size="xs" c="dimmed">
                            • Direct integration with your repositories
                        </Text>
                        <Text size="xs" c="dimmed">
                            • Manage workflows without additional credentials
                        </Text>
                        <Text size="xs" c="dimmed">
                            • Enterprise-grade security and compliance
                        </Text>
                    </Stack>
                </Stack>
            </Paper>
        </Stack>
    );
}
