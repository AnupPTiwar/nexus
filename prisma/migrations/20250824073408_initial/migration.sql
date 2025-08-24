-- CreateEnum
CREATE TYPE "public"."ResourceAction" AS ENUM ('CREATE', 'DELETE', 'MANAGE', 'READ', 'UPDATE', 'TRIGGER');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('REPOSITORY', 'WORKFLOW', 'WORKFLOW_RUN', 'WORKFLOW_GROUP', 'TOKEN', 'USER', 'AUDIT', 'SCHEDULER', 'WORKFLOW_TEMPLATE', 'NOTIFICATION', 'USER_PREFERENCES', 'BRANCH');

-- CreateEnum
CREATE TYPE "public"."WorkflowRunStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'DISPATCHED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."WorkflowRunConclusion" AS ENUM ('SUCCESS', 'FAILURE', 'CANCELLED', 'SKIPPED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "public"."WorkflowRunSource" AS ENUM ('PLATFORM', 'GITHUB_UI', 'GITHUB_API', 'GITHUB_EVENT', 'IMPORTED');

-- CreateEnum
CREATE TYPE "public"."WorkflowJobStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'WAITING');

-- CreateEnum
CREATE TYPE "public"."WorkflowJobConclusion" AS ENUM ('SUCCESS', 'FAILURE', 'CANCELLED', 'SKIPPED', 'TIMED_OUT', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "public"."WorkflowStepStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."WorkflowStepConclusion" AS ENUM ('SUCCESS', 'FAILURE', 'CANCELLED', 'SKIPPED', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'TRIGGER_WORKFLOW', 'SYNC_REPOSITORY', 'LOCK_USER', 'UNLOCK_USER', 'IMPORT_WORKFLOW_RUN');

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."WorkflowState" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('GITHUB', 'MICROSOFT', 'GITLAB', 'BITBUCKET');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('OWNER', 'CONTRIBUTOR', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."SchedulerStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'TIMED_OUT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "githubAccessToken" TEXT,
    "importExternalRuns" BOOLEAN NOT NULL DEFAULT false,
    "showOnlyPlatformRuns" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[] DEFAULT ARRAY['REPOSITORY:READ', 'WORKFLOW:READ', 'WORKFLOW_RUN:READ']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_accounts" (
    "id" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repositories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "githubOwner" TEXT NOT NULL,
    "githubRepoId" BIGINT,
    "githubUrl" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "public"."Visibility" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSyncing" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "webhookSecret" TEXT,
    "webhookId" TEXT,
    "importAllRuns" BOOLEAN NOT NULL DEFAULT false,
    "autoSync" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repository_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "alias" TEXT,
    "type" "public"."TokenType" NOT NULL DEFAULT 'PRIVATE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "githubUserId" BIGINT,
    "githubLogin" TEXT,
    "githubEmail" TEXT,
    "githubName" TEXT,
    "avatarUrl" TEXT,
    "scopes" TEXT[],
    "repositoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "repository_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflows" (
    "id" TEXT NOT NULL,
    "githubId" BIGINT NOT NULL,
    "nodeId" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "state" "public"."WorkflowState" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "badgeUrl" TEXT,
    "htmlUrl" TEXT,
    "defaultInputs" JSONB,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_branches" (
    "id" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "workflowId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_runs" (
    "id" TEXT NOT NULL,
    "githubId" BIGINT NOT NULL,
    "nodeId" TEXT,
    "runNumber" INTEGER NOT NULL,
    "runAttempt" INTEGER NOT NULL DEFAULT 1,
    "displayTitle" TEXT,
    "status" "public"."WorkflowRunStatus" NOT NULL,
    "conclusion" "public"."WorkflowRunConclusion",
    "source" "public"."WorkflowRunSource" NOT NULL DEFAULT 'PLATFORM',
    "triggerBranch" TEXT NOT NULL,
    "headBranch" TEXT,
    "headSha" TEXT NOT NULL,
    "baseSha" TEXT,
    "event" TEXT,
    "environment" TEXT,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "runnerId" INTEGER,
    "runnerName" TEXT,
    "runnerGroupId" INTEGER,
    "runnerGroupName" TEXT,
    "inputs" JSONB,
    "outputs" JSONB,
    "runStartedAt" TIMESTAMP(3),
    "runCompletedAt" TIMESTAMP(3),
    "htmlUrl" TEXT,
    "jobsUrl" TEXT,
    "logsUrl" TEXT,
    "checkSuiteUrl" TEXT,
    "artifactsUrl" TEXT,
    "cancelUrl" TEXT,
    "rerunUrl" TEXT,
    "actorId" BIGINT,
    "actorLogin" TEXT,
    "actorType" TEXT,
    "triggeredById" TEXT,
    "actorAccountId" TEXT,
    "parentRunId" TEXT,
    "workflowId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_jobs" (
    "id" TEXT NOT NULL,
    "githubId" BIGINT,
    "nodeId" TEXT,
    "runId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "headSha" TEXT,
    "status" "public"."WorkflowJobStatus" NOT NULL,
    "conclusion" "public"."WorkflowJobConclusion",
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "runnerName" TEXT,
    "runnerGroupName" TEXT,
    "runnerId" INTEGER,
    "runnerGroupId" INTEGER,
    "htmlUrl" TEXT,
    "checkRunUrl" TEXT,
    "labels" TEXT[],
    "workflowRunId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_steps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."WorkflowStepStatus" NOT NULL,
    "conclusion" "public"."WorkflowStepConclusion",
    "number" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "workflowJobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."branch_permissions" (
    "id" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canTrigger" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_jobs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "public"."SyncStatus" NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "progress" JSONB,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" TEXT NOT NULL,
    "githubEventId" TEXT,
    "githubDeliveryId" TEXT,
    "eventType" TEXT NOT NULL,
    "action" TEXT,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "resourceType" "public"."ResourceType",
    "resourceId" VARCHAR(255),
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "resourceType" "public"."ResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_approvals" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "githubRunId" BIGINT NOT NULL,
    "environment" TEXT,
    "status" "public"."ApprovalStatus" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "approvers" JSONB,
    "approverDetails" TEXT,
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "comment" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "environmentUrl" TEXT,
    "notificationsSent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "workflowRunId" TEXT,
    "approvalId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rerun_history" (
    "id" TEXT NOT NULL,
    "parentRunId" TEXT NOT NULL,
    "newRunId" TEXT,
    "reRunType" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "reason" TEXT,
    "githubResponse" JSONB,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rerun_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_snapshots" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT,
    "metrics" JSONB NOT NULL,
    "hourlyData" JSONB,
    "dailyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "public"."users"("status");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "public"."users"("createdAt");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "public"."users"("lastLoginAt");

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "public"."providers"("name");

-- CreateIndex
CREATE INDEX "provider_accounts_userId_idx" ON "public"."provider_accounts"("userId");

-- CreateIndex
CREATE INDEX "provider_accounts_providerId_idx" ON "public"."provider_accounts"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_accounts_providerId_providerAccountId_key" ON "public"."provider_accounts"("providerId", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_accounts_userId_providerId_key" ON "public"."provider_accounts"("userId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_githubUrl_key" ON "public"."repositories"("githubUrl");

-- CreateIndex
CREATE INDEX "repositories_userId_idx" ON "public"."repositories"("userId");

-- CreateIndex
CREATE INDEX "repositories_githubOwner_name_idx" ON "public"."repositories"("githubOwner", "name");

-- CreateIndex
CREATE INDEX "repository_tokens_repositoryId_idx" ON "public"."repository_tokens"("repositoryId");

-- CreateIndex
CREATE INDEX "repository_tokens_userId_idx" ON "public"."repository_tokens"("userId");

-- CreateIndex
CREATE INDEX "repository_tokens_type_isActive_idx" ON "public"."repository_tokens"("type", "isActive");

-- CreateIndex
CREATE INDEX "workflows_repositoryId_idx" ON "public"."workflows"("repositoryId");

-- CreateIndex
CREATE INDEX "workflows_state_isActive_idx" ON "public"."workflows"("state", "isActive");

-- CreateIndex
CREATE INDEX "workflows_name_idx" ON "public"."workflows"("name");

-- CreateIndex
CREATE INDEX "workflows_repositoryId_state_isActive_idx" ON "public"."workflows"("repositoryId", "state", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workflows_repositoryId_githubId_key" ON "public"."workflows"("repositoryId", "githubId");

-- CreateIndex
CREATE INDEX "workflow_branches_workflowId_idx" ON "public"."workflow_branches"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_branches_branchName_idx" ON "public"."workflow_branches"("branchName");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_branches_workflowId_branchName_key" ON "public"."workflow_branches"("workflowId", "branchName");

-- CreateIndex
CREATE INDEX "workflow_runs_workflowId_idx" ON "public"."workflow_runs"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_runs_triggeredById_idx" ON "public"."workflow_runs"("triggeredById");

-- CreateIndex
CREATE INDEX "workflow_runs_actorAccountId_idx" ON "public"."workflow_runs"("actorAccountId");

-- CreateIndex
CREATE INDEX "workflow_runs_status_idx" ON "public"."workflow_runs"("status");

-- CreateIndex
CREATE INDEX "workflow_runs_conclusion_idx" ON "public"."workflow_runs"("conclusion");

-- CreateIndex
CREATE INDEX "workflow_runs_source_idx" ON "public"."workflow_runs"("source");

-- CreateIndex
CREATE INDEX "workflow_runs_runStartedAt_idx" ON "public"."workflow_runs"("runStartedAt");

-- CreateIndex
CREATE INDEX "workflow_runs_runCompletedAt_idx" ON "public"."workflow_runs"("runCompletedAt");

-- CreateIndex
CREATE INDEX "workflow_runs_parentRunId_idx" ON "public"."workflow_runs"("parentRunId");

-- CreateIndex
CREATE INDEX "workflow_runs_workflowId_status_runStartedAt_idx" ON "public"."workflow_runs"("workflowId", "status", "runStartedAt");

-- CreateIndex
CREATE INDEX "workflow_runs_triggeredById_status_runStartedAt_idx" ON "public"."workflow_runs"("triggeredById", "status", "runStartedAt");

-- CreateIndex
CREATE INDEX "workflow_runs_status_conclusion_runStartedAt_idx" ON "public"."workflow_runs"("status", "conclusion", "runStartedAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_runs_workflowId_githubId_runAttempt_key" ON "public"."workflow_runs"("workflowId", "githubId", "runAttempt");

-- CreateIndex
CREATE INDEX "workflow_jobs_workflowRunId_idx" ON "public"."workflow_jobs"("workflowRunId");

-- CreateIndex
CREATE INDEX "workflow_jobs_status_idx" ON "public"."workflow_jobs"("status");

-- CreateIndex
CREATE INDEX "workflow_jobs_startedAt_idx" ON "public"."workflow_jobs"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_jobs_workflowRunId_githubId_key" ON "public"."workflow_jobs"("workflowRunId", "githubId");

-- CreateIndex
CREATE INDEX "workflow_steps_workflowJobId_idx" ON "public"."workflow_steps"("workflowJobId");

-- CreateIndex
CREATE INDEX "workflow_steps_status_idx" ON "public"."workflow_steps"("status");

-- CreateIndex
CREATE INDEX "branch_permissions_userId_idx" ON "public"."branch_permissions"("userId");

-- CreateIndex
CREATE INDEX "branch_permissions_repositoryId_idx" ON "public"."branch_permissions"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "branch_permissions_userId_repositoryId_branchName_key" ON "public"."branch_permissions"("userId", "repositoryId", "branchName");

-- CreateIndex
CREATE INDEX "sync_jobs_repositoryId_idx" ON "public"."sync_jobs"("repositoryId");

-- CreateIndex
CREATE INDEX "sync_jobs_status_idx" ON "public"."sync_jobs"("status");

-- CreateIndex
CREATE INDEX "sync_jobs_type_idx" ON "public"."sync_jobs"("type");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_githubEventId_key" ON "public"."webhook_events"("githubEventId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_githubDeliveryId_key" ON "public"."webhook_events"("githubDeliveryId");

-- CreateIndex
CREATE INDEX "webhook_events_githubEventId_idx" ON "public"."webhook_events"("githubEventId");

-- CreateIndex
CREATE INDEX "webhook_events_githubDeliveryId_idx" ON "public"."webhook_events"("githubDeliveryId");

-- CreateIndex
CREATE INDEX "webhook_events_processed_createdAt_idx" ON "public"."webhook_events"("processed", "createdAt");

-- CreateIndex
CREATE INDEX "webhook_events_repositoryId_idx" ON "public"."webhook_events"("repositoryId");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_action_idx" ON "public"."webhook_events"("eventType", "action");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "public"."notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "public"."notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_resourceType_resourceId_idx" ON "public"."notifications"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "public"."audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "workflow_approvals_workflowRunId_idx" ON "public"."workflow_approvals"("workflowRunId");

-- CreateIndex
CREATE INDEX "workflow_approvals_status_idx" ON "public"."workflow_approvals"("status");

-- CreateIndex
CREATE INDEX "workflow_approvals_requestedAt_idx" ON "public"."workflow_approvals"("requestedAt");

-- CreateIndex
CREATE INDEX "notification_logs_type_idx" ON "public"."notification_logs"("type");

-- CreateIndex
CREATE INDEX "notification_logs_recipient_idx" ON "public"."notification_logs"("recipient");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "public"."notification_logs"("status");

-- CreateIndex
CREATE INDEX "notification_logs_createdAt_idx" ON "public"."notification_logs"("createdAt");

-- CreateIndex
CREATE INDEX "rerun_history_parentRunId_idx" ON "public"."rerun_history"("parentRunId");

-- CreateIndex
CREATE INDEX "rerun_history_triggeredBy_idx" ON "public"."rerun_history"("triggeredBy");

-- CreateIndex
CREATE INDEX "rerun_history_createdAt_idx" ON "public"."rerun_history"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_snapshots_date_idx" ON "public"."analytics_snapshots"("date");

-- CreateIndex
CREATE INDEX "analytics_snapshots_repositoryId_idx" ON "public"."analytics_snapshots"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_date_repositoryId_key" ON "public"."analytics_snapshots"("date", "repositoryId");

-- AddForeignKey
ALTER TABLE "public"."provider_accounts" ADD CONSTRAINT "provider_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_accounts" ADD CONSTRAINT "provider_accounts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repositories" ADD CONSTRAINT "repositories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_tokens" ADD CONSTRAINT "repository_tokens_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_tokens" ADD CONSTRAINT "repository_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflows" ADD CONSTRAINT "workflows_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_branches" ADD CONSTRAINT "workflow_branches_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_runs" ADD CONSTRAINT "workflow_runs_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_runs" ADD CONSTRAINT "workflow_runs_actorAccountId_fkey" FOREIGN KEY ("actorAccountId") REFERENCES "public"."provider_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_runs" ADD CONSTRAINT "workflow_runs_parentRunId_fkey" FOREIGN KEY ("parentRunId") REFERENCES "public"."workflow_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_runs" ADD CONSTRAINT "workflow_runs_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_jobs" ADD CONSTRAINT "workflow_jobs_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "public"."workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_steps" ADD CONSTRAINT "workflow_steps_workflowJobId_fkey" FOREIGN KEY ("workflowJobId") REFERENCES "public"."workflow_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_permissions" ADD CONSTRAINT "branch_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_permissions" ADD CONSTRAINT "branch_permissions_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_jobs" ADD CONSTRAINT "sync_jobs_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_events" ADD CONSTRAINT "webhook_events_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_approvals" ADD CONSTRAINT "workflow_approvals_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "public"."workflow_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rerun_history" ADD CONSTRAINT "rerun_history_parentRunId_fkey" FOREIGN KEY ("parentRunId") REFERENCES "public"."workflow_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
