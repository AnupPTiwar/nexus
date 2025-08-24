import type { Job } from "bullmq";
import yaml from "js-yaml";
import { createClientForUser } from "../../lib/github/token-service";
import { prisma } from "../../lib/prisma";
import type { RepositorySyncJobData, SyncProgress } from "../../types/queue";
import redis from "../redis";

// Helper function to publish progress updates
async function publishProgress(
    syncJobId: string,
    progressData: Record<string, unknown>,
) {
    try {
        await redis.publish(
            `sync:progress:${syncJobId}`,
            JSON.stringify(progressData),
        );
    } catch (error) {
        console.error("Failed to publish progress:", error);
    }
}

export async function processSyncJob(job: Job<RepositorySyncJobData>) {
    const { repositoryId, syncJobId, userId, options, repository } = job.data;

    try {
        // Update job to processing status
        await prisma.syncJob.update({
            where: { id: syncJobId },
            data: {
                status: "PROCESSING",
                startedAt: new Date(),
            },
        });

        // Publish initial progress
        await publishProgress(syncJobId, {
            stage: "initializing",
            message: "Setting up GitHub client...",
            status: "PROCESSING",
        });

        // Update job progress
        await job.updateProgress({
            stage: "initializing",
            message: "Setting up GitHub client...",
        });

        // Get GitHub client for the user
        const { client } = await createClientForUser(userId, repositoryId);

        let totalProcessed = 0;
        let totalFailed = 0;
        const progress: SyncProgress = {
            workflows: { total: 0, completed: 0, failed: 0 },
            runs: { total: 0, completed: 0, failed: 0 },
            branches: { total: 0, completed: 0, failed: 0 },
        };

        // Sync workflows
        if (options.syncWorkflows) {
            await publishProgress(syncJobId, {
                stage: "workflows",
                message: "Fetching workflows from GitHub...",
                progress,
            });

            await job.updateProgress({
                stage: "workflows",
                message: "Fetching workflows from GitHub...",
            });

            try {
                const workflows = await client.getWorkflows(
                    repository.owner,
                    repository.name,
                );
                progress.workflows.total = workflows.length;

                for (const workflow of workflows) {
                    try {
                        // Create or update workflow
                        await prisma.workflow.upsert({
                            where: {
                                repositoryId_githubId: {
                                    repositoryId,
                                    githubId: BigInt(workflow.id),
                                },
                            },
                            create: {
                                repositoryId,
                                githubId: BigInt(workflow.id),
                                nodeId: workflow.node_id,
                                name: workflow.name,
                                path: workflow.path,
                                state:
                                    workflow.state === "active"
                                        ? "ACTIVE"
                                        : "DISABLED",
                                badgeUrl: workflow.badge_url,
                                htmlUrl: workflow.html_url,
                            },
                            update: {
                                name: workflow.name,
                                path: workflow.path,
                                state:
                                    workflow.state === "active"
                                        ? "ACTIVE"
                                        : "DISABLED",
                                badgeUrl: workflow.badge_url,
                                htmlUrl: workflow.html_url,
                                updatedAt: new Date(),
                            },
                        });

                        progress.workflows.completed++;
                        totalProcessed++;

                        // Update progress periodically
                        if (progress.workflows.completed % 5 === 0) {
                            await publishProgress(syncJobId, {
                                stage: "workflows",
                                message: `Processed ${progress.workflows.completed}/${progress.workflows.total} workflows`,
                                progress,
                            });

                            await job.updateProgress({
                                stage: "workflows",
                                message: `Processed ${progress.workflows.completed}/${progress.workflows.total} workflows`,
                                ...progress,
                            });
                        }
                    } catch (workflowError) {
                        console.error(
                            `Failed to sync workflow ${workflow.id}:`,
                            workflowError,
                        );
                        progress.workflows.failed++;
                        totalFailed++;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch workflows:", error);
                throw new Error(
                    `Failed to fetch workflows: ${error instanceof Error ? error.message : "Unknown error"}`,
                );
            }
        }

        // Sync branches and workflow inputs
        if (options.syncBranches) {
            await job.updateProgress({
                stage: "branches",
                message: "Fetching branches from GitHub...",
            });

            try {
                const branches = await client.getBranches(
                    repository.owner,
                    repository.name,
                );
                progress.branches.total = branches.length;

                for (const branch of branches) {
                    try {
                        // Get workflows for this repository
                        const workflows = await prisma.workflow.findMany({
                            where: { repositoryId },
                            select: { id: true, path: true },
                        });

                        for (const workflow of workflows) {
                            try {
                                // Fetch workflow content for this branch
                                const workflowContent =
                                    await client.getWorkflowContent(
                                        repository.owner,
                                        repository.name,
                                        workflow.path,
                                        branch.name,
                                    );

                                // Parse inputs from workflow content (basic YAML parsing)
                                const inputs =
                                    parseWorkflowInputs(workflowContent);

                                // Create or update workflow branch
                                await prisma.workflowBranch.upsert({
                                    where: {
                                        workflowId_branchName: {
                                            workflowId: workflow.id,
                                            branchName: branch.name,
                                        },
                                    },
                                    create: {
                                        workflowId: workflow.id,
                                        branchName: branch.name,
                                        inputs: inputs as object, // Type assertion for Prisma Json
                                        lastSyncAt: new Date(),
                                    },
                                    update: {
                                        inputs: inputs as object, // Type assertion for Prisma Json
                                        lastSyncAt: new Date(),
                                    },
                                });
                            } catch (workflowBranchError) {
                                console.error(
                                    `Failed to sync workflow ${workflow.id} for branch ${branch.name}:`,
                                    workflowBranchError,
                                );
                                // Don't fail the whole job for individual workflow branches
                            }
                        }

                        progress.branches.completed++;

                        if (progress.branches.completed % 10 === 0) {
                            await job.updateProgress({
                                stage: "branches",
                                message: `Processed ${progress.branches.completed}/${progress.branches.total} branches`,
                                ...progress,
                            });
                        }
                    } catch (branchError) {
                        console.error(
                            `Failed to sync branch ${branch.name}:`,
                            branchError,
                        );
                        progress.branches.failed++;
                        totalFailed++;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch branches:", error);
                throw new Error(
                    `Failed to fetch branches: ${error instanceof Error ? error.message : "Unknown error"}`,
                );
            }
        }

        // Sync recent workflow runs
        if (options.syncRuns) {
            await job.updateProgress({
                stage: "runs",
                message: "Fetching recent workflow runs...",
            });

            try {
                const runsData = await client.getWorkflowRuns(
                    repository.owner,
                    repository.name,
                    undefined,
                    { per_page: options.fullSync ? 100 : 25 },
                );

                const runs = runsData.workflow_runs;
                progress.runs.total = runs.length;

                for (const run of runs) {
                    try {
                        // Find the workflow in our database
                        const workflow = await prisma.workflow.findUnique({
                            where: {
                                repositoryId_githubId: {
                                    repositoryId,
                                    githubId: BigInt(run.workflow_id),
                                },
                            },
                        });

                        if (workflow) {
                            // Create or update workflow run
                            await prisma.workflowRun.upsert({
                                where: {
                                    workflowId_githubId_runAttempt: {
                                        workflowId: workflow.id,
                                        githubId: BigInt(run.id),
                                        runAttempt: run.run_attempt || 1,
                                    },
                                },
                                create: {
                                    workflowId: workflow.id,
                                    githubId: BigInt(run.id),
                                    nodeId: run.node_id || undefined,
                                    runNumber: run.run_number,
                                    runAttempt: run.run_attempt || 1,
                                    displayTitle:
                                        run.display_title ||
                                        run.name ||
                                        `Run #${run.run_number}`,
                                    status: mapRunStatus(
                                        run.status || "pending",
                                    ),
                                    conclusion: run.conclusion
                                        ? mapRunConclusion(run.conclusion)
                                        : null,
                                    source: "IMPORTED",
                                    triggerBranch: run.head_branch || "main",
                                    headBranch: run.head_branch || undefined,
                                    headSha: run.head_sha,
                                    baseSha: run.head_sha, // GitHub API doesn't always provide base_sha
                                    event: run.event || undefined,
                                    actorId: run.actor
                                        ? BigInt(run.actor.id)
                                        : null,
                                    actorLogin: run.actor?.login || undefined,
                                    actorType: run.actor?.type || undefined,
                                    runStartedAt: run.run_started_at
                                        ? new Date(run.run_started_at)
                                        : null,
                                    runCompletedAt: run.updated_at
                                        ? new Date(run.updated_at)
                                        : null,
                                    htmlUrl: run.html_url || undefined,
                                    jobsUrl: run.jobs_url || undefined,
                                    logsUrl: run.logs_url || undefined,
                                    checkSuiteUrl:
                                        run.check_suite_url || undefined,
                                    artifactsUrl:
                                        run.artifacts_url || undefined,
                                    cancelUrl: run.cancel_url || undefined,
                                    rerunUrl: run.rerun_url || undefined,
                                },
                                update: {
                                    displayTitle:
                                        run.display_title ||
                                        run.name ||
                                        `Run #${run.run_number}`,
                                    status: mapRunStatus(
                                        run.status || "pending",
                                    ),
                                    conclusion: run.conclusion
                                        ? mapRunConclusion(run.conclusion)
                                        : null,
                                    runCompletedAt: run.updated_at
                                        ? new Date(run.updated_at)
                                        : null,
                                    updatedAt: new Date(),
                                },
                            });
                        }

                        progress.runs.completed++;
                        totalProcessed++;

                        if (progress.runs.completed % 10 === 0) {
                            await job.updateProgress({
                                stage: "runs",
                                message: `Processed ${progress.runs.completed}/${progress.runs.total} workflow runs`,
                                ...progress,
                            });
                        }
                    } catch (runError) {
                        console.error(
                            `Failed to sync run ${run.id}:`,
                            runError,
                        );
                        progress.runs.failed++;
                        totalFailed++;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch workflow runs:", error);
                throw new Error(
                    `Failed to fetch workflow runs: ${error instanceof Error ? error.message : "Unknown error"}`,
                );
            }
        }

        // Complete the sync job
        await prisma.syncJob.update({
            where: { id: syncJobId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                processedItems: totalProcessed,
                failedItems: totalFailed,
                progress: progress as object, // Type assertion for Prisma Json
            },
        });

        // Mark repository as not syncing
        await prisma.repository.update({
            where: { id: repositoryId },
            data: {
                isSyncing: false,
                lastSyncAt: new Date(),
            },
        });

        // Publish completion progress
        await publishProgress(syncJobId, {
            stage: "completed",
            message: `Sync completed successfully. Processed ${totalProcessed} items, ${totalFailed} failed.`,
            status: "COMPLETED",
            progress,
            totalProcessed,
            totalFailed,
        });

        // Create success notification
        await prisma.notification.create({
            data: {
                userId,
                type: "SUCCESS",
                title: "Sync Completed",
                message: `Repository ${repository.owner}/${repository.name} synchronized successfully. Processed ${totalProcessed} items, ${totalFailed} failed.`,
                resourceType: "REPOSITORY",
                resourceId: repositoryId,
                metadata: {
                    syncJobId,
                    totalProcessed,
                    totalFailed,
                    ...progress,
                } as object, // Type assertion for Prisma Json
            },
        });

        return { success: true, totalProcessed, totalFailed, progress };
    } catch (error) {
        console.error("Sync job failed:", error);

        // Publish failure progress
        await publishProgress(syncJobId, {
            stage: "failed",
            message: `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
        });

        // Update sync job as failed
        await prisma.syncJob.update({
            where: { id: syncJobId },
            data: {
                status: "FAILED",
                completedAt: new Date(),
                errors: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    timestamp: new Date().toISOString(),
                } as object, // Type assertion for Prisma Json
            },
        });

        // Mark repository as not syncing
        await prisma.repository.update({
            where: { id: repositoryId },
            data: { isSyncing: false },
        });

        // Create failure notification
        await prisma.notification.create({
            data: {
                userId,
                type: "ERROR",
                title: "Sync Failed",
                message: `Repository ${repository.owner}/${repository.name} sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                resourceType: "REPOSITORY",
                resourceId: repositoryId,
                metadata: {
                    syncJobId,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                } as object, // Type assertion for Prisma Json
            },
        });

        throw error;
    }
}

// Helper functions
function parseWorkflowInputs(workflowContent: string): Record<string, unknown> {
    try {
        // Use proper YAML parsing to extract workflow inputs
        const parsedYaml = yaml.load(workflowContent) as Record<
            string,
            unknown
        >;

        // Navigate to workflow_dispatch.inputs
        // biome-ignore lint/suspicious/noExplicitAny: <have to make it any >
        const yamlData = parsedYaml as any;
        const workflowDispatch =
            yamlData?.on?.workflow_dispatch || yamlData?.workflow_dispatch;
        if (!workflowDispatch?.inputs) {
            return {};
        }

        const inputs = workflowDispatch.inputs;
        const normalizedInputs: Record<string, unknown> = {};

        // Convert YAML inputs to our format
        for (const [inputName, inputConfig] of Object.entries(inputs)) {
            if (typeof inputConfig === "object" && inputConfig !== null) {
                const config = inputConfig as Record<string, unknown>;
                normalizedInputs[inputName] = {
                    description: config.description || "",
                    required: Boolean(config.required),
                    default: config.default,
                    type: config.type || "string",
                    options: config.options || config.choices, // Support both GitHub formats
                };
            }
        }

        return normalizedInputs;
    } catch (error) {
        console.error("Failed to parse workflow YAML:", error);
        // Fallback to regex parsing if YAML parsing fails
        return parseWorkflowInputsFallback(workflowContent);
    }
}

// Fallback regex-based parser for malformed YAML
function parseWorkflowInputsFallback(
    workflowContent: string,
): Record<string, unknown> {
    try {
        const inputsMatch = workflowContent.match(
            /workflow_dispatch:\s*\n\s*inputs:([\s\S]*?)(?=\n\w|\n\s*$)/,
        );
        if (!inputsMatch) return {};

        const inputsSection = inputsMatch[1];
        const inputs: Record<string, unknown> = {};

        const inputPattern = /\s*(\w+):\s*\n((?:\s+.*\n)*)/g;
        let match: RegExpExecArray | null;

        // Fix: Extract assignment from while condition
        match = inputPattern.exec(inputsSection);
        while (match !== null) {
            const [, inputName, inputConfig] = match;
            inputs[inputName] = {
                description: extractValue(inputConfig, "description"),
                required: extractValue(inputConfig, "required") === "true",
                default: extractValue(inputConfig, "default"),
                type: extractValue(inputConfig, "type") || "string",
            };
            match = inputPattern.exec(inputsSection);
        }

        return inputs;
    } catch (error) {
        console.error("Failed to parse workflow inputs with fallback:", error);
        return {};
    }
}

function extractValue(config: string, key: string): string | undefined {
    const match = config.match(new RegExp(`\\s*${key}:\\s*(.+)`));
    return match ? match[1].trim().replace(/['"]/g, "") : undefined;
}

function mapRunStatus(status: string) {
    switch (status) {
        case "queued":
            return "QUEUED";
        case "in_progress":
            return "IN_PROGRESS";
        case "completed":
            return "COMPLETED";
        default:
            return "PENDING";
    }
}

function mapRunConclusion(conclusion: string) {
    switch (conclusion) {
        case "success":
            return "SUCCESS";
        case "failure":
            return "FAILURE";
        case "cancelled":
            return "CANCELLED";
        case "skipped":
            return "SKIPPED";
        case "timed_out":
            return "TIMED_OUT";
        default:
            return "FAILURE";
    }
}
