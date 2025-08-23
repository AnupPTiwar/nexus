import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import {
    ColorSchemeScript,
    MantineProvider,
    mantineHtmlProps,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { SessionProvider } from "next-auth/react";
import { AuthLoader } from "@/components/auth-loader";
import { QueryProvider } from "@/providers/query-provider";

export const metadata = {
    title: "Nexus Platform - GitHub Workflow Management",
    description:
        "Enterprise GitHub workflow management and automation platform",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" {...mantineHtmlProps}>
            <head>
                <ColorSchemeScript defaultColorScheme="auto" />
            </head>
            <body>
                <QueryProvider>
                    <SessionProvider>
                        <MantineProvider defaultColorScheme="auto">
                            <Notifications position="top-right" />
                            <AuthLoader>{children}</AuthLoader>
                        </MantineProvider>
                    </SessionProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
