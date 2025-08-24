"use client";

import { SimpleGrid, Skeleton } from "@mantine/core";
import {
    IconChartLine,
    IconLock,
    IconUserCheck,
    IconUserOff,
    IconUserPlus,
    IconUsers,
} from "@tabler/icons-react";
import { useUserStats } from "@/hooks/use-users";
import { StatsCard } from "./stats-card";

export function StatsContainer() {
    const { data: stats, isLoading } = useUserStats();

    if (isLoading) {
        return (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mb="xl">
                {Array.from({ length: 6 }).map((_, index) => (
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
            title: "Total Users",
            value: stats.totalUsers,
            icon: IconUsers,
            color: "blue",
        },
        {
            title: "Active Users",
            value: stats.activeUsers,
            icon: IconUserCheck,
            color: "green",
        },
        {
            title: "Inactive Users",
            value: stats.inactiveUsers,
            icon: IconUserOff,
            color: "orange",
        },
        {
            title: "Locked Users",
            value: stats.lockedUsers,
            icon: IconLock,
            color: "red",
        },
        {
            title: "New This Month",
            value: stats.newUsersThisMonth,
            diff: "+12%",
            icon: IconUserPlus,
            color: "cyan",
        },
        {
            title: "Avg Permissions",
            value: stats.averagePermissions,
            icon: IconChartLine,
            color: "grape",
        },
    ];

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mb="xl">
            {statsData.map((stat) => (
                <StatsCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    diff={stat.diff}
                    icon={stat.icon}
                    color={stat.color}
                />
            ))}
        </SimpleGrid>
    );
}