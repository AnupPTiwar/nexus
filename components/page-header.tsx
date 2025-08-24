"use client";

import { Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import type { TablerIcon } from "@tabler/icons-react";

interface PageHeaderProps {
    title: string;
    description: string;
    icon: TablerIcon;
    color?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    color = "blue",
}: PageHeaderProps) {
    return (
        <Paper p="lg" radius="md" mb="lg" withBorder>
            <Group gap="md">
                <ThemeIcon size={48} radius="md" variant="light" color={color}>
                    <Icon size={28} stroke={1.5} />
                </ThemeIcon>
                <Stack gap={4}>
                    <Title order={2} size="h3">
                        {title}
                    </Title>
                    <Text size="sm" c="dimmed">
                        {description}
                    </Text>
                </Stack>
            </Group>
        </Paper>
    );
}
