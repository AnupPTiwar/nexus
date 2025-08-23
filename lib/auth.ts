// biome-ignore lint/style/useNodejsImportProtocol: <next js will need broswer env as well >
import { createHash } from "crypto";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@/prisma";

// Simple encryption for tokens (you should use a proper encryption library in production)
function encryptToken(token: string): string {
    const hash = createHash("sha256");
    hash.update(token + env.NEXTAUTH_SECRET);
    return hash.digest("hex");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub({
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "repo workflow user:email",
                },
            },
        }),
    ],
    // Optional: relies on NEXTAUTH_SECRET env; adding here to be explicit
    secret: env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, account }) {
            // Store the access token when user first signs in
            if (account?.access_token) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session }) {
            // Get user from database with permissions
            const dbUser = await prisma.user.findUnique({
                where: { email: session.user?.email as string },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    permissions: true,
                    status: true,
                    lastLoginAt: true,
                },
            });

            if (dbUser) {
                // Extend session with database user data
                session.user = {
                    ...session.user,
                    id: dbUser.id,
                    permissions: dbUser.permissions,
                    status: dbUser.status,
                };

                // Update last login time
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { lastLoginAt: new Date() },
                });
            }

            return session;
        },
        async signIn({ user, account }) {
            if (account?.provider === "github" && user.email) {
                try {
                    // Check if user exists
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });

                    if (existingUser) {
                        // Update existing user's GitHub token
                        if (account.access_token) {
                            await prisma.user.update({
                                where: { email: user.email },
                                data: {
                                    githubAccessToken: encryptToken(
                                        account.access_token,
                                    ),
                                    name: user.name,
                                    image: user.image,
                                },
                            });
                        }
                    } else {
                        // Create new user with default read permissions
                        await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name,
                                image: user.image,
                                status: UserStatus.ACTIVE,
                                githubAccessToken: account.access_token
                                    ? encryptToken(account.access_token)
                                    : null,
                                permissions: [
                                    "REPOSITORY:READ",
                                    "WORKFLOW:READ",
                                    "WORKFLOW_RUN:READ",
                                ],
                                lastLoginAt: new Date(),
                            },
                        });
                    }

                    return true;
                } catch (error) {
                    console.error("Error during sign in:", error);
                    return false;
                }
            }
            return true;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            return true;
        },
    },
});
