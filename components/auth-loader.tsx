"use client";

import {
    Card,
    Center,
    Group,
    Loader,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";
import { IconGitBranch, IconShieldCheck } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function AuthLoader({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        // Give a minimum loading time for better UX
        const timer = setTimeout(() => {
            if (status !== "loading") {
                setIsInitialLoad(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [status]);

    // Show loader only on initial authentication check
    if (status === "loading" || isInitialLoad) {
        return (
            <Center mih="100vh">
                <Card w={380} padding="xl" radius="md" withBorder>
                    <Stack align="center" gap="lg">
                        {/* Logo */}
                        <Group gap="xs" align="center">
                            <ThemeIcon
                                size={48}
                                radius="md"
                                variant="light"
                                color="blue"
                            >
                                <IconGitBranch size={28} stroke={1.5} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Text size="lg" fw={600}>
                                    Nexus Platform
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Workflow Management
                                </Text>
                            </Stack>
                        </Group>

                        {/* Loading Indicator */}
                        <Stack align="center" gap="md">
                            <Loader size="lg" type="dots" />
                            <Stack gap={4} align="center">
                                <Text size="sm" fw={500}>
                                    Authenticating
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Verifying your credentials...
                                </Text>
                            </Stack>
                        </Stack>

                        {/* Security Badge */}
                        <Group gap="xs" mt="md">
                            <ThemeIcon
                                size="sm"
                                radius="xl"
                                variant="light"
                                color="green"
                            >
                                <IconShieldCheck size={14} stroke={2} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">
                                Secure connection established
                            </Text>
                        </Group>
                    </Stack>
                </Card>
            </Center>
        );
    }

    return <>{children}</>;
}
