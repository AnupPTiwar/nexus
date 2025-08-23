"use client";

import { PageHeader } from "@/components/page-header";
import { Center, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";

export default function WorkflowRunsPage() {
    return (
        <>
            <PageHeader
                title="Workflow Runs"
                description="Monitor and track workflow execution history"
                icon={IconPlayerPlay}
                color="green"
            />

            <Paper p="xl" radius="md" withBorder mih={400}>
                <Center h={400}>
                    <Stack align="center" gap="md">
                        <ThemeIcon
                            size={64}
                            radius="md"
                            variant="light"
                            color="green"
                        >
                            <IconPlayerPlay size={32} stroke={1.5} />
                        </ThemeIcon>
                        <Stack gap={4} align="center">
                            <Text size="lg" fw={600}>
                                Execution History
                            </Text>
                            <Text size="sm" c="dimmed">
                                Workflow runs and execution logs will be displayed here
                            </Text>
                        </Stack>
                    </Stack>
                </Center>
            </Paper>
        </>
    );
}