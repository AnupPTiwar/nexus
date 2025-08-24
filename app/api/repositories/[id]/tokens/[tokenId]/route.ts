import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    canDeleteRepositoryToken,
    canUpdateRepositoryToken,
} from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { UpdateRepositoryTokenSchema } from "@/lib/validations/repository";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; tokenId: string }> },
) {
    try {
        const { id, tokenId } = await params;
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = UpdateRepositoryTokenSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request body",
                    details: validationResult.error.issues,
                },
                { status: 400 },
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

        // Get repository and token
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

        const token = await prisma.repositoryToken.findUnique({
            where: {
                id: tokenId,
                repositoryId: id,
                deletedAt: null,
            },
        });

        if (!token) {
            return NextResponse.json(
                { error: "Token not found" },
                { status: 404 },
            );
        }

        // Check permissions to update token
        if (
            !canUpdateRepositoryToken(
                user.permissions,
                repository,
                token,
                user.id,
            )
        ) {
            return NextResponse.json(
                { error: "Insufficient permissions to update this token" },
                { status: 403 },
            );
        }

        // Update token
        const updatedToken = await prisma.repositoryToken.update({
            where: { id: tokenId },
            data: validationResult.data,
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
            ...updatedToken,
            githubUserId: updatedToken.githubUserId ? updatedToken.githubUserId.toString() : null,
        };

        return NextResponse.json(serializedToken);
    } catch (error) {
        console.error("Error updating repository token:", error);
        return NextResponse.json(
            { error: "Failed to update repository token" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string; tokenId: string }> },
) {
    try {
        const { id, tokenId } = await params;
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

        // Get repository and token
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

        const token = await prisma.repositoryToken.findUnique({
            where: {
                id: tokenId,
                repositoryId: id,
                deletedAt: null,
            },
        });

        if (!token) {
            return NextResponse.json(
                { error: "Token not found" },
                { status: 404 },
            );
        }

        // Check permissions to delete token
        if (
            !canDeleteRepositoryToken(
                user.permissions,
                repository,
                token,
                user.id,
            )
        ) {
            return NextResponse.json(
                { error: "Insufficient permissions to delete this token" },
                { status: 403 },
            );
        }

        // Soft delete token
        await prisma.repositoryToken.update({
            where: { id: tokenId },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });

        return NextResponse.json({
            message: "Repository token deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting repository token:", error);
        return NextResponse.json(
            { error: "Failed to delete repository token" },
            { status: 500 },
        );
    }
}
