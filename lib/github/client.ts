import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";

// Enhanced Octokit with retry and throttling plugins
const EnhancedOctokit = Octokit.plugin(retry, throttling);

export interface GitHubClientOptions {
    auth: string;
    userAgent?: string;
    baseUrl?: string;
}

export class GitHubClient {
    private octokit: InstanceType<typeof EnhancedOctokit>;

    constructor(options: GitHubClientOptions) {
        this.octokit = new EnhancedOctokit({
            auth: options.auth,
            userAgent: options.userAgent || "Nexus-Platform/1.0",
            baseUrl: options.baseUrl,
            throttle: {
                onRateLimit: (retryAfter, _options, _octokit, retryCount) => {
                    console.warn(
                        `GitHub API rate limit exceeded. Retrying after ${retryAfter} seconds. Retry count: ${retryCount}`,
                    );
                    if (retryCount < 3) return true;
                    return false;
                },
                onSecondaryRateLimit: (
                    retryAfter,
                    _options,
                    _octokit,
                    retryCount,
                ) => {
                    console.warn(
                        `GitHub API secondary rate limit hit. Retrying after ${retryAfter} seconds. Retry count: ${retryCount}`,
                    );
                    if (retryCount < 2) return true;
                    return false;
                },
            },
            retry: {
                doNotRetry: ["400", "401", "403", "404", "422"],
            },
        });
    }

    // Get authenticated user info and validate token
    async validateToken() {
        try {
            const { data: user } = await this.octokit.users.getAuthenticated();

            // Get token scopes from headers
            const response = await this.octokit.request("GET /user");
            const scopeHeader = response.headers["x-oauth-scopes"];
            const scopes =
                typeof scopeHeader === "string" ? scopeHeader.split(", ") : [];

            return {
                valid: true,
                user,
                scopes,
            };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            return {
                valid: false,
                error: errorMessage,
            };
        }
    }

    // Get repository workflows
    async getWorkflows(owner: string, repo: string) {
        try {
            const { data } = await this.octokit.actions.listRepoWorkflows({
                owner,
                repo,
                per_page: 100,
            });
            return data.workflows;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            throw new Error(
                `Failed to fetch workflows for ${owner}/${repo}: ${errorMessage}`,
            );
        }
    }

    // Get workflow file content
    async getWorkflowContent(
        owner: string,
        repo: string,
        path: string,
        ref: string = "main",
    ) {
        try {
            const { data } = await this.octokit.repos.getContent({
                owner,
                repo,
                path,
                ref,
            });

            if ("content" in data) {
                return Buffer.from(data.content, "base64").toString("utf8");
            }
            throw new Error("Workflow file not found or is not a file");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            throw new Error(
                `Failed to fetch workflow content: ${errorMessage}`,
            );
        }
    }

    // Get repository branches
    async getBranches(owner: string, repo: string) {
        try {
            const { data } = await this.octokit.repos.listBranches({
                owner,
                repo,
                per_page: 100,
            });
            return data;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            throw new Error(
                `Failed to fetch branches for ${owner}/${repo}: ${errorMessage}`,
            );
        }
    }

    // Get repository info
    async getRepository(owner: string, repo: string) {
        try {
            const { data } = await this.octokit.repos.get({
                owner,
                repo,
            });
            return data;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            throw new Error(
                `Failed to fetch repository ${owner}/${repo}: ${errorMessage}`,
            );
        }
    }

    // Trigger workflow dispatch
    async triggerWorkflow(
        owner: string,
        repo: string,
        workflowId: string,
        ref: string,
        inputs?: Record<string, unknown>,
    ) {
        try {
            await this.octokit.actions.createWorkflowDispatch({
                owner,
                repo,
                workflow_id: workflowId,
                ref,
                inputs,
            });
            return true;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to trigger workflow: ${errorMessage}`);
        }
    }

    // Get workflow runs
    async getWorkflowRuns(
        owner: string,
        repo: string,
        workflowId?: string,
        options: {
            status?: "queued" | "in_progress" | "completed";
            branch?: string;
            per_page?: number;
            page?: number;
        } = {},
    ) {
        try {
            if (workflowId) {
                const params = {
                    owner,
                    repo,
                    workflow_id: workflowId,
                    status: options.status,
                    branch: options.branch,
                    per_page: options.per_page || 30,
                    page: options.page || 1,
                };
                const { data } =
                    await this.octokit.actions.listWorkflowRuns(params);
                return data;
            } else {
                const params = {
                    owner,
                    repo,
                    status: options.status,
                    branch: options.branch,
                    per_page: options.per_page || 30,
                    page: options.page || 1,
                };
                const { data } =
                    await this.octokit.actions.listWorkflowRunsForRepo(params);
                return data;
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch workflow runs: ${errorMessage}`);
        }
    }

    // Get rate limit info
    async getRateLimit() {
        try {
            const { data } = await this.octokit.rateLimit.get();
            return data;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch rate limit: ${errorMessage}`);
        }
    }

    // Raw Octokit instance for advanced operations
    get client() {
        return this.octokit;
    }
}

// Factory function to create GitHub client
export function createGitHubClient(
    token: string,
    options: Partial<GitHubClientOptions> = {},
): GitHubClient {
    return new GitHubClient({
        auth: token,
        ...options,
    });
}
