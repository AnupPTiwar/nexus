# 🧠 Nexus Platform - Complete Architecture & Implementation Guide

## 📋 Project Overview & System Purpose

**Nexus Platform** is a sophisticated GitHub workflow management system that integrates with GitHub's native approval mechanisms, provides real-time notifications, implements advanced analytics, and offers enterprise-grade workflow orchestration for internal teams.

### 🎯 Core System Capabilities

#### **Primary Functions**
- **GitHub Workflow Management**: Trigger, monitor, and manage GitHub Actions workflows with approval integration
- **Native Approval System**: Seamless integration with GitHub's environment protection rules and deployment approvals
- **Real-time Notifications**: Email and Server-Sent Events (SSE) for approval requests and status updates
- **Advanced Analytics**: Comprehensive workflow metrics, performance tracking, and business intelligence
- **Enterprise Security**: Role-based permissions, audit trails, and secure token management
- **Repository Management**: Complete GitHub repository integration with token management

#### **System Design Philosophy**
1. **Keep It Simple & Straightforward**: Avoid over-engineering, prioritize clarity and maintainability
2. **Event-Driven Architecture**: React to GitHub webhooks for all state changes
3. **GitHub as Source of Truth**: Eventually consistent design accepting GitHub's authority
4. **User-Centric Experience**: Clear feedback, intuitive interfaces, professional design
5. **Enterprise-Grade Security**: Secure token storage, proper authentication, comprehensive auditing
6. **Scalable from Day One**: Queue-based processing, horizontal scaling, performance optimization

### 🏗️ Complete Technology Stack

#### **Core Framework & Libraries**
- **Framework**: Next.js 15.5.0 with App Router + React 19 + TypeScript (strict mode)
- **UI Library**: Mantine v8.2.7 (comprehensive enterprise component system)
- **Authentication**: NextAuth.js v5 with GitHub OAuth (access_token for API calls)
- **Database**: PostgreSQL with Prisma ORM v6 (relationJoins, fullTextSearchPostgres)
- **Queue System**: BullMQ v5.58.0 with Redis for background processing
- **State Management**: TanStack Query v5.85.5 for server state management
- **Validation**: Zod v4.1.0 for runtime type validation and API schemas
- **Styling**: PostCSS with Mantine preset (NO custom CSS, Mantine components only)
- **Icons**: Tabler Icons React v3.34.1 for consistent iconography

#### **GitHub Integration Stack**
- **GitHub API**: Octokit/rest v22.0.0 for GitHub API integration
- **GitHub Token Management**: Secure storage with fine-grained permissions
- **Webhook Processing**: Signature validation, event processing, retry logic
- **Approval Detection**: Parse GitHub webhook payloads for approver information
- **Workflow Triggering**: workflow_dispatch API with proper scoping

#### **Analytics & Monitoring Stack** (Planned)
- **Metrics Collection**: Prometheus-compatible metrics with prom-client
- **Log Storage**: Elasticsearch for searchable logs and analytics
- **Time-series Data**: Redis for real-time metrics and caching
- **Structured Logging**: Winston for application logging with context
- **Statistical Analysis**: Simple-statistics for percentiles and aggregations

#### **Notification & Real-time Stack** (Planned)
- **Email Templates**: React Email for professional email notifications
- **Email Delivery**: SendGrid integration for reliable email delivery
- **Real-time Updates**: Server-Sent Events (SSE) for browser notifications
- **Background Processing**: BullMQ queues for notification delivery

## 🏛️ System Architecture Overview

### **Complete System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend Layer (React/Mantine)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Workflows │  │Approvals │  │Analytics │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ (SSE + TanStack Query)
┌─────────────────────────▼───────────────────────────────────┐
│                   API Gateway Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │REST Endpoints│  │SSE Endpoints │  │Webhook Handler│     │
│  │(Next.js API) │  │(EventSource) │  │(Validation)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                 Business Logic Layer                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐  │
│  │Workflow   │  │Approval   │  │Notification│  │Analytics│ │
│  │Manager    │  │Tracker    │  │Service     │  │Engine   │ │
│  │(Octokit)  │  │(GitHub)   │  │(Email/SSE) │  │(Metrics)│ │
│  └───────────┘  └───────────┘  └───────────┘  └────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                Queue Processing Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ BullMQ: webhook, notification, sync, cleanup, email  │  │
│  │ Redis: Session storage, queue management, caching    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Data Storage Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │PostgreSQL  │  │Redis Cache │  │Elasticsearch       │   │
│  │(Prisma)    │  │(Sessions)  │  │(Logs & Analytics)  │   │
│  │Primary Data│  │Real-time   │  │Search & Metrics    │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### **GitHub Integration Flow**

```
GitHub Event → Webhook → Validation → Queue → Process → Notify Users
     ↓              ↓           ↓         ↓        ↓         ↓
Push/PR → /api/webhooks/github → HMAC → BullMQ → Update DB → SSE/Email
```

### **Critical GitHub Token Strategy**

Based on GitHub's 2025 best practices:

#### **Authentication Hierarchy** (Use in this order)
1. **GITHUB_TOKEN** (when possible) - Built-in, secure, automatic
2. **GitHub App Installation Token** - Fine-grained, repository-scoped 
3. **Fine-grained Personal Access Token** - Specific repository permissions
4. **Personal Access Token (classic)** - Broad scope, last resort

#### **Token Storage & Security**
```typescript
// Required scopes for workflow triggering
const REQUIRED_SCOPES = [
  'repo',           // Repository access
  'workflow',       // Workflow read/write
  'actions:read',   // Actions read access
  'actions:write'   // Actions write access (for triggering)
];

// Token validation pattern
const validateToken = async (token: string) => {
  const octokit = new Octokit({ auth: token });
  const { data: user } = await octokit.rest.users.getAuthenticated();
  const { data: scopes } = await octokit.rest.apps.checkToken({ 
    token: token 
  });
  return { user, scopes };
};
```

## 🗂️ Current System Status & Implementation Progress

### ✅ **COMPLETED: Phase 1 - Foundation & Repository Management**
**Status**: 🟢 **FULLY IMPLEMENTED** - All core components operational

#### **Completed Infrastructure**
- ✅ **Authentication System**: NextAuth.js v5 with GitHub OAuth + GitHub token storage for workflow triggering
- ✅ **Database Schema**: Complete Prisma schema with all models (827 lines)
- ✅ **User Management**: Full CRUD with permissions, stats, filtering, tables
- ✅ **Repository Management**: Complete repository CRUD with token management
- ✅ **API Layer**: RESTful APIs with Zod validation and error handling
- ✅ **UI Components**: Mantine-based professional components with loading states
- ✅ **State Management**: TanStack Query implementation with proper caching

#### **Completed Features**
```yaml
Authentication:
  - GitHub OAuth login/logout with repo and workflow scopes
  - Encrypted GitHub access token storage in User model
  - Session management with NextAuth extended with user permissions
  - Route protection middleware
  - User profile management with default read permissions
  - Server-side only GitHub token access for workflow triggering

Repository Management:
  - Add GitHub repositories
  - Repository statistics dashboard  
  - Token management system
  - Repository sync functionality
  - Filtering and search capabilities

User Management:
  - User permissions system
  - User statistics tracking
  - Advanced filtering and search
  - Modal interactions

API Infrastructure:
  - /api/auth/[...nextauth] - Authentication
  - /api/users - User management
  - /api/users/[userId]/permissions - Permissions
  - /api/repositories - Repository CRUD
  - /api/repositories/[id] - Individual repo ops
  - /api/repositories/[id]/tokens - Token management
  - /api/repositories/[id]/sync - Sync operations
  - /api/repositories/stats - Statistics
```

#### **Current Database Schema Status**
```yaml
Implemented Models (18 models):
  ✅ User - Complete with permissions, preferences, and encrypted GitHub token storage
  ✅ Provider - OAuth provider management
  ✅ ProviderAccount - GitHub account linking  
  ✅ Repository - GitHub repository integration
  ✅ RepositoryToken - Secure token storage
  ✅ Workflow - Workflow definition and inputs
  ✅ WorkflowBranch - Branch-specific inputs
  ✅ WorkflowRun - Execution tracking with approval fields
  ✅ WorkflowJob - Job-level tracking
  ✅ WorkflowStep - Step-level granularity
  ✅ WorkflowApproval - GitHub native approval tracking
  ✅ BranchPermission - Granular branch access
  ✅ SyncJob - Background sync operations
  ✅ WebhookEvent - Webhook payload storage
  ✅ Notification - User notification system
  ✅ NotificationLog - Email/SSE delivery tracking
  ✅ ReRunHistory - Workflow re-run tracking
  ✅ AnalyticsSnapshot - Time-series analytics
  ✅ AuditLog - Complete audit trail
```

### 🚧 **NEXT PRIORITY: Phase 2 - GitHub Integration Layer**
**Status**: 🔶 **READY TO IMPLEMENT** - Dependencies installed, schema ready

#### **Implementation Roadmap**
```yaml
Week 1: Core GitHub Integration
  - GitHub client factory with rate limiting
  - Token management and validation service
  - Webhook endpoint with signature validation
  - Basic workflow discovery and caching

Week 2: Workflow Operations  
  - Workflow triggering via API
  - Webhook event processing
  - Status tracking and updates
  - Error handling and retry logic

Week 3: Approval System Foundation
  - Approval detection in webhooks
  - Approver parsing and notification logic
  - Integration with existing UI components
  - Testing with real GitHub repositories
```

### 📋 **PENDING: Phases 3-7 - Advanced Features**
```yaml
Phase 3: Notification & Real-time System (2 weeks)
  - React Email templates
  - SendGrid integration
  - Server-Sent Events implementation
  - Real-time notification center

Phase 4: Analytics & Monitoring (2 weeks)
  - Elasticsearch setup and indexing
  - Prometheus metrics collection
  - Analytics dashboard implementation
  - Performance monitoring

Phase 5: Advanced Workflow Features (1 week)
  - Re-run management system
  - Workflow templates
  - Bulk operations

Phase 6: Enterprise Features (2 weeks)
  - Advanced security and compliance
  - External integrations (Slack, JIRA)
  - Custom reporting

Phase 7: Polish & Optimization (1 week)
  - Performance optimization
  - Edge case handling
  - Production deployment
```

## 🎨 Coding Patterns & Style Guide

### ✅ DO's - Mandatory Practices

#### 1. **Component Architecture**
```typescript
// Section-wise component organization
components/
  users/
    stats/
      stats-card.tsx       // Individual component
      stats-container.tsx  // Container component
      index.tsx           // Clean exports
    filters/
      filters.tsx
    table/
      table-head.tsx
      table-row.tsx
      table-container.tsx
      index.tsx
```

#### 2. **File Structure & Naming**
- Use kebab-case for files: `user-table.tsx`, `permissions-modal.tsx`
- Use PascalCase for components: `UserTable`, `PermissionsModal`
- Organize by feature/domain, not by type
- Always include `index.tsx` for clean exports

#### 3. **Component Patterns**
```typescript
"use client"; // Always at top for client components

import { Group, Stack, Text } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/validations/user";

interface ComponentProps {
    user: User;
    onAction: (user: User) => void;
}

export function ComponentName({ user, onAction }: ComponentProps) {
    // Hooks first
    const { data, isLoading } = useQuery({...});
    
    // Event handlers
    const handleClick = useCallback((user: User) => {
        onAction(user);
    }, [onAction]);
    
    // Early returns for loading/error states
    if (isLoading) return <LoadingSkeleton />;
    
    // Main render
    return (
        <Stack gap="md">
            {/* Content */}
        </Stack>
    );
}
```

#### 4. **API Development**
```typescript
// Always use Zod validation
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserSchema } from "@/lib/validations/user";

export async function GET(request: Request) {
    // 1. Authentication check
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Input validation with Zod
    const validation = Schema.safeParse(data);
    if (!validation.success) {
        return NextResponse.json(
            { error: "Invalid data", details: validation.error.issues },
            { status: 400 }
        );
    }
    
    // 3. Database operations
    // 4. Return response
}
```

#### 5. **TanStack Query Patterns**
```typescript
// hooks/use-feature.ts
export function useUsers(params: UsersQuery) {
    return useQuery<UsersResponse>({
        queryKey: ["users", params],
        queryFn: async () => {
            const response = await fetch(`/api/users?${searchParams}`);
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
                body: JSON.stringify(data),
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}
```

### ❌ DON'Ts - Avoid These

1. **NO Custom CSS**: Only use Mantine components and props
2. **NO Hardcoded Colors**: Let Mantine handle theming
3. **NO `any` Types**: Always use proper TypeScript types
4. **NO Inline Styles**: Use Mantine's style props instead
5. **NO Direct DOM Manipulation**: Use React patterns
6. **NO Unused Imports**: Keep imports clean
7. **NO Console.logs**: Use proper error handling
8. **NO Magic Numbers**: Use named constants

### 🎯 Mantine Usage Patterns

#### Enterprise-Grade Components
```typescript
// Professional card layouts
<Paper p="lg" radius="md" withBorder>
    <Stack gap="md">
        <Group justify="space-between">
            <Text fw={600}>Title</Text>
            <ThemeIcon size="sm" variant="light" color="blue">
                <IconUser size={16} />
            </ThemeIcon>
        </Group>
    </Stack>
</Paper>

// Loading states with skeletons
{isLoading ? (
    <Skeleton height={32} width="60%" />
) : (
    <Text size="xl" fw={700}>{value}</Text>
)}
```

#### Color Usage
- Use Mantine's semantic colors: `blue`, `green`, `red`, `orange`, `cyan`, `grape`
- Always use `variant="light"` for subtle backgrounds
- Let theme handle dark/light mode automatically

## 🗂️ Project Structure

```
nexus/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Custom login page
│   │   └── layout.tsx            # Auth layout (centered)
│   ├── (dashboard)/              # Dashboard route group  
│   │   ├── dashboard/            # Main dashboard
│   │   │   ├── users/page.tsx    # Users management
│   │   │   ├── repositories/     # Repo management
│   │   │   ├── workflows/        # Workflow management
│   │   │   └── workflow-runs/    # Execution history
│   │   └── layout.tsx            # Dashboard layout (AppShell)
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth config
│   │   └── users/                # Users API
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable components
│   ├── auth-loader.tsx           # Loading component
│   ├── page-header.tsx           # Page header component
│   └── users/                    # Users section components
├── hooks/                        # TanStack Query hooks
├── lib/                          # Utilities & config
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   └── validations/              # Zod schemas
├── providers/                    # React providers
├── prisma/                       # Database schema & migrations
└── CLAUDE.md                     # This memory file
```

## 🗃️ Key Files & Their Purpose

### 🔐 Authentication
- `lib/auth.ts`: NextAuth configuration with GitHub OAuth + token storage (✅ **UPDATED**)
- `types/next-auth.d.ts`: Extended session types with permissions (✅ **NEW**)
- `middleware.ts`: Route protection
- `app/(auth)/`: Authentication routes and layouts

#### **GitHub Token Integration Details**
- **Storage**: Encrypted GitHub access_token in User.githubAccessToken field
- **Scopes**: `repo workflow user:email` for full workflow management
- **Security**: Server-side only access, never exposed to client
- **Auto-Creation**: New users get default read permissions
- **Session Extension**: User permissions included in NextAuth session

### 🗄️ Database
- `prisma/schema.prisma`: Complete database schema
- `lib/prisma.ts`: Prisma client configuration
- `lib/validations/`: Zod schemas for type safety

### 🎨 UI Components
- `app/layout.tsx`: Root layout with providers
- `components/auth-loader.tsx`: Loading state for auth
- `app/(dashboard)/layout.tsx`: AppShell with navigation

### 📊 Data Management
- `hooks/`: TanStack Query hooks for API calls
- `providers/query-provider.tsx`: Query client configuration
- `app/api/`: Next.js API routes with Zod validation

## 🔧 Development Patterns

### 1. **Feature Development Workflow**
1. Define Prisma schema (if needed)
2. Create Zod validation schemas
3. Build API endpoints with validation
4. Create TanStack Query hooks
5. Build UI components (stats, filters, tables)
6. Create page with all components
7. Test and fix linting/TS errors

### 2. **Component Development**
- Start with `PageHeader` for consistency
- Use section-wise components (stats, filters, tables)
- Implement loading states with Mantine skeletons
- Add proper TypeScript interfaces
- Export cleanly through `index.tsx`

### 3. **Modal Patterns**
```typescript
// Always use this pattern for modals
<Modal
    opened={opened}
    onClose={onClose}
    title={<Group><Icon /><Text>Title</Text></Group>}
    size="xl"
>
    <Stack gap="md">
        {/* Content */}
    </Stack>
</Modal>
```

## ⚠️ Critical Guidelines

### 🚫 Security Rules
- Always validate with auth() in API routes
- Use Zod for all input validation
- Never expose sensitive data in client
- Encrypt all tokens and secrets

### 📝 Code Quality
- TypeScript strict mode enabled
- Biome linter configured
- No unused variables/imports
- Proper error handling with try/catch

### 🎯 UX Principles
- Professional, enterprise-grade design
- Loading states for all data fetching
- Error states with meaningful messages
- Consistent spacing using Mantine's `gap` prop
- Mobile-responsive design

## ❓ When to Ask Questions

**ALWAYS ask when:**
1. Unsure about business logic or requirements
2. Need clarification on user permissions
3. Database schema changes are needed
4. API behavior is ambiguous
5. UI/UX patterns are unclear
6. Security implications are involved

**Examples of good questions:**
- "Should users be able to delete their own permissions?"
- "What happens when a workflow run fails - should we retry automatically?"
- "Should the repository list show private repos for all users?"

## 🔄 Context Recovery

When resuming work:
1. Check recent git commits for context
2. Review the current branch and file changes
3. Look at package.json for tech stack
4. Check prisma/schema.prisma for data model
5. Review app structure and recent components
6. Ask clarifying questions if context is unclear

## 🚀 Performance Considerations

- Use React.memo for expensive components
- Implement proper pagination for large datasets
- Use TanStack Query's caching effectively
- Minimize re-renders with useCallback
- Lazy load components when appropriate

## 🚀 Complete Implementation Plan from Beginning

### **Phase 2: GitHub Integration Layer** (Current Priority)
**Timeline**: 3-4 weeks | **Branch**: `feature/github-integration`

#### **Week 1: Core Infrastructure Setup**

**Git Commits Sequence:**
1. `feat(github): add GitHub client factory with rate limiting`
2. `feat(github): implement token management and validation service`  
3. `feat(webhook): create webhook endpoint with HMAC signature validation`
4. `feat(github): add workflow discovery and caching service`
5. `test: add unit tests for GitHub client and token validation`
6. `chore: configure environment variables for GitHub integration`

**Implementation Tasks:**
```typescript
// 1. lib/github/client.ts - GitHub client factory
class GitHubClientFactory {
  createClient(token: string): Octokit
  validateToken(token: string): Promise<TokenValidation>
  checkRateLimit(token: string): Promise<RateLimitStatus>
}

// 2. lib/services/token-service.ts - Token management
class TokenService {
  validateAndStore(token: string, repositoryId: string): Promise<void>
  selectBestToken(repositoryId: string): Promise<RepositoryToken>
  rotateExpiredTokens(): Promise<void>
}

// 3. app/api/webhooks/github/route.ts - Webhook processing
export async function POST(request: Request) {
  // HMAC signature validation
  // Deduplication check
  // Queue for processing
}
```

#### **Week 2: Workflow Operations**

**Git Commits Sequence:**
1. `feat(workflows): implement workflow triggering via GitHub API`
2. `feat(webhooks): add webhook event processors for all event types`
3. `feat(workflows): add workflow run status tracking and updates`
4. `feat(github): implement error handling and retry logic with exponential backoff`
5. `test: add integration tests for workflow operations`

**Implementation Tasks:**
```typescript
// API endpoints to implement
POST /api/workflows/[id]/trigger - Trigger workflow with inputs
GET /api/workflows/[id]/runs - List workflow runs with filtering
POST /api/workflow-runs/[id]/rerun - Re-run failed workflows
DELETE /api/workflow-runs/[id] - Cancel running workflows

// Services to create
class WorkflowService {
  triggerWorkflow(workflowId, inputs, branch): Promise<WorkflowRun>
  cancelWorkflowRun(runId): Promise<void>
  rerunWorkflow(runId, rerunType): Promise<WorkflowRun>
}
```

#### **Week 3: Approval System Foundation**

**Git Commits Sequence:**
1. `feat(approvals): add approval detection in webhook processor`
2. `feat(approvals): implement approver parsing and notification logic`
3. `feat(ui): create approval status components and modals`
4. `feat(notifications): add basic email notification service`
5. `test: add comprehensive tests for approval workflow`
6. `docs: document approval system architecture and flows`

**Implementation Tasks:**
```typescript
// Approval parsing from GitHub webhooks
interface ApprovalData {
  environment: string;
  approvers: ApproverInfo[];
  status: ApprovalStatus;
  htmlUrl: string;
}

// UI Components to create
<ApprovalStatusCard />
<ApprovalNotificationBadge />
<ApproversModal />
<WorkflowApprovalAlert />
```

### **Phase 3: Notification & Real-time System** (Next Priority)
**Timeline**: 2 weeks | **Branch**: `feature/notifications`

#### **Week 1: Email Notification System**

**Git Commits Sequence:**
1. `feat(email): setup React Email templates and components`
2. `feat(email): integrate SendGrid for email delivery`
3. `feat(notifications): implement notification queue with BullMQ`
4. `feat(notifications): create notification preferences system`
5. `test: add email template tests and delivery verification`

#### **Week 2: Real-time Updates**

**Git Commits Sequence:**
1. `feat(sse): implement Server-Sent Events endpoint`
2. `feat(ui): create real-time notification center`
3. `feat(sse): add connection management and reconnection logic`
4. `feat(notifications): integrate SSE with existing workflow updates`
5. `perf: optimize SSE performance and connection handling`

### **Phases 4-7: Advanced Features Implementation**

#### **Phase 4: Analytics & Monitoring** (2 weeks)
- Elasticsearch indexing for logs and metrics
- Prometheus metrics collection
- Analytics dashboard with charts and insights
- Performance monitoring and alerting

#### **Phase 5: Advanced Workflow Features** (1 week)  
- Re-run management with history tracking
- Workflow templates and marketplace
- Bulk operations support

#### **Phase 6: Enterprise Features** (2 weeks)
- Advanced security and audit logging
- External integrations (Slack, JIRA, Teams)
- Custom reporting and compliance features

#### **Phase 7: Polish & Production** (1 week)
- Performance optimization and caching
- Edge case handling and error recovery
- Production deployment and monitoring setup

## 🎯 Git Strategy & Commit Guidelines

### **Branch Strategy**
```
main (production)
  ├── develop (staging)
  │     ├── feature/github-integration
  │     ├── feature/notifications  
  │     ├── feature/analytics
  │     ├── feature/advanced-workflows
  │     ├── feature/enterprise-features
  │     └── feature/production-ready
  └── hotfix/* (emergency fixes)
```

### **Commit Message Convention**
```
Format: <type>(<scope>): <subject>

Types:
- feat: New feature implementation
- fix: Bug fix or error resolution
- docs: Documentation updates
- style: Code formatting (no logic changes)  
- refactor: Code restructuring (no functionality change)
- perf: Performance improvements
- test: Test implementation or updates
- chore: Maintenance tasks and configuration

Examples:
- feat(github): implement workflow triggering with approval detection
- fix(webhook): resolve signature validation timeout issue
- perf(query): optimize workflow run database queries with proper indexing
- docs(api): add comprehensive GitHub integration documentation
```

### **Critical Git Commit Stages**

**Must Commit After Each:**
1. **New API Endpoint** - Complete with validation, error handling, tests
2. **New UI Component** - Component with loading states, error handling, tests
3. **Database Schema Changes** - Migration files and updated Prisma schema
4. **Service Integration** - External service integration with proper error handling
5. **Feature Completion** - End-to-end feature working with tests
6. **Security Implementation** - Authentication, authorization, validation changes
7. **Performance Optimization** - Measurable performance improvements

## 💡 Key Implementation Insights

### **Simplicity & Maintainability Principles**
1. **Single Responsibility**: Each service/component has one clear purpose
2. **Predictable Patterns**: Follow established patterns consistently
3. **Clear Error Handling**: Always provide meaningful error messages
4. **Comprehensive Logging**: Log all significant events with proper context
5. **Test Coverage**: Unit tests for business logic, integration tests for APIs
6. **Documentation**: Code comments for complex logic, API documentation

### **GitHub Integration Best Practices**
1. **Token Security**: Encrypt tokens at rest, validate scopes, handle expiry
2. **Rate Limiting**: Implement proper rate limiting with exponential backoff
3. **Webhook Security**: HMAC signature validation, deduplication, idempotency
4. **Error Recovery**: Graceful handling of GitHub API failures with retries
5. **Approval Parsing**: Robust parsing of GitHub webhook payloads for approvers
6. **Status Synchronization**: Keep local state in sync with GitHub state

### **Performance & Scalability**
1. **Database Optimization**: Proper indexing for all query patterns
2. **Query Efficiency**: Use Prisma's relationJoins for optimal queries
3. **Caching Strategy**: TanStack Query + Redis for frequently accessed data
4. **Background Processing**: BullMQ queues for all heavy operations
5. **Real-time Updates**: Efficient SSE connections with proper cleanup
6. **Resource Monitoring**: Track API usage, database performance, queue depths

## 🔧 Development Environment Setup

### **Required Environment Variables**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nexus"

# Authentication  
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_ID="your-github-app-id"
GITHUB_SECRET="your-github-app-secret"

# GitHub Integration
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
GITHUB_APP_PRIVATE_KEY="your-app-private-key"

# Redis/Queues
REDIS_URL="redis://localhost:6379"

# Email (Future)
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="noreply@yourcompany.com"

# Analytics (Future)
ELASTICSEARCH_URL="http://localhost:9200"
```

### **Development Commands**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma studio    # Open Prisma Studio

# Code Quality  
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
```

## 📚 Reference & Learning Resources

### **Study These Modules for Patterns**
1. **Users Module** (`app/(dashboard)/dashboard/users/`, `components/users/`, `hooks/use-users.ts`)
   - Complete CRUD operations with validation and error handling
   - Advanced table with filtering, pagination, and search
   - Permission management system with modal interactions
   - Professional UI components with loading states

2. **Repository Module** (`app/(dashboard)/dashboard/repositories/`, `components/repositories/`, `hooks/use-repositories.ts`)  
   - GitHub integration patterns and token management
   - Statistics dashboard with real-time updates
   - Advanced filtering and search capabilities
   - Async operations with proper error handling

3. **Authentication System** (`lib/auth.ts`, `app/(auth)/`, `middleware.ts`)
   - NextAuth.js v5 configuration patterns
   - Route protection and session management
   - Provider integration and token handling

### **Key Architecture Documents**
- **CLAUDE.md**: This comprehensive guide (complete architecture and patterns)
- **DEVELOPMENT_PLAN.md**: Detailed phase-by-phase implementation roadmap
- **FINAL_PLAN.md**: System design and advanced features architecture
- **Prisma Schema**: `prisma/schema.prisma` (complete data model with all relationships)

---

## 🎯 Success Criteria & Next Actions

### **Ready to Begin Phase 2 Implementation**

**Current Status**: ✅ Foundation complete, ready for GitHub integration

**Immediate Next Steps**:
1. Create GitHub client factory with Octokit
2. Implement token validation and management service
3. Set up webhook endpoint with proper security
4. Begin workflow discovery and API integration
5. Test with real GitHub repositories

**Success Metrics**:
- Repository sync works with real GitHub data
- Workflows can be triggered via platform
- Webhooks are processed correctly
- Token management is secure and functional
- All existing features remain operational

---

**Remember**: This is an enterprise internal tool built for reliability and maintainability. Keep code simple, straightforward, and well-documented. Focus on the core workflow management functionality before adding advanced features. Always validate with real GitHub repositories and maintain comprehensive test coverage.