"use client";

import {
    Badge,
    Button,
    Card,
    Center,
    Container,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconBrandGithub,
    IconDatabase,
    IconGitBranch,
    IconPlayerPlay,
    IconRefresh,
    IconServer,
    IconShieldCheck,
    IconUserCheck,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const capabilities = [
    {
        icon: IconBrandGithub,
        title: "Repository Integration",
        description:
            "Seamlessly connect and manage multiple GitHub repositories with secure token management",
        color: "dark",
    },
    {
        icon: IconPlayerPlay,
        title: "Workflow Execution",
        description:
            "Trigger, monitor, and manage GitHub Actions workflows with real-time status tracking",
        color: "blue",
    },
    {
        icon: IconDatabase,
        title: "Run History",
        description:
            "Comprehensive tracking of workflow runs, jobs, and steps with detailed execution logs",
        color: "grape",
    },
    {
        icon: IconShieldCheck,
        title: "Access Control",
        description:
            "Enterprise-grade permission system with resource-based access control",
        color: "green",
    },
    {
        icon: IconRefresh,
        title: "Automated Sync",
        description:
            "Keep workflows synchronized with automatic repository updates and webhook integration",
        color: "cyan",
    },
    {
        icon: IconUserCheck,
        title: "Audit Trail",
        description:
            "Complete audit logging for compliance and security tracking",
        color: "orange",
    },
];

export default function HomePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const handleAccess = () => {
        if (session) {
            router.push("/dashboard");
        } else {
            router.push("/api/auth/signin");
        }
    };

    return (
        <Center mih="100vh" p="md">
            <Container size="xl" w="100%">
                <Stack gap="xl">
                    {/* Header Section */}
                    <Paper p={{ base: "xl", md: 60 }} radius="md" withBorder>
                        <Stack align="center" gap="lg">
                            <Group gap="xs">
                                <ThemeIcon
                                    size={48}
                                    radius="md"
                                    variant="light"
                                    color="blue"
                                >
                                    <IconGitBranch size={28} stroke={1.5} />
                                </ThemeIcon>
                                <Title order={1} size={42} fw={600}>
                                    Nexus Platform
                                </Title>
                            </Group>

                            <Text size="lg" c="dimmed" maw={600} ta="center">
                                Centralized GitHub workflow management platform
                                for enterprise teams. Execute, monitor, and
                                manage your CI/CD pipelines with confidence.
                            </Text>

                            <Group gap="md" mt="md">
                                <Badge size="lg" variant="light" color="blue">
                                    Internal Platform
                                </Badge>
                                <Badge size="lg" variant="light" color="green">
                                    {status === "authenticated"
                                        ? "Authenticated"
                                        : "Secure Access"}
                                </Badge>
                                <Badge size="lg" variant="light" color="grape">
                                    Enterprise Ready
                                </Badge>
                            </Group>

                            <Button
                                size="lg"
                                radius="md"
                                variant="filled"
                                color="blue"
                                leftSection={
                                    status === "authenticated" ? (
                                        <IconServer size={20} />
                                    ) : (
                                        <IconUserCheck size={20} />
                                    )
                                }
                                onClick={handleAccess}
                                loading={status === "loading"}
                                mt="md"
                            >
                                {status === "authenticated"
                                    ? "Access Dashboard"
                                    : "Sign In to Continue"}
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Capabilities Grid */}
                    <Stack gap="md">
                        <Title order={2} size="h3" ta="center" c="dimmed">
                            Platform Capabilities
                        </Title>

                        <SimpleGrid
                            cols={{ base: 1, sm: 2, lg: 3 }}
                            spacing="lg"
                        >
                            {capabilities.map((capability) => (
                                <Card
                                    key={capability.title}
                                    padding="lg"
                                    radius="md"
                                    withBorder
                                >
                                    <Stack gap="md">
                                        <ThemeIcon
                                            size={44}
                                            radius="md"
                                            variant="light"
                                            color={capability.color}
                                        >
                                            <capability.icon
                                                size={24}
                                                stroke={1.5}
                                            />
                                        </ThemeIcon>
                                        <Stack gap={4}>
                                            <Text fw={600} size="lg">
                                                {capability.title}
                                            </Text>
                                            <Text size="sm" c="dimmed" lh={1.5}>
                                                {capability.description}
                                            </Text>
                                        </Stack>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Stack>

                    {/* Footer Info */}
                    <Paper p="xl" radius="md" withBorder>
                        <Stack gap="xs" align="center">
                            <Group gap="xl">
                                <Stack gap={4} align="center">
                                    <Text size="xl" fw={700}>
                                        Secure
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Token Encryption
                                    </Text>
                                </Stack>
                                <Stack gap={4} align="center">
                                    <Text size="xl" fw={700}>
                                        Reliable
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Real-time Sync
                                    </Text>
                                </Stack>
                                <Stack gap={4} align="center">
                                    <Text size="xl" fw={700}>
                                        Scalable
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Enterprise Grade
                                    </Text>
                                </Stack>
                            </Group>
                            <Text size="xs" c="dimmed" mt="md">
                                Built for internal teams to streamline GitHub
                                Actions workflow management
                            </Text>
                        </Stack>
                    </Paper>
                </Stack>
            </Container>
        </Center>
    );
}
