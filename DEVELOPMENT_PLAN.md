# Nexus Platform - Complete Development Plan & Architecture

## 🎯 **Executive Summary**

This document presents the complete architecture and development plan for the **Nexus Platform** - a comprehensive GitHub workflow management system that integrates with GitHub's native approval mechanisms, provides real-time notifications, implements advanced analytics, and offers enterprise-grade workflow orchestration.

## 🏗️ **Project Architecture & Key Components**

### **Core Technology Stack**
- **Framework**: Next.js 15 with App Router + React 19 + TypeScript
- **UI Library**: Mantine v8 (comprehensive component system)
- **Authentication**: NextAuth.js v5 with GitHub OAuth
- **Database**: PostgreSQL with Prisma ORM v6
- **Queue System**: BullMQ with Redis for background processing
- **State Management**: TanStack Query v5 for server state
- **Validation**: Zod v4 for runtime type validation
- **Styling**: PostCSS with Mantine preset + CSS Modules
- **Icons**: Tabler Icons React
- **Environment**: T3 Env for type-safe environment variables
- **Analytics**: Elasticsearch + Prometheus + Grafana
- **Notifications**: React Email + SendGrid + Server-Sent Events
- **GitHub Integration**: Octokit SDK with webhook processing

### **System Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Workflows │  │Approvals │  │Analytics │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     API Gateway Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │REST Endpoints│  │SSE Endpoints │  │Webhook Handler│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐  │
│  │Workflow   │  │Approval   │  │Notification│  │Analytics│ │
│  │Manager    │  │Tracker    │  │Service     │  │Engine   │ │
│  └───────────┘  └───────────┘  └───────────┘  └────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Queue Processing Layer                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BullMQ: webhook, notification, sync, cleanup, email │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Data Storage Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │PostgreSQL  │  │Redis Cache │  │Elasticsearch       │   │
│  │(Primary)   │  │(Session)   │  │(Logs & Analytics)  │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### **Critical Imports & References**
```typescript
// Core Types (Always import from generated Prisma types)
import type { User, Repository, Workflow, WorkflowRun, WorkflowApproval } from "@/prisma/generated/models";
import type { UserWhereInput, RepositoryWhereInput, WorkflowRunWhereInput } from "@/prisma/generated/models";

// Validation Schemas (Create for each domain)
import { UsersQuerySchema, UpdateUserSchema } from "@/lib/validations/user";
import { RepositorySchema, CreateRepositorySchema } from "@/lib/validations/repository";
import { WorkflowSchema, TriggerWorkflowSchema } from "@/lib/validations/workflow";
import { ApprovalSchema, NotificationSchema } from "@/lib/validations/approval";

// Core Services & Adapters
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { env } from "@/env";
import { GitHubClient } from "@/adapters/github/client/github-client";
import { WebhookProcessor } from "@/adapters/github/webhooks/processor";
import { NotificationService } from "@/lib/services/notification-service";

// Queue System
import { Queue } from "bullmq";
import { webhookQueue, notificationQueue, syncQueue } from "@/lib/queues";

// UI Components (Mantine pattern)
import { Button, Card, Group, Stack, Text, ThemeIcon, Badge } from "@mantine/core";
import { useDisclosure, useForm } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

// Icons (Consistent naming)
import { IconBrandGithub, IconGitBranch, IconUsers, IconCheck, IconX } from "@tabler/icons-react";

// Hooks (Custom patterns)
import { useUsers, useUpdateUserPermissions } from "@/hooks/use-users";
import { useRepositories, useCreateRepository } from "@/hooks/use-repositories";
import { useWorkflows, useTriggerWorkflow } from "@/hooks/use-workflows";
import { useApprovals, useApprovalStatus } from "@/hooks/use-approvals";

// Analytics & Monitoring
import { ElasticsearchClient } from "@/lib/elasticsearch";
import { PrometheusMetrics } from "@/lib/metrics";
import { Logger } from "@/lib/logger";
```

### **Coding Patterns & Architecture Decisions**

#### **1. File Organization Pattern**
```
app/
├── (auth)/                    # Route groups for auth pages
├── (dashboard)/               # Protected dashboard routes
├── api/                       # API routes with nested structure
│   ├── users/
│   │   ├── route.ts          # GET /api/users
│   │   └── [userId]/
│   │       └── permissions/
│   │           └── route.ts   # PUT /api/users/[userId]/permissions
components/
├── [domain]/                  # Domain-specific components
│   ├── filters/              # Filtering components
│   ├── stats/                # Statistics components
│   ├── table/                # Table components
│   └── [feature]-modal.tsx   # Modal components
lib/
├── validations/              # Zod schemas by domain
├── services/                 # Business logic services
├── auth.ts                   # NextAuth configuration
└── prisma.ts                 # Prisma client singleton
```

#### **2. Component Architecture Pattern**
- **Barrel Exports**: Use `index.tsx` files for clean imports
- **Compound Components**: Break complex components into smaller, focused pieces
- **Props Interface**: Always define TypeScript interfaces for props
- **Client Components**: Use `"use client"` directive for interactive components
- **Server Components**: Default to server components when possible

#### **3. API Route Pattern**
```typescript
// Standard API route structure
export async function GET(request: Request) {
    try {
        // 1. Authentication check
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse and validate query parameters
        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams.entries());
        const validationResult = QuerySchema.safeParse(params);
        
        if (!validationResult.success) {
            return NextResponse.json({
                error: "Invalid query parameters",
                details: validationResult.error.issues,
            }, { status: 400 });
        }

        // 3. Business logic with Prisma
        const result = await prisma.model.findMany({
            where: buildWhereClause(validationResult.data),
            // ... other options
        });

        // 4. Return structured response
        return NextResponse.json({ data: result, pagination: {...} });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
```

#### **4. Custom Hook Pattern**
```typescript
// Domain-specific hooks with TanStack Query
export function useUsers(params: UsersQuery) {
    return useQuery<UsersResponse>({
        queryKey: [QUERY_KEY, params],
        queryFn: async () => {
            const response = await fetch(`/api/users?${buildSearchParams(params)}`);
            if (!response.ok) throw new Error("Failed to fetch");
            return response.json();
        },
    });
}

export function useUpdateUser(userId: string) {
    const queryClient = useQueryClient();
    return useMutation<User, Error, UpdateUser>({
        mutationFn: async (data) => {
            const response = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to update");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}
```

#### **5. Validation Schema Pattern**
```typescript
// Always mirror Prisma enums in Zod
export const StatusEnum = z.enum(["ACTIVE", "INACTIVE", "LOCKED"]);

// Query schemas with coercion and defaults
export const QuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: StatusEnum.optional(),
});

// Response schemas for type safety
export const ResponseSchema = z.object({
    data: z.array(ItemSchema),
    pagination: PaginationSchema,
});

// Export types for use throughout app
export type Query = z.infer<typeof QuerySchema>;
export type Response = z.infer<typeof ResponseSchema>;
```

### **Study These Modules for Pattern Understanding**
1. **Users Module** (`app/(dashboard)/dashboard/users/`, `components/users/`, `hooks/use-users.ts`)
   - Complete CRUD operations
   - Table with filtering and pagination
   - Permission management system
   - Modal interactions

2. **Authentication System** (`lib/auth.ts`, `app/(auth)/`, `middleware.ts`)
   - NextAuth.js configuration
   - Route protection patterns
   - Session management

3. **API Structure** (`app/api/users/`)
   - RESTful API design
   - Validation and error handling
   - Prisma integration patterns

## 🎯 **Complete Development Roadmap**

### **✅ COMPLETED: Phase 1 - Repository Management System**
**Status**: ✅ **COMPLETE** - All components implemented and tested

#### **Completed Components**
- ✅ **Validation Schemas** (`lib/validations/repository.ts`)
- ✅ **API Endpoints** (Complete REST API for repositories)
- ✅ **TanStack Query Hooks** (`hooks/use-repositories.ts`)
- ✅ **UI Components** (Stats, Filters, Tables, Modals)
- ✅ **Dashboard Page** (`app/(dashboard)/dashboard/repositories/page.tsx`)

#### **Repository Management APIs** ✅
- ✅ `POST /api/repositories` - Add GitHub repositories
- ✅ `GET /api/repositories` - List user repositories with filtering
- ✅ `PUT /api/repositories/[id]` - Update repository settings
- ✅ `DELETE /api/repositories/[id]` - Remove repository
- ✅ `POST /api/repositories/[id]/sync` - Manual sync with GitHub
- ✅ `GET /api/repositories/stats` - Repository statistics

#### **Token Management APIs** ✅
- ✅ `POST /api/repositories/[id]/tokens` - Add GitHub tokens
- ✅ `GET /api/repositories/[id]/tokens` - List repository tokens
- ✅ Token validation and management system

---

### **🚀 NEXT: Phase 2 - GitHub Integration Layer with Octokit**
**Priority**: **HIGH** - Foundation for all GitHub operations

#### **GitHub Adapter Architecture** (`adapters/github/`)
```
adapters/github/
├── client/
│   ├── github-client.ts          # Octokit client factory
│   ├── rate-limiter.ts           # Rate limiting logic
│   └── token-manager.ts          # Token rotation & validation
├── services/
│   ├── repository-service.ts     # Repository operations
│   ├── workflow-service.ts       # Workflow operations
│   ├── webhook-service.ts        # Webhook management
│   └── sync-service.ts           # Data synchronization
├── webhooks/
│   ├── handlers/
│   │   ├── workflow-run.ts       # Workflow run events
│   │   ├── workflow-job.ts       # Job events
│   │   ├── repository.ts         # Repository events
│   │   └── index.ts              # Handler registry
│   ├── processor.ts              # Event processing
│   └── validator.ts              # Webhook validation
├── types/
│   ├── github-api.ts             # GitHub API types
│   ├── webhook-events.ts         # Webhook event types
│   └── sync-data.ts              # Sync operation types
└── utils/
    ├── crypto.ts                 # Encryption/decryption
    ├── logger.ts                 # GitHub-specific logging
    └── error-handler.ts          # Error handling
```

#### **Core Dependencies to Add**
```json
{
  "@octokit/rest": "^20.0.2",
  "@octokit/webhooks": "^12.0.10",
  "@octokit/auth-app": "^6.0.1",
  "@octokit/plugin-retry": "^6.0.1",
  "@octokit/plugin-throttling": "^8.1.3",
  "bullmq": "^4.15.0",
  "ioredis": "^5.3.2",
  "winston": "^3.11.0"
}
```

#### **GitHub API Endpoints Integration**
- **Repository Operations**: Fetch repo details, workflows, permissions
- **Workflow Operations**: List, trigger, cancel, re-run workflows
- **Webhook Management**: Setup, validate, process GitHub events
- **Authentication**: Token validation, user permissions, rate limiting

---

### **Phase 3 - Workflow Management & Approval System**
**Priority**: **HIGH** - Core business logic

#### **Workflow Management APIs**
- `GET /api/workflows` - List workflows across repositories
- `POST /api/workflows/[id]/trigger` - Trigger workflow runs with approval detection
- `GET /api/workflows/[id]/runs` - List workflow run history
- `PUT /api/workflows/[id]` - Update workflow settings

#### **Workflow Run APIs**
- `GET /api/workflow-runs` - List runs with advanced filtering
- `GET /api/workflow-runs/[id]` - Get detailed run information
- `POST /api/workflow-runs/[id]/rerun` - Re-run failed workflows
- `POST /api/workflow-runs/[id]/cancel` - Cancel running workflows

#### **GitHub Native Approval Integration**
- **Environment Protection Rules** - Production, staging, custom environments
- **Deployment Protection Rules** - GitHub Apps, required reviewers, time windows
- **Approval Detection** - Parse webhook payloads for approver information
- **Status Tracking** - DISPATCHED → WAITING_APPROVAL → APPROVED/REJECTED → COMPLETED

---

### **Phase 4 - Notification & Real-time System**
**Priority**: **HIGH** - User experience and real-time updates

#### **Notification Architecture**
- **React Email Templates** - Professional email notifications
- **SendGrid Integration** - Reliable email delivery
- **Server-Sent Events (SSE)** - Real-time browser updates
- **BullMQ Queues** - Background notification processing

#### **Notification Categories**
| Category | Priority | Channels | Recipients | Example |
|----------|----------|----------|------------|---------|
| Approval Required | P1 | Email + SSE | Approvers | "Your approval needed for production deployment" |
| Approval Status | P2 | SSE | Requester | "Your workflow was approved/rejected" |
| Workflow Failed | P2 | Email + SSE | Trigger User | "Workflow failed in job X" |
| Re-run Available | P3 | SSE | Trigger User | "Failed jobs can be re-run" |
| System Alert | P1 | Email + SSE | Admins | "GitHub webhook processing failed" |
| Token Expiry | P1 | Email + SSE | Token Owner | "Token expires in 7 days" |

#### **SSE Channel Architecture**
```
/sse
  /user/{userId}     - Personal notifications, workflow updates, approval requests
  /repo/{repoId}     - Repository-wide updates, sync progress, workflow statuses
  /broadcast         - System announcements, maintenance windows
```

---

### **Phase 5 - Analytics & Monitoring System**
**Priority**: **MEDIUM** - Business intelligence and system health

#### **Analytics Stack**
- **Elasticsearch** - Store webhooks, logs, metrics for search and analysis
- **Prometheus** - Metrics collection with prom-client
- **Grafana** - Visualization dashboards
- **Winston** - Structured application logging

#### **Key Metrics Collection**
```yaml
workflow_metrics:
  counters:
    - workflows_triggered_total
    - workflows_completed_total
    - workflows_failed_total
    - approvals_requested_total
    - approvals_granted_total
    - approvals_rejected_total

  histograms:
    - workflow_duration_seconds
    - approval_response_time_seconds
    - queue_processing_time_seconds

  gauges:
    - active_workflows
    - pending_approvals
    - queue_depth
    - token_expiry_days
```

#### **Dashboard Types**
- **Executive Dashboard** - High-level metrics, success rates, trends
- **Operations Dashboard** - Active workflows, pending approvals, queue depths
- **Analytics Dashboard** - Custom queries, data exploration, exports

---

### **Phase 6 - Advanced Workflow Features**
**Priority**: **MEDIUM** - Enhanced workflow capabilities

#### **Re-run Management System**
- **Complete Re-run** - Re-run entire workflow
- **Failed Jobs Re-run** - Re-run only failed jobs
- **Single Job Re-run** - Re-run specific job
- **Re-run History** - Track all re-run attempts with linking

#### **Workflow Templates & Management**
- **Template System** - Pre-configured workflow templates
- **Template Marketplace** - Share templates between teams
- **Version Control** - Template versioning and rollback
- **Custom Inputs** - Dynamic workflow input forms

---

### **Phase 7 - Enterprise Features**
**Priority**: **LOW** - Advanced enterprise capabilities

#### **Advanced Security & Compliance**
- **Comprehensive Audit Logging** - All actions tracked and searchable
- **Role-based Access Control** - Granular permissions system
- **Security Scanning Integration** - Automated security checks
- **Compliance Reporting** - GDPR, SOX, HIPAA compliance reports

#### **Advanced Integrations**
- **Slack/Teams Integration** - Notifications and approvals in chat
- **JIRA/ServiceNow Integration** - Ticket creation and tracking
- **Custom Webhook Endpoints** - External system integrations
- **GraphQL API** - Advanced API access patterns

## 🗄️ **Database Schema Updates Required**

### **New Prisma Models for Approval System**

#### **WorkflowApproval Model**
```prisma
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  TIMED_OUT
}

model WorkflowApproval {
  id                String   @id @default(cuid())
  workflowRunId     String
  githubRunId       BigInt
  environment       String?

  // Approval state
  status            ApprovalStatus
  requestedAt       DateTime
  respondedAt       DateTime?

  // Approvers from GitHub
  approvers         Json?    // Array of approver objects from webhook
  approverDetails   String?  // Parsed approver names/emails

  // Response tracking
  approvedBy        String?
  rejectedBy        String?
  comment           String?

  // GitHub URLs
  htmlUrl           String
  environmentUrl    String?

  // Notifications sent
  notificationsSent Json?    // Track which notifications were sent

  workflowRun       WorkflowRun @relation(fields: [workflowRunId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workflowRunId])
  @@index([status])
  @@map("workflow_approvals")
}
```

#### **NotificationLog Model**
```prisma
model NotificationLog {
  id              String   @id @default(cuid())
  type            String   // APPROVAL_REQUEST, STATUS_UPDATE, etc.
  channel         String   // EMAIL, SSE
  recipient       String   // Email or userId

  // Content
  subject         String?
  content         Json     // Full notification content

  // Delivery status
  status          String   // PENDING, SENT, DELIVERED, FAILED
  sentAt          DateTime?
  deliveredAt     DateTime?
  failureReason   String?

  // Related entities
  workflowRunId   String?
  approvalId      String?

  metadata        Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([type])
  @@index([recipient])
  @@index([status])
  @@map("notification_logs")
}
```

#### **ReRunHistory Model**
```prisma
model ReRunHistory {
  id              String   @id @default(cuid())
  parentRunId     String
  newRunId        String?

  reRunType       String   // COMPLETE, FAILED_JOBS, SPECIFIC_JOB
  triggeredBy     String
  reason          String?

  // GitHub API response
  githubResponse  Json?

  status          String   // INITIATED, SUCCESS, FAILED
  error           String?

  createdAt       DateTime @default(now())

  parentRun       WorkflowRun @relation("ParentRun", fields: [parentRunId], references: [id])

  @@index([parentRunId])
  @@index([triggeredBy])
  @@map("rerun_history")
}
```

#### **AnalyticsSnapshot Model**
```prisma
model AnalyticsSnapshot {
  id              String   @id @default(cuid())
  date            DateTime
  repositoryId    String?

  // Aggregated metrics
  metrics         Json     // Contains all calculated metrics

  // Time-based aggregations
  hourlyData      Json?
  dailyData       Json?

  createdAt       DateTime @default(now())

  @@unique([date, repositoryId])
  @@index([date])
  @@index([repositoryId])
  @@map("analytics_snapshots")
}
```

### **Updates to Existing Models**

#### **WorkflowRun Model Updates**
```prisma
// Add to existing WorkflowRun model:
approvals       WorkflowApproval[]
reRunHistory    ReRunHistory[] @relation("ParentRun")

// Add new fields:
source          WorkflowRunSource @default(PLATFORM)
environment     String?           // Environment name for approvals
approvalRequired Boolean          @default(false)
```

## 🔧 **Development Guidelines & Standards**

### **Code Quality Standards**
- **TypeScript Strict Mode** - Always use strict TypeScript configuration
- **Error Handling** - Comprehensive error handling in all API routes
- **Input Validation** - Use Zod for all input/output validation
- **Component Patterns** - Follow established Mantine component patterns
- **Documentation** - Write comprehensive JSDoc comments
- **Naming Conventions** - Consistent kebab-case files, PascalCase components

### **Testing Strategy**
- **Unit Tests** - All utility functions and business logic
- **Integration Tests** - API endpoints with database interactions
- **Component Tests** - UI components with user interactions
- **E2E Tests** - Critical user flows (workflow trigger → approval → completion)
- **Webhook Tests** - Mock GitHub webhook payloads and processing

### **Performance Considerations**
- **Database Indexing** - Proper indexes for all query patterns
- **Query Optimization** - Use Prisma's relationJoins for efficient queries
- **Caching Strategy** - TanStack Query + Redis for optimal performance
- **Bundle Optimization** - Tree shaking and code splitting
- **Pagination** - Implement cursor-based pagination for large datasets

### **Security Best Practices**
- **Input Validation** - Server-side validation for all inputs
- **Authentication** - Proper session management and token validation
- **Authorization** - Role-based access control for all operations
- **Secrets Management** - Environment variables for all sensitive data
- **Webhook Security** - HMAC signature validation for GitHub webhooks
- **Token Encryption** - Encrypt all GitHub tokens at rest

## 📅 **Implementation Timeline & Milestones**

### **Phase 2: GitHub Integration (Current Priority)**
**Timeline**: 2-3 weeks
**Branch**: `feature/github-integration`

**Week 1: Core Infrastructure**
- [ ] Install Octokit dependencies and setup
- [ ] Create GitHub client factory with rate limiting
- [ ] Implement token management system
- [ ] Set up BullMQ with Redis for queue processing
- [ ] Create webhook endpoint with signature validation

**Week 2: GitHub Services**
- [ ] Build repository synchronization service
- [ ] Implement workflow discovery and caching
- [ ] Create webhook event processors
- [ ] Add workflow triggering capabilities
- [ ] Implement error handling and retry logic

**Week 3: Integration & Testing**
- [ ] Replace placeholder sync logic in existing APIs
- [ ] Add comprehensive logging system
- [ ] Write integration tests for GitHub API
- [ ] Test webhook processing with real GitHub events
- [ ] Performance optimization and monitoring

### **Phase 3: Approval System (Next)**
**Timeline**: 2 weeks
**Branch**: `feature/approval-system`

**Deliverables**:
- [ ] Approval detection in webhook processor
- [ ] Approver parsing and notification logic
- [ ] Approval tracking UI components
- [ ] GitHub native approval integration
- [ ] Approval timeout handling

### **Phase 4: Notifications (Following)**
**Timeline**: 2 weeks
**Branch**: `feature/notifications`

**Deliverables**:
- [ ] React Email templates
- [ ] SendGrid email integration
- [ ] Server-Sent Events implementation
- [ ] Real-time notification center
- [ ] Notification preferences system

## 🎯 **Success Criteria & Acceptance Tests**

### **Phase 2 Completion Criteria**
- [ ] Repository sync works with real GitHub repositories
- [ ] Workflows can be triggered via platform with GitHub API
- [ ] Webhooks are received and processed correctly
- [ ] Token validation and rotation works
- [ ] Rate limiting prevents API quota exhaustion
- [ ] All existing repository management features still work
- [ ] Comprehensive error handling for GitHub API failures

### **System Health Indicators**
- [ ] GitHub API response time < 2 seconds (p95)
- [ ] Webhook processing time < 5 seconds (p95)
- [ ] Queue processing lag < 30 seconds
- [ ] Token validation success rate > 99%
- [ ] Zero data loss during sync operations

## 🔍 **Monitoring & Observability**

### **Key Metrics to Track**
```yaml
github_integration_metrics:
  api_calls:
    - github_api_requests_total (by endpoint, status)
    - github_api_response_time_seconds
    - github_api_rate_limit_remaining

  webhooks:
    - webhook_events_received_total (by event type)
    - webhook_processing_time_seconds
    - webhook_processing_errors_total

  sync_operations:
    - repository_sync_duration_seconds
    - workflow_sync_success_rate
    - sync_queue_depth

  business_metrics:
    - workflows_triggered_total
    - approvals_pending_count
    - notification_delivery_rate
```

### **Logging Strategy**
```typescript
// Structured logging format
{
  level: "info" | "warn" | "error" | "debug",
  category: "github-api" | "webhook" | "sync" | "auth",
  operation: "fetch-workflows" | "process-webhook" | "sync-repository",
  repositoryId: string,
  githubId?: number,
  duration?: number,
  error?: Error,
  metadata?: Record<string, any>
}
```

## 📚 **Reference Documentation & Resources**

### **Technical Documentation**
- **Next.js 15**: App Router patterns and best practices
- **Mantine v8**: Component library documentation and patterns
- **Prisma**: Database modeling and query optimization
- **TanStack Query**: Server state management patterns
- **NextAuth.js v5**: Authentication configuration
- **Octokit**: GitHub API SDK documentation
- **BullMQ**: Queue processing and job management
- **GitHub API**: Webhook events and API endpoints

### **Architecture References**
- **CLAUDE.md**: Coding patterns and style guide
- **FINAL_PLAN.md**: Complete system architecture
- **DEVELOPMENT_PLAN.md**: This comprehensive development guide

### **Study Modules for Pattern Understanding**
1. **Users Module** (`app/(dashboard)/dashboard/users/`, `components/users/`, `hooks/use-users.ts`)
   - Complete CRUD operations with validation
   - Table with filtering and pagination
   - Permission management system
   - Modal interactions and form handling

2. **Repository Module** (`app/(dashboard)/dashboard/repositories/`, `components/repositories/`, `hooks/use-repositories.ts`)
   - GitHub integration patterns
   - Statistics dashboard
   - Advanced filtering and search
   - Real-time status updates

3. **Authentication System** (`lib/auth.ts`, `app/(auth)/`, `middleware.ts`)
   - NextAuth.js configuration patterns
   - Route protection and middleware
   - Session management

## 🎯 **Next Immediate Actions**

### **Ready to Start Phase 2**
1. **Install Dependencies**: Add Octokit and BullMQ packages
2. **Create Adapter Structure**: Set up the `adapters/github/` folder structure
3. **GitHub Client Setup**: Implement the core GitHub client with authentication
4. **Webhook Endpoint**: Create the webhook processing endpoint
5. **Queue System**: Set up BullMQ for background processing

### **Current Status Summary**
- ✅ **Phase 1 Complete**: Repository Management System fully implemented
- 🚀 **Phase 2 Ready**: GitHub Integration Layer planned and ready to implement
- 📋 **Roadmap Defined**: Complete 7-phase development plan established
- 🏗️ **Architecture Solid**: Clean, scalable architecture with proper separation of concerns

---

**This comprehensive plan serves as your complete development guide. Reference it in every session to maintain consistency, follow established patterns, and ensure we're building toward the complete vision of the Nexus Platform.**
