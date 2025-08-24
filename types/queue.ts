// Types for job data
export interface RepositorySyncJobData {
    repositoryId: string;
    syncJobId: string;
    userId: string;
    options: {
        syncWorkflows: boolean;
        syncRuns: boolean;
        syncBranches: boolean;
        fullSync: boolean;
    };
    repository: {
        name: string;
        owner: string;
        url: string;
        visibility: string;
    };
}

export interface NotificationJobData {
    userId: string;
    type:
        | "sync_started"
        | "sync_completed"
        | "sync_failed"
        | "approval_required";
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
}

export interface WebhookJobData {
    repositoryId: string;
    eventType: string;
    action?: string;
    payload: Record<string, unknown>;
    signature?: string;
}

export interface SyncProgress {
    workflows: { total: number; completed: number; failed: number };
    runs: { total: number; completed: number; failed: number };
    branches: { total: number; completed: number; failed: number };
}
