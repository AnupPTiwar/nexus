-- CreateEnum
CREATE TYPE "public"."ResourceAction" AS ENUM ('CREATE', 'DELETE', 'MANAGE', 'READ', 'UPDATE');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('REPOSITORY', 'WORKFLOW', 'WORKFLOW_RUN', 'WORKFLOW_GROUP', 'TOKEN', 'USER', 'AUDIT', 'SCHEDULER', 'WORKFLOW_TEMPLATE', 'NOTIFICATION', 'USER_PREFERENCES');

-- CreateEnum
CREATE TYPE "public"."WorkflowRunStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "public"."WorkflowRunConclusion" AS ENUM ('SUCCESS', 'FAILURE', 'CANCELLED', 'SKIPPED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "public"."WorkflowJobStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'WAITING');

-- CreateEnum
CREATE TYPE "public"."WorkflowJobConclusion" AS ENUM ('SUCCESS', 'FAILURE', 'CANCELLED', 'SKIPPED', 'TIMED_OUT', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "public"."WorkflowStepStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."WorkflowStepConclusion" AS ENUM ('SUCCESS', 'FAILURE', 'CANCELLED', 'SKIPPED', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'TRIGGER_WORKFLOW', 'SYNC_REPOSITORY', 'LOCK_USER', 'UNLOCK_USER');

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."WorkflowState" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('GITHUB', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."SchedulerStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repositories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "githubOwner" TEXT NOT NULL,
    "githubUrl" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "public"."Visibility" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSyncing" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "webhookSecret" TEXT,
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
    "githubUserId" BIGINT,
    "githubLogin" TEXT,
    "githubEmail" TEXT,
    "githubName" TEXT,
    "avatarUrl" TEXT,
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
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "state" "public"."WorkflowState" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "inputs" JSONB NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_runs" (
    "id" TEXT NOT NULL,
    "githubId" BIGINT NOT NULL,
    "runNumber" INTEGER NOT NULL,
    "runAttempt" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."WorkflowRunStatus" NOT NULL,
    "conclusion" "public"."WorkflowRunConclusion",
    "triggerBranch" TEXT NOT NULL,
    "headSha" TEXT NOT NULL,
    "runnerId" INTEGER,
    "runnerName" TEXT,
    "inputs" JSONB,
    "runStartedAt" TIMESTAMP(3),
    "runCompletedAt" TIMESTAMP(3),
    "actorId" BIGINT,
    "actorLogin" TEXT,
    "parentRunId" TEXT,
    "workflowId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_jobs" (
    "id" TEXT NOT NULL,
    "githubId" BIGINT,
    "name" TEXT NOT NULL,
    "status" "public"."WorkflowJobStatus" NOT NULL,
    "conclusion" "public"."WorkflowJobConclusion",
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "runnerName" TEXT,
    "runnerGroupName" TEXT,
    "githubUrl" TEXT,
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
CREATE UNIQUE INDEX "repositories_githubUrl_key" ON "public"."repositories"("githubUrl");

-- CreateIndex
CREATE INDEX "repositories_userId_idx" ON "public"."repositories"("userId");

-- CreateIndex
CREATE INDEX "repository_tokens_repositoryId_idx" ON "public"."repository_tokens"("repositoryId");

-- CreateIndex
CREATE INDEX "repository_tokens_userId_idx" ON "public"."repository_tokens"("userId");

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
CREATE INDEX "workflow_runs_workflowId_idx" ON "public"."workflow_runs"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_runs_userId_idx" ON "public"."workflow_runs"("userId");

-- CreateIndex
CREATE INDEX "workflow_runs_status_idx" ON "public"."workflow_runs"("status");

-- CreateIndex
CREATE INDEX "workflow_runs_conclusion_idx" ON "public"."workflow_runs"("conclusion");

-- CreateIndex
CREATE INDEX "workflow_runs_runStartedAt_idx" ON "public"."workflow_runs"("runStartedAt");

-- CreateIndex
CREATE INDEX "workflow_runs_runCompletedAt_idx" ON "public"."workflow_runs"("runCompletedAt");

-- CreateIndex
CREATE INDEX "workflow_runs_parentRunId_idx" ON "public"."workflow_runs"("parentRunId");

-- CreateIndex
CREATE INDEX "workflow_runs_workflowId_status_runStartedAt_idx" ON "public"."workflow_runs"("workflowId", "status", "runStartedAt");

-- CreateIndex
CREATE INDEX "workflow_runs_userId_status_runStartedAt_idx" ON "public"."workflow_runs"("userId", "status", "runStartedAt");

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
CREATE INDEX "workflow_steps_workflowJobId_idx" ON "public"."workflow_steps"("workflowJobId");

-- CreateIndex
CREATE INDEX "workflow_steps_status_idx" ON "public"."workflow_steps"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "public"."notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "public"."notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_resourceType_resourceId_idx" ON "public"."notifications"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- AddForeignKey
ALTER TABLE "public"."repositories" ADD CONSTRAINT "repositories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_tokens" ADD CONSTRAINT "repository_tokens_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repository_tokens" ADD CONSTRAINT "repository_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflows" ADD CONSTRAINT "workflows_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_runs" ADD CONSTRAINT "workflow_runs_parentRunId_fkey" FOREIGN KEY ("parentRunId") REFERENCES "public"."workflow_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_runs" ADD CONSTRAINT "workflow_runs_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_runs" ADD CONSTRAINT "workflow_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_jobs" ADD CONSTRAINT "workflow_jobs_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "public"."workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_steps" ADD CONSTRAINT "workflow_steps_workflowJobId_fkey" FOREIGN KEY ("workflowJobId") REFERENCES "public"."workflow_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
