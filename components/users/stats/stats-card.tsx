"use client";

import { Card, Group, Skeleton, Stack, Text, ThemeIcon } from "@mantine/core";
import type { TablerIcon } from "@tabler/icons-react";

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: TablerIcon;
    color: string;
    description?: string;
    isLoading?: boolean;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    color,
    description,
    isLoading = false,
}: StatsCardProps) {
    return (
        <Card padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                    {title}
                </Text>
                <ThemeIcon size="sm" radius="md" variant="light" color={color}>
                    <Icon size={16} stroke={1.5} />
                </ThemeIcon>
            </Group>

            <Stack gap={4}>
                {isLoading ? (
                    <Skeleton height={32} width="60%" />
                ) : (
                    <Text size="xl" fw={700}>
                        {value}
                    </Text>
                )}

                {description &&
                    (isLoading ? (
                        <Skeleton height={16} width="80%" />
                    ) : (
                        <Text size="xs" c="dimmed">
                            {description}
                        </Text>
                    ))}
            </Stack>
        </Card>
    );
}
