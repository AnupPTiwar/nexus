import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SyncRepositorySchema } from "@/lib/validations/repository";

export async function POST(
    request: Request,
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

        const body = await request.json();

        // Validate request body
        const validationResult = SyncRepositorySchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request body",
                    details: validationResult.error.issues,
                },
                { status: 400 },
            );
        }

        const { force } = validationResult.data;

        // Check if repository exists
        const repository = await prisma.repository.findUnique({
            where: { 
                id,
                deletedAt: null,
            },
            include: {
                repositoryTokens: {
                    where: {
                        isActive: true,
                        deletedAt: null,
                    },
                    take: 1,
                },
            },
        });

        if (!repository) {
            return NextResponse.json(
                { error: "Repository not found" },
                { status: 404 },
            );
        }

        // Check if repository is already syncing (unless force is true)
        if (repository.isSyncing && !force) {
            return NextResponse.json(
                { error: "Repository is already syncing" },
                { status: 409 },
            );
        }

        // Check if repository has active tokens
        if (repository.repositoryTokens.length === 0) {
            return NextResponse.json(
                { error: "Repository has no active tokens for syncing" },
                { status: 400 },
            );
        }

        // Mark repository as syncing
        await prisma.repository.update({
            where: { id },
            data: {
                isSyncing: true,
            },
        });

        // TODO: Implement actual GitHub API sync logic here
        // This would involve:
        // 1. Fetching workflows from GitHub API
        // 2. Updating/creating workflow records in database
        // 3. Handling webhook setup
        // 4. Error handling and rollback

        // For now, simulate sync completion after a short delay
        setTimeout(async () => {
            try {
                await prisma.repository.update({
                    where: { id },
                    data: {
                        isSyncing: false,
                        lastSyncAt: new Date(),
                    },
                });
            } catch (error) {
                console.error("Error completing sync:", error);
            }
        }, 2000);

        return NextResponse.json({
            message: "Repository sync started successfully",
            repositoryId: id,
            force,
        });
    } catch (error) {
        console.error("Error syncing repository:", error);
        
        // Ensure we reset syncing status on error
        try {
            await prisma.repository.update({
                where: { id },
                data: {
                    isSyncing: false,
                },
            });
        } catch (resetError) {
            console.error("Error resetting sync status:", resetError);
        }

        return NextResponse.json(
            { error: "Failed to sync repository" },
            { status: 500 },
        );
    }
}
