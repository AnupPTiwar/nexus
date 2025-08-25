import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get active sync jobs for user's repositories
        const activeSyncJobs = await prisma.syncJob.findMany({
            where: {
                status: "PROCESSING",
                repository: {
                    OR: [
                        { userId: session.user.id },
                        {
                            repositoryTokens: {
                                some: {
                                    userId: session.user.id,
                                    isActive: true,
                                },
                            },
                        },
                    ],
                },
            },
            include: {
                repository: {
                    select: {
                        name: true,
                        githubOwner: true,
                    },
                },
            },
            orderBy: { startedAt: "desc" },
        });

        // Transform to the format expected by the sync activity card
        const syncActivities = activeSyncJobs.map(job => ({
            jobId: job.id,
            repositoryId: job.repositoryId,
            repository: {
                name: job.repository.name,
                owner: job.repository.githubOwner,
            },
            status: job.status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
            progress: job.progress as any || {
                workflows: { total: 0, completed: 0, failed: 0 },
                runs: { total: 0, completed: 0, failed: 0 },
                branches: { total: 0, completed: 0, failed: 0 },
            },
            processedItems: job.processedItems || 0,
            failedItems: job.failedItems || 0,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
        }));

        return NextResponse.json(syncActivities);
    } catch (error) {
        console.error("Failed to fetch active sync jobs:", error);
        return NextResponse.json(
            { error: "Failed to fetch active sync jobs" },
            { status: 500 }
        );
    }
}