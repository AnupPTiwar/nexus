import "@mantine/core/styles.css";

import {
    ColorSchemeScript,
    MantineProvider,
    mantineHtmlProps,
} from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import { AuthLoader } from "@/components/auth-loader";

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
                <ColorSchemeScript defaultColorScheme="dark" />
            </head>
            <body>
                <SessionProvider>
                    <MantineProvider defaultColorScheme="dark">
                        <AuthLoader>{children}</AuthLoader>
                    </MantineProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
