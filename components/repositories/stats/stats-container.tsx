"use client";

import { SimpleGrid, Skeleton } from "@mantine/core";
import {
    IconBrandGithub,
    IconEye,
    IconEyeOff,
    IconGitBranch,
    IconRefresh,
    IconServer,
    IconTrendingUp,
    IconUsers,
} from "@tabler/icons-react";
import { useRepositoryStats } from "@/hooks/use-repositories";
import { StatsCard } from "./stats-card";

export function StatsContainer() {
    const { data: stats, isLoading } = useRepositoryStats();

    if (isLoading) {
        return (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
                {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} height={120} radius="md" />
                ))}
            </SimpleGrid>
        );
    }

    if (!stats) {
        return null;
    }

    const statsData = [
        {
            title: "Total Repositories",
            value: stats.totalRepositories,
            icon: IconBrandGithub,
            color: "dark",
        },
        {
            title: "Active Repositories",
            value: stats.activeRepositories,
            icon: IconServer,
            color: "green",
        },
        {
            title: "Inactive Repositories",
            value: stats.inactiveRepositories,
            icon: IconUsers,
            color: "red",
        },
        {
            title: "Currently Syncing",
            value: stats.syncingRepositories,
            icon: IconRefresh,
            color: "blue",
        },
        {
            title: "Public Repositories",
            value: stats.publicRepositories,
            icon: IconEye,
            color: "cyan",
        },
        {
            title: "Private Repositories",
            value: stats.privateRepositories,
            icon: IconEyeOff,
            color: "orange",
        },
        {
            title: "Total Workflows",
            value: stats.totalWorkflows,
            icon: IconGitBranch,
            color: "grape",
        },
        {
            title: "Avg Workflows/Repo",
            value: stats.averageWorkflowsPerRepo,
            icon: IconTrendingUp,
            color: "indigo",
        },
    ];

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
            {statsData.map((stat) => (
                <StatsCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                />
            ))}
        </SimpleGrid>
    );
}
