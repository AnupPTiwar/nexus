"use client";

import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import type { TablerIcon } from "@tabler/icons-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    diff?: string;
    icon: TablerIcon;
    color: string;
}

export function StatsCard({ title, value, diff, icon: Icon, color }: StatsCardProps) {
    return (
        <Card padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                    {title}
                </Text>
                <ThemeIcon
                    size="sm"
                    radius="md"
                    variant="light"
                    color={color}
                >
                    <Icon size={16} stroke={1.5} />
                </ThemeIcon>
            </Group>
            <Group align="end" gap="xs">
                <Text size="xl" fw={700}>
                    {value}
                </Text>
                {diff && (
                    <Text size="sm" c="green" fw={500}>
                        {diff}
                    </Text>
                )}
            </Group>
        </Card>
    );
}
