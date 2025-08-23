"use client";

import { PageHeader } from "@/components/page-header";
import { Center, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";

export default function RepositoriesPage() {
    return (
        <>
            <PageHeader
                title="Repositories"
                description="Connect and manage your GitHub repositories"
                icon={IconBrandGithub}
                color="dark"
            />

            <Paper p="xl" radius="md" withBorder mih={400}>
                <Center h={400}>
                    <Stack align="center" gap="md">
                        <ThemeIcon
                            size={64}
                            radius="md"
                            variant="light"
                            color="dark"
                        >
                            <IconBrandGithub size={32} stroke={1.5} />
                        </ThemeIcon>
                        <Stack gap={4} align="center">
                            <Text size="lg" fw={600}>
                                Repository Management
                            </Text>
                            <Text size="sm" c="dimmed">
                                GitHub repository integration interface will be displayed here
                            </Text>
                        </Stack>
                    </Stack>
                </Center>
            </Paper>
        </>
    );
}