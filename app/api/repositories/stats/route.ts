import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Get repository statistics
        const [
            totalRepositories,
            activeRepositories,
            inactiveRepositories,
            syncingRepositories,
            publicRepositories,
            privateRepositories,
            totalWorkflows,
        ] = await Promise.all([
            // Total repositories (excluding deleted)
            prisma.repository.count({
                where: { deletedAt: null },
            }),
            // Active repositories
            prisma.repository.count({
                where: {
                    deletedAt: null,
                    isActive: true,
                },
            }),
            // Inactive repositories
            prisma.repository.count({
                where: {
                    deletedAt: null,
                    isActive: false,
                },
            }),
            // Currently syncing repositories
            prisma.repository.count({
                where: {
                    deletedAt: null,
                    isSyncing: true,
                },
            }),
            // Public repositories
            prisma.repository.count({
                where: {
                    deletedAt: null,
                    visibility: "PUBLIC",
                },
            }),
            // Private repositories
            prisma.repository.count({
                where: {
                    deletedAt: null,
                    visibility: "PRIVATE",
                },
            }),
            // Total workflows across all repositories
            prisma.workflow.count({
                where: {
                    deletedAt: null,
                    repository: {
                        deletedAt: null,
                    },
                },
            }),
        ]);

        // Calculate average workflows per repository
        const averageWorkflowsPerRepo =
            totalRepositories > 0
                ? Number((totalWorkflows / totalRepositories).toFixed(1))
                : 0;

        const stats = {
            totalRepositories,
            activeRepositories,
            inactiveRepositories,
            syncingRepositories,
            publicRepositories,
            privateRepositories,
            totalWorkflows,
            averageWorkflowsPerRepo,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching repository stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch repository stats" },
            { status: 500 },
        );
    }
}
