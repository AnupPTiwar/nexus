import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateRepositoryTokenSchema } from "@/lib/validations/repository";

export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Check if repository exists
        const repository = await prisma.repository.findUnique({
            where: { 
                id: params.id,
                deletedAt: null,
            },
        });

        if (!repository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
            );
        }

        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 1;
        const limit = Math.min(Number(searchParams.get("limit")) || 10, 100);
        const skip = (page - 1) * limit;

        const [tokens, total] = await Promise.all([
            prisma.repositoryToken.findMany({
                where: {
                    repositoryId: params.id,
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
                    repositoryId: params.id,
                    deletedAt: null,
                },
            }),
        ]);

        return NextResponse.json({
            tokens,
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
    { params }: { params: { id: string } },
) {
    try {
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

        // Check if repository exists
        const repository = await prisma.repository.findUnique({
            where: { 
                id: params.id,
                deletedAt: null,
            },
        });

        if (!repository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
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

        // TODO: Validate token with GitHub API and get user details
        // This would involve:
        // 1. Making a request to GitHub API with the token
        // 2. Extracting user information
        // 3. Validating token permissions for the repository
        
        // For now, we'll create the token with placeholder GitHub user data
        const repositoryToken = await prisma.repositoryToken.create({
            data: {
                token, // TODO: Encrypt this token before storing
                alias,
                type,
                repositoryId: params.id,
                userId: user.id,
                // TODO: Replace with actual GitHub user data from API validation
                githubUserId: null,
                githubLogin: null,
                githubEmail: null,
                githubName: null,
                avatarUrl: null,
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

        return NextResponse.json(repositoryToken, { status: 201 });
    } catch (error) {
        console.error("Error creating repository token:", error);
        return NextResponse.json(
            { error: "Failed to create repository token" },
            { status: 500 },
        );
    }
}
