"use client";

import { SimpleGrid } from "@mantine/core";
import {
    IconLock,
    IconShieldCheck,
    IconTrendingUp,
    IconUserCheck,
    IconUserOff,
    IconUsers,
} from "@tabler/icons-react";
import { useUserStats } from "@/hooks/use-users";
import { StatsCard } from "./stats-card";

export function StatsContainer() {
    const { data: stats, isLoading } = useUserStats();

    const statsCards = [
        {
            title: "Total Users",
            value: stats?.totalUsers ?? 0,
            icon: IconUsers,
            color: "blue",
            description: "All registered users",
        },
        {
            title: "Active Users",
            value: stats?.activeUsers ?? 0,
            icon: IconUserCheck,
            color: "green",
            description: "Currently active",
        },
        {
            title: "Inactive Users",
            value: stats?.inactiveUsers ?? 0,
            icon: IconUserOff,
            color: "orange",
            description: "Temporarily inactive",
        },
        {
            title: "Locked Users",
            value: stats?.lockedUsers ?? 0,
            icon: IconLock,
            color: "red",
            description: "Security locked",
        },
        {
            title: "New This Month",
            value: stats?.newUsersThisMonth ?? 0,
            icon: IconTrendingUp,
            color: "cyan",
            description: "Recent registrations",
        },
        {
            title: "Avg. Permissions",
            value: stats?.averagePermissions ?? 0,
            icon: IconShieldCheck,
            color: "grape",
            description: "Per user average",
        },
    ];

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 6 }} mb="xl">
            {statsCards.map((stat) => (
                <StatsCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    description={stat.description}
                    isLoading={isLoading}
                />
            ))}
        </SimpleGrid>
    );
}
