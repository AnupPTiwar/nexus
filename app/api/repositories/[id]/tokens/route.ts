import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    canCreateRepositoryToken,
    canReadRepositoryTokens,
} from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { CreateRepositoryTokenSchema } from "@/lib/validations/repository";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Get current user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        // Check if repository exists
        const repository = await prisma.repository.findUnique({
            where: {
                id: id,
                deletedAt: null,
            },
        });

        if (!repository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
            );
        }

        // Check permissions to read tokens
        if (!canReadRepositoryTokens(user.permissions, repository, user.id)) {
            return NextResponse.json(
                { error: "Insufficient permissions to read repository tokens" },
                { status: 403 },
            );
        }

        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 1;
        const limit = Math.min(Number(searchParams.get("limit")) || 10, 100);
        const skip = (page - 1) * limit;

        const [tokens, total] = await Promise.all([
            prisma.repositoryToken.findMany({
                where: {
                    repositoryId: id,
                    deletedAt: null,
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    alias: true,
                    type: true,
                    isActive: true,
                    lastUsedAt: true,
                    githubUserId: true,
                    githubLogin: true,
                    githubEmail: true,
                    githubName: true,
                    avatarUrl: true,
                    repositoryId: true,
                    userId: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    // Note: We don't return the actual token for security
                },
            }),
            prisma.repositoryToken.count({
                where: {
                    repositoryId: id,
                    deletedAt: null,
                },
            }),
        ]);

        // Convert BigInt values to strings for JSON serialization
        const serializedTokens = tokens.map((token) => ({
            ...token,
            githubUserId: token.githubUserId
                ? token.githubUserId.toString()
                : null,
        }));

        return NextResponse.json({
            tokens: serializedTokens,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching repository tokens:", error);
        return NextResponse.json(
            { error: "Failed to fetch repository tokens" },
            { status: 500 },
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = CreateRepositoryTokenSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request body",
                    details: validationResult.error.issues,
                },
                { status: 400 },
            );
        }

        const { token, alias, type } = validationResult.data;

        // Get current user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        // Check if repository exists
        const repository = await prisma.repository.findUnique({
            where: {
                id: id,
                deletedAt: null,
            },
        });

        if (!repository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
            );
        }

        // Check permissions to create tokens
        if (!canCreateRepositoryToken(user.permissions, repository, user.id)) {
            return NextResponse.json(
                {
                    error: "Insufficient permissions to create repository tokens",
                },
                { status: 403 },
            );
        }

        // Validate token with GitHub API
        const octokit = new Octokit({ auth: token });

        try {
            // 1. Get authenticated user info
            const { data: githubUser } =
                await octokit.rest.users.getAuthenticated();

            // 2. Check token scopes
            const response = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            });

            const scopes =
                response.headers.get("x-oauth-scopes")?.split(", ") || [];

            // 3. Check required permissions
            const requiredScopes = ["repo", "workflow"];
            const hasRequiredScopes = requiredScopes.every((scope) =>
                scopes.some((s) => s === scope || s.includes(scope)),
            );

            if (!hasRequiredScopes) {
                return NextResponse.json(
                    {
                        error: "Token missing required permissions",
                        details: `Token must have 'repo' and 'workflow' scopes. Found: ${scopes.join(", ")}`,
                    },
                    { status: 400 },
                );
            }

            // 4. Verify token has access to this specific repository
            try {
                await octokit.rest.repos.get({
                    owner: repository.githubOwner,
                    repo: repository.name,
                });
            } catch {
                return NextResponse.json(
                    {
                        error: "Token does not have access to this repository",
                        details: `Token cannot access ${repository.githubOwner}/${repository.name}`,
                    },
                    { status: 403 },
                );
            }

            // 5. Try to list workflows to verify workflow permissions
            try {
                await octokit.rest.actions.listRepoWorkflows({
                    owner: repository.githubOwner,
                    repo: repository.name,
                });
            } catch {
                return NextResponse.json(
                    {
                        error: "Token does not have workflow permissions",
                        details:
                            "Token must have 'workflow' scope to trigger workflows",
                    },
                    { status: 403 },
                );
            }

            // Token validation successful, create the token record
            const repositoryToken = await prisma.repositoryToken.create({
                data: {
                    token, // TODO: Encrypt this token before storing
                    alias,
                    type,
                    repositoryId: id,
                    userId: user.id,
                    // GitHub user data from validation
                    githubUserId: BigInt(githubUser.id),
                    githubLogin: githubUser.login,
                    githubEmail: githubUser.email,
                    githubName: githubUser.name,
                    avatarUrl: githubUser.avatar_url,
                    scopes: scopes,
                },
                select: {
                    id: true,
                    alias: true,
                    type: true,
                    isActive: true,
                    lastUsedAt: true,
                    githubUserId: true,
                    githubLogin: true,
                    githubEmail: true,
                    githubName: true,
                    avatarUrl: true,
                    repositoryId: true,
                    userId: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    // Note: We don't return the actual token for security
                },
            });

            // Convert BigInt values to strings for JSON serialization
            const serializedToken = {
                ...repositoryToken,
                githubUserId: repositoryToken.githubUserId
                    ? repositoryToken.githubUserId.toString()
                    : null,
            };

            return NextResponse.json(serializedToken, { status: 201 });
        } catch (githubError) {
            console.error("GitHub API error:", githubError);

            const error = githubError as { status?: number; message?: string };

            if (error.status === 401) {
                return NextResponse.json(
                    { error: "Invalid GitHub token" },
                    { status: 401 },
                );
            }

            if (error.status === 403) {
                return NextResponse.json(
                    {
                        error: "GitHub API rate limit exceeded or insufficient permissions",
                        details: error.message || "Access denied",
                    },
                    { status: 403 },
                );
            }

            throw githubError;
        }
    } catch (error) {
        console.error("Error creating repository token:", error);
        return NextResponse.json(
            { error: "Failed to create repository token" },
            { status: 500 },
        );
    }
}
