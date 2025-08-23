"use client";

import {
    Card,
    Grid,
    Group,
    Paper,
    RingProgress,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";
import {
    IconActivity,
    IconBrandGithub,
    IconGitBranch,
    IconHome,
    IconPlayerPlay,
    IconTrendingUp,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";

const stats = [
    {
        title: "Active Repositories",
        value: "24",
        diff: "+3",
        icon: IconBrandGithub,
        color: "dark",
    },
    {
        title: "Total Workflows",
        value: "142",
        diff: "+12",
        icon: IconGitBranch,
        color: "grape",
    },
    {
        title: "Runs Today",
        value: "89",
        diff: "+27%",
        icon: IconPlayerPlay,
        color: "green",
    },
    {
        title: "Success Rate",
        value: "94.2%",
        diff: "+2.1%",
        icon: IconTrendingUp,
        color: "blue",
    },
];

export default function DashboardPage() {
    return (
        <>
            <PageHeader
                title="Dashboard"
                description="Monitor your GitHub workflow operations and system metrics"
                icon={IconHome}
                color="blue"
            />

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
                {stats.map((stat) => (
                    <Card key={stat.title} padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                                {stat.title}
                            </Text>
                            <ThemeIcon
                                size="sm"
                                radius="md"
                                variant="light"
                                color={stat.color}
                            >
                                <stat.icon size={16} stroke={1.5} />
                            </ThemeIcon>
                        </Group>
                        <Group align="end" gap="xs">
                            <Text size="xl" fw={700}>
                                {stat.value}
                            </Text>
                            <Text size="sm" c="green" fw={500}>
                                {stat.diff}
                            </Text>
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>

            <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper p="lg" radius="md" withBorder h={300}>
                        <Stack h="100%" justify="center" align="center">
                            <ThemeIcon
                                size={48}
                                radius="md"
                                variant="light"
                                color="gray"
                            >
                                <IconActivity size={28} stroke={1.5} />
                            </ThemeIcon>
                            <Stack gap={4} align="center">
                                <Text fw={600}>Workflow Activity</Text>
                                <Text size="sm" c="dimmed">
                                    Activity chart will be displayed here
                                </Text>
                            </Stack>
                        </Stack>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="lg" radius="md" withBorder h={300}>
                        <Stack h="100%">
                            <Text fw={600} mb="md">
                                System Health
                            </Text>
                            <Stack
                                align="center"
                                justify="center"
                                style={{ flex: 1 }}
                            >
                                <RingProgress
                                    size={120}
                                    thickness={12}
                                    sections={[
                                        { value: 94.2, color: "green" },
                                        { value: 5.8, color: "red" },
                                    ]}
                                    label={
                                        <Stack gap={0} align="center">
                                            <Text size="lg" fw={700}>
                                                94.2%
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                Success
                                            </Text>
                                        </Stack>
                                    }
                                />
                            </Stack>
                            <Stack gap={4}>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">
                                        Successful
                                    </Text>
                                    <Text size="sm" fw={500}>
                                        84 runs
                                    </Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">
                                        Failed
                                    </Text>
                                    <Text size="sm" fw={500}>
                                        5 runs
                                    </Text>
                                </Group>
                            </Stack>
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>
        </>
    );
}
