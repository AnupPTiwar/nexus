import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateRepositorySchema } from "@/lib/validations/repository";

export async function GET(
    _request: Request,
    { params }: { params: { id: string } },
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const repository = await prisma.repository.findUnique({
            where: {
                id: params.id,
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

        return NextResponse.json(repository);
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
    { params }: { params: { id: string } },
) {
    try {
        const session = await auth();
        if (!session) {
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

        // Check if repository exists
        const existingRepository = await prisma.repository.findUnique({
            where: {
                id: params.id,
                deletedAt: null,
            },
        });

        if (!existingRepository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
            );
        }

        // Update repository
        const repository = await prisma.repository.update({
            where: { id: params.id },
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

        return NextResponse.json(repository);
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
    { params }: { params: { id: string } },
) {
    try {
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
                id: params.id,
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
            where: { id: params.id },
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
