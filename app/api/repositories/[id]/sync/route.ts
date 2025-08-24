import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SyncRepositorySchema } from "@/lib/validations/repository";
import { syncQueue } from "@/queues";

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

        const {
            force = false,
            syncWorkflows = true,
            syncRuns = true,
            syncBranches = true,
            fullSync = false,
        } = validationResult.data;

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
                lastSyncAt: new Date(),
            },
        });

        // Create sync job record
        const syncJob = await prisma.syncJob.create({
            data: {
                repositoryId: id,
                type: fullSync ? "full" : "incremental",
                status: "PENDING",
                progress: {
                    workflows: { total: 0, completed: 0, failed: 0 },
                    runs: { total: 0, completed: 0, failed: 0 },
                    branches: { total: 0, completed: 0, failed: 0 },
                } as object, // Type assertion for Prisma Json
                startedAt: new Date(),
            },
        });

        // Add job to BullMQ queue
        const job = await syncQueue.add(
            "repository-sync",
            {
                repositoryId: id,
                syncJobId: syncJob.id,
                userId: session.user.id,
                options: {
                    syncWorkflows,
                    syncRuns,
                    syncBranches,
                    fullSync,
                },
                repository: {
                    name: repository.name,
                    owner: repository.githubOwner,
                    url: repository.githubUrl,
                    visibility: repository.visibility,
                },
            },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: 10,
                removeOnFail: 5,
            },
        );

        // Create notification for sync start
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                type: "INFO",
                title: "Sync Started",
                message: `Repository sync started for ${repository.githubOwner}/${repository.name}`,
                resourceType: "REPOSITORY",
                resourceId: id,
                metadata: {
                    syncJobId: syncJob.id,
                    jobId: job.id,
                    repository: repository.name,
                    owner: repository.githubOwner,
                } as object, // Type assertion for Prisma Json
            },
        });

        return NextResponse.json({
            success: true,
            syncJobId: syncJob.id,
            jobId: job.id,
            message: "Repository sync started",
            repository: {
                id: repository.id,
                name: repository.name,
                owner: repository.githubOwner,
            },
        });
    } catch (error) {
        console.error("Error syncing repository:", error);

        // Ensure we reset syncing status on error
        try {
            const { id: repositoryId } = await params;
            await prisma.repository.update({
                where: { id: repositoryId },
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
