"use client";

import { Center, Container } from "@mantine/core";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Center mih="100vh" p="md">
            <Container size="xs" w="100%">
                {children}
            </Container>
        </Center>
    );
}