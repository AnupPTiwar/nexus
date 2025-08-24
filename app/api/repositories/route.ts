import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    CreateRepositorySchema,
    RepositoriesQuerySchema,
} from "@/lib/validations/repository";
import type { RepositoryWhereInput } from "@/prisma/generated/models";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams.entries());

        // Validate query parameters
        const validationResult = RepositoriesQuerySchema.safeParse(params);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid query parameters",
                    details: validationResult.error.issues,
                },
                { status: 400 },
            );
        }

        const {
            page,
            limit,
            search,
            visibility,
            isActive,
            isSyncing,
            sortBy,
            sortOrder,
        } = validationResult.data;
        const skip = (page - 1) * limit;

        const where: RepositoryWhereInput = {
            deletedAt: null, // Only show non-deleted repositories
            // Only show repositories owned by user OR public repositories
            OR: [
                { user: { email: session.user?.email } }, // Repositories owned by the user
                { visibility: "PUBLIC" }, // Public repositories
            ],
        };

        // Build AND conditions array
        const andConditions: RepositoryWhereInput[] = [];

        // Apply search filter
        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { githubOwner: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            });
        }

        // Apply visibility filter (only if user wants to filter further)
        if (visibility) {
            // If filtering by PRIVATE, only show user's private repos
            if (visibility === "PRIVATE") {
                andConditions.push({
                    visibility: visibility,
                    user: { email: session.user?.email }, // Ensure private repos are only user's own
                });
            } else {
                // For PUBLIC filter, just add it to AND conditions
                andConditions.push({ visibility: visibility });
            }
        }

        // Apply AND conditions if any exist
        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (isSyncing !== undefined) {
            where.isSyncing = isSyncing;
        }

        const [repositories, total] = await Promise.all([
            prisma.repository.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                select: {
                    id: true,
                    name: true,
                    githubOwner: true,
                    githubRepoId: true,
                    githubUrl: true,
                    description: true,
                    visibility: true,
                    isActive: true,
                    isSyncing: true,
                    lastSyncAt: true,
                    webhookSecret: true,
                    userId: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    _count: {
                        select: {
                            repositoryTokens: true,
                            workflows: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.repository.count({ where }),
        ]);

        // Convert BigInt to string for JSON serialization
        const serializedRepositories = repositories.map(repo => ({
            ...repo,
            githubRepoId: repo.githubRepoId?.toString() || null,
        }));

        return NextResponse.json({
            repositories: serializedRepositories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching repositories:", error);
        return NextResponse.json(
            { error: "Failed to fetch repositories" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
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
        const validationResult = CreateRepositorySchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request body",
                    details: validationResult.error.issues,
                },
                { status: 400 },
            );
        }

        const { name, githubOwner, githubUrl, description, visibility } =
            validationResult.data;

        // Check if repository already exists
        const existingRepository = await prisma.repository.findUnique({
            where: { githubUrl },
        });

        if (existingRepository) {
            return NextResponse.json(
                { error: "Repository with this GitHub URL already exists" },
                { status: 409 },
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

        // Create repository
        const repository = await prisma.repository.create({
            data: {
                name,
                githubOwner,
                githubUrl,
                description,
                visibility,
                userId: user.id,
            },
            include: {
                _count: {
                    select: {
                        repositoryTokens: true,
                        workflows: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Convert BigInt to string for JSON serialization
        const serializedRepository = {
            ...repository,
            githubRepoId: repository.githubRepoId?.toString() || null,
        };

        return NextResponse.json(serializedRepository, { status: 201 });
    } catch (error) {
        console.error("Error creating repository:", error);
        return NextResponse.json(
            { error: "Failed to create repository" },
            { status: 500 },
        );
    }
}
