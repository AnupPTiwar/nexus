"use client";

import {
    ActionIcon,
    AppShell,
    Avatar,
    Badge,
    Burger,
    Card,
    Divider,
    Group,
    Indicator,
    NavLink,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    UnstyledButton,
    useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
    IconBell,
    IconBrandGithub,
    IconGitBranch,
    IconHome,
    IconMoon,
    IconPlayerPlay,
    IconSearch,
    IconServer,
    IconSun,
    IconUsers,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const navigation = [
    {
        href: "/dashboard",
        label: "Dashboard",
        description: "Overview & metrics",
        icon: IconHome,
        color: "blue",
    },
    {
        href: "/dashboard/users",
        label: "Users",
        description: "Manage team access",
        icon: IconUsers,
        color: "cyan",
    },
    {
        href: "/dashboard/repositories",
        label: "Repositories",
        description: "GitHub integrations",
        icon: IconBrandGithub,
        color: "dark",
    },
    {
        href: "/dashboard/workflows",
        label: "Workflows",
        description: "Automation pipelines",
        icon: IconGitBranch,
        color: "grape",
    },
    {
        href: "/dashboard/workflow-runs",
        label: "Workflow Runs",
        description: "Execution history",
        icon: IconPlayerPlay,
        color: "green",
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const [asideOpened, { toggle: toggleAside }] = useDisclosure();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    const mainLinks = navigation.map((item) => (
        <NavLink
            key={item.href}
            href={item.href}
            label={
                <Group gap="xs">
                    <Text size="sm" fw={500}>
                        {item.label}
                    </Text>
                </Group>
            }
            description={
                <Text size="xs" c="dimmed">
                    {item.description}
                </Text>
            }
            leftSection={
                <ThemeIcon
                    size="md"
                    variant="light"
                    color={item.color}
                    radius="md"
                >
                    <item.icon size={18} stroke={1.5} />
                </ThemeIcon>
            }
            active={pathname === item.href}
            onClick={() => router.push(item.href)}
            p="sm"
            style={{ borderRadius: "var(--mantine-radius-md)" }}
        />
    ));

    return (
        <AppShell
            header={{ height: 70 }}
            navbar={{
                width: 280,
                breakpoint: "sm",
                collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
            }}
            aside={{
                width: 320,
                breakpoint: "md",
                collapsed: { desktop: !asideOpened, mobile: !asideOpened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger
                            opened={mobileOpened}
                            onClick={toggleMobile}
                            hiddenFrom="sm"
                            size="sm"
                        />
                        <Burger
                            opened={desktopOpened}
                            onClick={toggleDesktop}
                            visibleFrom="sm"
                            size="sm"
                        />
                        <Group gap="xs">
                            <ThemeIcon
                                size="lg"
                                radius="md"
                                variant="light"
                                color="blue"
                            >
                                <IconServer size={20} stroke={1.5} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Text size="md" fw={600}>
                                    DevOpsNexus
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Enterprise Platform
                                </Text>
                            </Stack>
                        </Group>
                    </Group>

                    <TextInput
                        placeholder="Search workflows, repositories..."
                        leftSection={<IconSearch size={16} />}
                        style={{ flex: 1, maxWidth: 400 }}
                        radius="md"
                        variant="filled"
                    />

                    <Group>
                        <ActionIcon
                            size="lg"
                            variant="subtle"
                            radius="md"
                            onClick={() => toggleColorScheme()}
                            aria-label="Toggle color scheme"
                        >
                            {colorScheme === "dark" ? (
                                <IconSun size={20} stroke={1.5} />
                            ) : (
                                <IconMoon size={20} stroke={1.5} />
                            )}
                        </ActionIcon>

                        <Indicator processing color="red" offset={6} size={8}>
                            <ActionIcon
                                size="lg"
                                variant="subtle"
                                radius="md"
                                onClick={toggleAside}
                            >
                                <IconBell size={20} stroke={1.5} />
                            </ActionIcon>
                        </Indicator>

                        <UnstyledButton>
                            <Group gap="xs">
                                <Stack gap={0} align="end">
                                    <Text size="sm" fw={500}>
                                        {session?.user?.name || "User"}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {session?.user?.email ||
                                            "user@example.com"}
                                    </Text>
                                </Stack>
                                <Avatar
                                    src={session?.user?.image}
                                    radius="md"
                                    size="md"
                                >
                                    {session?.user?.name?.[0]?.toUpperCase() ||
                                        "U"}
                                </Avatar>
                            </Group>
                        </UnstyledButton>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <AppShell.Section>
                    <Group gap="xs" mb="md">
                        <ThemeIcon
                            size="lg"
                            radius="md"
                            variant="gradient"
                            gradient={{ from: "blue", to: "cyan", deg: 135 }}
                        >
                            <IconGitBranch size={20} stroke={1.5} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Text size="sm" fw={600}>
                                Navigation
                            </Text>
                            <Text size="xs" c="dimmed">
                                Platform modules
                            </Text>
                        </Stack>
                    </Group>
                    <Divider mb="md" />
                </AppShell.Section>

                <AppShell.Section grow component={ScrollArea}>
                    <Stack gap="xs">{mainLinks}</Stack>
                </AppShell.Section>

                <AppShell.Section>
                    <Divider mb="md" />
                    <Card padding="sm" radius="md" withBorder>
                        <Stack gap="xs">
                            <Group justify="space-between">
                                <Text size="xs" fw={600}>
                                    System Status
                                </Text>
                                <Badge size="sm" color="green" variant="light">
                                    Operational
                                </Badge>
                            </Group>
                            <Stack gap={4}>
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed">
                                        API
                                    </Text>
                                    <Text size="xs" c="green" fw={500}>
                                        ● Online
                                    </Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed">
                                        Webhooks
                                    </Text>
                                    <Text size="xs" c="green" fw={500}>
                                        ● Active
                                    </Text>
                                </Group>
                            </Stack>
                        </Stack>
                    </Card>
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main>{children}</AppShell.Main>

            <AppShell.Aside p="md">
                <Stack h="100%">
                    <Group justify="space-between">
                        <Text fw={600}>Notifications</Text>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={toggleAside}
                        >
                            ×
                        </ActionIcon>
                    </Group>
                    <Divider />
                    <ScrollArea style={{ flex: 1 }}>
                        <Stack gap="sm">
                            <Card padding="sm" radius="md" withBorder>
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <Badge size="sm" color="blue">
                                            Workflow
                                        </Badge>
                                        <Text size="xs" c="dimmed">
                                            2 min ago
                                        </Text>
                                    </Group>
                                    <Text size="sm" fw={500}>
                                        Build completed successfully
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Repository: nexus-core
                                    </Text>
                                </Stack>
                            </Card>
                            <Card padding="sm" radius="md" withBorder>
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <Badge size="sm" color="green">
                                            System
                                        </Badge>
                                        <Text size="xs" c="dimmed">
                                            1 hour ago
                                        </Text>
                                    </Group>
                                    <Text size="sm" fw={500}>
                                        New repository synchronized
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        5 workflows imported
                                    </Text>
                                </Stack>
                            </Card>
                        </Stack>
                    </ScrollArea>
                </Stack>
            </AppShell.Aside>
        </AppShell>
    );
}
