import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { UpdateRepositorySchema } from "@/lib/validations/repository";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const repository = await prisma.repository.findUnique({
            where: {
                id,
                deletedAt: null,
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

        if (!repository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
            );
        }

        // Convert BigInt to string for JSON serialization
        const serializedRepository = {
            ...repository,
            githubRepoId: repository.githubRepoId?.toString() || null,
        };

        return NextResponse.json(serializedRepository);
    } catch (error) {
        console.error("Error fetching repository:", error);
        return NextResponse.json(
            { error: "Failed to fetch repository" },
            { status: 500 },
        );
    }
}

export async function PUT(
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
        const validationResult = UpdateRepositorySchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request body",
                    details: validationResult.error.issues,
                },
                { status: 400 },
            );
        }

        // Check if repository exists and get owner info
        const existingRepository = await prisma.repository.findUnique({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                user: true,
            },
        });

        if (!existingRepository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
            );
        }

        // Permission checks:
        // 1. User can update their own repository
        // 2. User with REPOSITORY:MANAGE permission can update public repositories
        const isOwner = existingRepository.user?.email === session.user.email;
        const isPublic = existingRepository.visibility === "PUBLIC";
        const hasManagePermission = hasPermission(
            session.user.permissions,
            "REPOSITORY:MANAGE",
        );

        if (!isOwner && !(isPublic && hasManagePermission)) {
            return NextResponse.json(
                {
                    error: "You don't have permission to update this repository",
                },
                { status: 403 },
            );
        }

        // Update repository
        const repository = await prisma.repository.update({
            where: { id },
            data: validationResult.data,
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

        return NextResponse.json(serializedRepository);
    } catch (error) {
        console.error("Error updating repository:", error);
        return NextResponse.json(
            { error: "Failed to update repository" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Check if repository exists
        const existingRepository = await prisma.repository.findUnique({
            where: {
                id,
                deletedAt: null,
            },
        });

        if (!existingRepository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
            );
        }

        // Soft delete repository
        await prisma.repository.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });

        return NextResponse.json({
            message: "Repository deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting repository:", error);
        return NextResponse.json(
            { error: "Failed to delete repository" },
            { status: 500 },
        );
    }
}
