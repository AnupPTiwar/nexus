"use client";

import { Center, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";

export default function UsersPage() {
    return (
        <>
            <PageHeader
                title="Users"
                description="Manage team members and their access permissions"
                icon={IconUsers}
                color="cyan"
            />

            <Paper p="xl" radius="md" withBorder mih={400}>
                <Center h={400}>
                    <Stack align="center" gap="md">
                        <ThemeIcon
                            size={64}
                            radius="md"
                            variant="light"
                            color="cyan"
                        >
                            <IconUsers size={32} stroke={1.5} />
                        </ThemeIcon>
                        <Stack gap={4} align="center">
                            <Text size="lg" fw={600}>
                                Users Management
                            </Text>
                            <Text size="sm" c="dimmed">
                                User management interface will be displayed here
                            </Text>
                        </Stack>
                    </Stack>
                </Center>
            </Paper>
        </>
    );
}
