"use client";

import { Center, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconGitBranch } from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";

export default function WorkflowsPage() {
    return (
        <>
            <PageHeader
                title="Workflows"
                description="Manage and configure your automation pipelines"
                icon={IconGitBranch}
                color="grape"
            />

            <Paper p="xl" radius="md" withBorder mih={400}>
                <Center h={400}>
                    <Stack align="center" gap="md">
                        <ThemeIcon
                            size={64}
                            radius="md"
                            variant="light"
                            color="grape"
                        >
                            <IconGitBranch size={32} stroke={1.5} />
                        </ThemeIcon>
                        <Stack gap={4} align="center">
                            <Text size="lg" fw={600}>
                                Workflow Configuration
                            </Text>
                            <Text size="sm" c="dimmed">
                                Workflow management interface will be displayed
                                here
                            </Text>
                        </Stack>
                    </Stack>
                </Center>
            </Paper>
        </>
    );
}
