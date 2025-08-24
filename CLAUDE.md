# 🧠 Nexus Platform - Complete Architecture & Implementation Guide

## 📋 Project Overview & Business Mission

**Nexus Platform** is an enterprise GitHub workflow management system that streamlines GitHub Actions workflows through native approval integration, real-time notifications, advanced analytics, and secure token management for internal development teams.

### 🎯 Core Business Capabilities

#### **Primary Functions**
- **GitHub Workflow Management**: Trigger, monitor, and manage GitHub Actions workflows with approval workflows
- **Native GitHub Integration**: Seamless integration with GitHub's environment protection rules and deployment approvals
- **Real-time Notifications**: Email and Server-Sent Events (SSE) for approval requests and workflow status updates
- **Advanced Analytics**: Comprehensive workflow metrics, performance tracking, and business intelligence
- **Enterprise Security**: Role-based permissions, audit trails, and secure token management
- **Repository Management**: Complete GitHub repository integration with multi-token support

#### **Business Rules & Requirements**
1. **GitHub as Source of Truth**: Eventually consistent design accepting GitHub's authority over workflow states
2. **Security First**: All tokens encrypted, server-side only access, comprehensive audit logging
3. **Enterprise Permissions**: Role-based access control with granular repository and workflow permissions
4. **User Experience**: Clear feedback, professional design, intuitive workflows
5. **Scalability**: Queue-based processing, horizontal scaling, performance optimization
6. **Reliability**: Error recovery, retry logic, graceful degradation

## 🏗️ Technology Stack & Architecture

### **Core Framework & Libraries** (All Dependencies Installed ✅)
- **Framework**: Next.js 15.5.0 with App Router + React 19 + TypeScript (strict mode)
- **UI Library**: Mantine v8.2.7 (comprehensive enterprise component system)
- **Authentication**: NextAuth.js v5 with GitHub OAuth (repo workflow user:email scopes)
- **Database**: PostgreSQL with Prisma ORM v6.14.0 (relationJoins, fullTextSearchPostgres)
- **Queue System**: BullMQ v5.58.0 with Redis for background processing
- **State Management**: TanStack Query v5.85.5 for server state management
- **Validation**: Zod v4.1.0 for runtime type validation and API schemas
- **Styling**: PostCSS with Mantine preset (NO custom CSS, Mantine components only)
- **Icons**: Tabler Icons React v3.34.1 for consistent iconography

### **GitHub Integration Stack**
- **GitHub API**: Octokit/rest v22.0.0 for GitHub API integration
- **GitHub Authentication**: Access tokens encrypted and stored in database
- **Webhook Security**: HMAC signature validation for webhook endpoints
- **Token Management**: Multi-token support per repository with automatic selection
- **Approval Integration**: Parse GitHub webhook payloads for environment approvals

## 🏛️ System Architecture

### **Application Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                Frontend Layer (React/Mantine)               │
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
│  │PostgreSQL  │  │Redis Cache │  │Future: Elasticsearch│   │
│  │(Prisma)    │  │(Sessions)  │  │(Logs & Analytics)   │   │
│  │Primary Data│  │Real-time   │  │Search & Metrics     │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## 🗃️ Project Structure

### **Current Repository Structure** (Analyzed from Actual Codebase)
```
nexus/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth route group
│   │   ├── login/page.tsx            # GitHub OAuth login page
│   │   └── layout.tsx                # Centered auth layout
│   ├── (dashboard)/                  # Protected dashboard group
│   │   ├── dashboard/                # Main dashboard pages
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── users/page.tsx        # User management (✅ IMPLEMENTED)
│   │   │   ├── repositories/page.tsx # Repository management (✅ IMPLEMENTED)
│   │   │   ├── workflows/page.tsx    # Workflow management (🚧 SKELETON)
│   │   │   └── workflow-runs/page.tsx # Execution history (🚧 SKELETON)
│   │   └── layout.tsx                # AppShell dashboard layout
│   ├── api/                          # API routes
│   │   ├── auth/[...nextauth]/       # NextAuth configuration (✅ IMPLEMENTED)
│   │   ├── users/                    # User management APIs (✅ IMPLEMENTED)
│   │   │   ├── route.ts              # CRUD operations
│   │   │   └── [userId]/permissions/ # Permission management
│   │   ├── repositories/             # Repository APIs (✅ IMPLEMENTED)
│   │   │   ├── route.ts              # CRUD operations
│   │   │   ├── stats/route.ts        # Statistics endpoint
│   │   │   └── [id]/                 # Individual repository ops
│   │   │       ├── route.ts          # Get/Update/Delete
│   │   │       ├── sync/route.ts     # Sync operations
│   │   │       └── tokens/           # Token management (✅ IMPLEMENTED)
│   │   └── webhooks/github/          # GitHub webhook endpoint (🚧 PLACEHOLDER)
│   ├── layout.tsx                    # Root layout with providers
│   └── page.tsx                      # Landing page
├── components/                       # Reusable UI components
│   ├── auth-loader.tsx               # Authentication loading state
│   ├── page-header.tsx               # Consistent page headers
│   ├── users/                        # User management components (✅ COMPLETE)
│   │   ├── stats/                    # User statistics cards
│   │   ├── filters/                  # Advanced filtering
│   │   ├── table/                    # User data table
│   │   ├── permissions-modal.tsx     # Permission management
│   │   └── index.tsx                 # Clean exports
│   └── repositories/                 # Repository components (✅ COMPLETE)
│       ├── stats/                    # Repository statistics
│       ├── filters/                  # Repository filtering
│       ├── table/                    # Repository table
│       ├── create-repository-modal.tsx # Repository creation
│       ├── edit-repository-modal.tsx # Repository editing
│       ├── repository-token-manager.tsx # Token management UI
│       ├── repository-token-modal.tsx # Token modal
│       └── index.tsx                 # Clean exports
├── hooks/                            # TanStack Query hooks
│   ├── use-users.ts                  # User data management (✅ COMPLETE)
│   ├── use-repositories.ts           # Repository operations (✅ COMPLETE)
│   └── use-repository-tokens.ts      # Token management (✅ COMPLETE)
├── lib/                              # Core utilities
│   ├── auth.ts                       # NextAuth configuration (✅ IMPLEMENTED)
│   ├── prisma.ts                     # Prisma client setup
│   ├── permission.ts                 # Permission utilities (✅ IMPLEMENTED)
│   └── validations/                  # Zod validation schemas
│       ├── user.ts                   # User schemas (✅ COMPLETE)
│       └── repository.ts             # Repository schemas (✅ COMPLETE)
├── prisma/                           # Database layer
│   ├── schema.prisma                 # Complete database schema (✅ IMPLEMENTED)
│   ├── migrations/                   # Migration files
│   ├── seed.ts                       # Database seeding
│   └── generated/                    # Generated Prisma client
├── providers/                        # React providers
│   └── query-provider.tsx            # TanStack Query setup
└── types/                            # TypeScript definitions
    └── next-auth.d.ts                # Extended NextAuth types
```

## 🗄️ Database Schema Status

### **Complete Database Models** (18 models, all implemented ✅)

#### **Core System Models**
```typescript
// User management with GitHub OAuth and permissions
User {
  id, name, email, image, status, lastLoginAt
  githubAccessToken (encrypted)      // GitHub access token for API calls
  permissions: String[]              // ["REPOSITORY:READ", "WORKFLOW:TRIGGER", etc.]
  importExternalRuns: Boolean        // Import non-platform workflows
  showOnlyPlatformRuns: Boolean      // Filter view to platform-only
}

// OAuth provider management
Provider {
  name, displayName, baseUrl, apiUrl, isActive
}

// GitHub account linking
ProviderAccount {
  providerAccountId, username, email, name, avatarUrl
  accessToken, refreshToken (encrypted)
  tokenExpiresAt
}
```

#### **Repository & Token Management**
```typescript
// GitHub repository integration
Repository {
  name, githubOwner, githubRepoId, githubUrl, description, visibility
  isActive, isSyncing, lastSyncAt
  webhookSecret (encrypted), webhookId
  importAllRuns, autoSync, syncInterval
}

// Multi-token support per repository
RepositoryToken {
  name, description, tokenHash (encrypted)
  scopes: String[], tokenType, isActive
  lastUsedAt, expiresAt
}
```

#### **Workflow Management Models**
```typescript
// Workflow definitions from GitHub
Workflow {
  name, path, githubWorkflowId, state
  inputs: Json, triggers: String[]
  description, documentation
}

// Branch-specific workflow inputs
WorkflowBranch {
  branch, inputs: Json, isDefault
}

// Workflow execution tracking
WorkflowRun {
  name, githubRunId, runNumber, status, conclusion
  source (PLATFORM | GITHUB_UI | GITHUB_API | GITHUB_EVENT | IMPORTED)
  triggeredBy, actorUsername, actorAvatarUrl
  branch, commitSha, commitMessage
  runStartedAt, runUpdatedAt, runCompletedAt
  approvalRequired, approversJson, approvalUrl, approvalEnvironment
}

// Job and step level tracking
WorkflowJob { name, githubJobId, status, conclusion, startedAt, completedAt }
WorkflowStep { name, number, status, conclusion, startedAt, completedAt }
```

#### **Approval & Notification System**
```typescript
// GitHub environment approval tracking
WorkflowApproval {
  environment, status, approvers: Json
  approvedAt, htmlUrl
}

// User notifications
Notification {
  type, title, message, metadata: Json
  isRead, readAt
}

// Delivery tracking
NotificationLog {
  channel (EMAIL | SSE), status, attemptCount
  deliveredAt, errorMessage
}
```

#### **Security & Analytics**
```typescript
// Granular permissions per repository/branch
BranchPermission {
  branch, actions: ResourceAction[]
}

// Complete audit trail
AuditLog {
  action, resourceType, resourceId
  details: Json, userAgent, ipAddress
}

// Performance analytics
AnalyticsSnapshot {
  metric, value, dimensions: Json
  timestamp, dataType
}
```

## 🎨 Established Coding Patterns & Architecture

### **Proven File Organization** (From Actual Implementation)
```typescript
// Feature-based structure (proven pattern)
components/
  feature/
    stats/
      stats-card.tsx       // Individual stat component
      stats-container.tsx  // Container with data fetching
      index.tsx           // Clean exports
    filters/
      filters.tsx         // Filter form component
      index.tsx
    table/
      table-head.tsx      // Table header
      table-row.tsx       // Individual row component
      table-container.tsx // Table with pagination
      index.tsx
    feature-modal.tsx     // Modal components
    index.tsx             // Feature-level exports
```

### **API Pattern** (Implemented & Working)
```typescript
// All APIs follow this exact pattern
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
    
    // 3. Database operations with proper error handling
    try {
        const results = await prisma.model.operation();
        return NextResponse.json(results);
    } catch (error) {
        console.error("Operation failed:", error);
        return NextResponse.json(
            { error: "Operation failed" },
            { status: 500 }
        );
    }
}
```

### **Component Pattern** (Proven & Consistent)
```typescript
"use client";

import { Group, Stack, Text } from "@mantine/core";
import { IconFeature } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { TypeDefinition } from "@/lib/validations/feature";

interface ComponentProps {
    data: TypeDefinition;
    onAction: (data: TypeDefinition) => void;
}

export function ComponentName({ data, onAction }: ComponentProps) {
    // 1. Hooks first
    const { data: queryData, isLoading } = useQuery({...});
    
    // 2. Event handlers
    const handleAction = useCallback((item: TypeDefinition) => {
        onAction(item);
    }, [onAction]);
    
    // 3. Early returns for loading states
    if (isLoading) return <LoadingSkeleton />;
    
    // 4. Main render with Mantine components only
    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Text fw={600}>{data.name}</Text>
                <IconFeature size={16} />
            </Group>
        </Stack>
    );
}
```

### **TanStack Query Hooks** (Implemented Pattern)
```typescript
// Proven data fetching pattern
export function useFeature(params: FeatureQuery) {
    return useQuery<FeatureResponse>({
        queryKey: ["feature", params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, String(value));
                }
            });
            
            const response = await fetch(`/api/feature?${searchParams}`);
            if (!response.ok) throw new Error("Failed to fetch");
            return response.json();
        },
    });
}

export function useCreateFeature() {
    const queryClient = useQueryClient();
    
    return useMutation<Feature, Error, CreateFeature>({
        mutationFn: async (data) => {
            const response = await fetch("/api/feature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create");
            }
            
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feature"] });
        },
    });
}
```

## ✅ COMPLETED FEATURES - Status Assessment

### **Phase 1: Foundation & Repository Management** (🟢 FULLY OPERATIONAL)

#### **✅ Authentication System**
- NextAuth.js v5 with GitHub OAuth integration
- GitHub access token storage (encrypted in database)
- Required scopes: `repo workflow user:email`
- User creation with default permissions: `["REPOSITORY:READ", "WORKFLOW:READ", "WORKFLOW_RUN:READ"]`
- Session extension with user permissions and status
- Route protection middleware for dashboard pages

#### **✅ User Management System** (Complete CRUD)
- User listing with advanced filtering and search
- Permission management with granular controls
- User statistics dashboard with real-time data
- Modal-based user editing and permission updates
- Proper error handling and loading states
- Professional UI with Mantine components

#### **✅ Repository Management System** (Complete CRUD)
- Repository creation, editing, and deletion
- GitHub URL integration and validation
- Repository statistics and metrics
- Token management system with multi-token support
- Repository sync operations (placeholder for webhook integration)
- Advanced filtering by visibility, status, sync state
- Professional table with pagination and search

#### **✅ API Infrastructure** (RESTful with Validation)
- `/api/auth/[...nextauth]` - Authentication endpoints
- `/api/users` - User CRUD operations
- `/api/users/[userId]/permissions` - Permission management
- `/api/repositories` - Repository CRUD operations  
- `/api/repositories/[id]` - Individual repository operations
- `/api/repositories/[id]/tokens` - Token management
- `/api/repositories/[id]/sync` - Sync operations
- `/api/repositories/stats` - Repository statistics
- All endpoints with Zod validation and proper error handling

#### **✅ UI Component System** (Professional & Consistent)
- Mantine v8.2.7 component library integration
- Section-based component organization (stats, filters, tables)
- Loading states with skeletons
- Error handling with meaningful messages
- Modal interactions for complex operations
- Professional styling with enterprise-grade design
- Mobile-responsive layouts

#### **✅ State Management** (TanStack Query)
- Complete query hooks for all features
- Proper caching and invalidation strategies
- Optimistic updates for better UX
- Error handling and retry logic
- Background refetching for fresh data

## 🚧 NEXT PRIORITY: Phase 2 - GitHub Integration Layer

### **Missing Critical Components** (Ready to Implement)

#### **🔧 GitHub API Integration** 
```typescript
// Required implementations
lib/github/
  client.ts                    // GitHub client factory with rate limiting
  token-service.ts             // Token validation and management
  workflow-service.ts          // Workflow discovery and triggering
  webhook-service.ts           // Webhook processing and validation
```

#### **🔧 Webhook Processing**
```typescript
// Webhook endpoint implementation needed
app/api/webhooks/github/route.ts  // HMAC validation + event processing
lib/services/
  webhook-processor.ts            // Event parsing and database updates
  approval-detector.ts            // Parse GitHub approval events
```

#### **🔧 Workflow Operations**
```typescript
// Missing workflow management
lib/services/
  workflow-manager.ts             // Trigger workflows via GitHub API
  run-tracker.ts                  // Track workflow execution status
  approval-tracker.ts             // Monitor approval requirements
```

### **Implementation Roadmap** (3-4 weeks)

#### **Week 1: GitHub Client & Token Management**
1. Create GitHub client factory with Octokit integration
2. Implement token validation and scope checking
3. Build token rotation and management service
4. Add rate limiting and error handling
5. Create unit tests for client operations

#### **Week 2: Webhook Processing**
1. Implement webhook endpoint with HMAC signature validation
2. Create event processors for workflow and approval events
3. Build database sync for workflow runs and approvals
4. Add deduplication and idempotency handling
5. Test with real GitHub repositories

#### **Week 3: Workflow Operations**
1. Implement workflow triggering via GitHub API
2. Add workflow discovery and caching
3. Build approval detection and notification system
4. Create UI for workflow triggering and monitoring
5. End-to-end testing with approval workflows

#### **Week 4: Integration & Polish**
1. Integrate all components with existing UI
2. Add comprehensive error handling and recovery
3. Performance optimization and monitoring
4. Documentation and deployment preparation

## 🎯 Critical Business Rules & Security Requirements

### **Security Requirements** (Enterprise-Grade)
1. **Token Encryption**: All GitHub tokens encrypted at rest using proper encryption (not just hashing)
2. **Server-Side Only**: GitHub tokens never exposed to client-side code
3. **Scope Validation**: Verify token scopes before operations
4. **Audit Trail**: Log all workflow triggers and approval actions
5. **Permission Checks**: Validate user permissions for all operations
6. **HMAC Validation**: Secure webhook signature verification

### **Business Logic Rules**
1. **GitHub Authority**: GitHub is source of truth for all workflow states
2. **Eventually Consistent**: Accept slight delays in status synchronization
3. **Graceful Degradation**: System continues operating during GitHub outages
4. **User Permissions**: Respect repository-level and branch-level permissions
5. **Approval Integration**: Honor GitHub environment protection rules
6. **Multi-Tenant**: Support multiple organizations and repositories

### **Data Consistency Rules**
1. **Duplicate Prevention**: Prevent duplicate workflow runs from webhooks
2. **State Synchronization**: Keep local state in sync with GitHub
3. **Approval Tracking**: Accurately track approval status and approvers
4. **Token Selection**: Automatically select best available token for operations
5. **Error Recovery**: Retry failed operations with exponential backoff

## 🔧 Development Environment & Commands

### **Environment Variables Required**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nexus"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your-github-app-id"
GITHUB_CLIENT_SECRET="your-github-app-secret"

# GitHub Integration (Future)
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
GITHUB_APP_PRIVATE_KEY="your-app-private-key"

# Redis/Queues (Future)
REDIS_URL="redis://localhost:6379"
```

### **Development Commands**
```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm build            # Build for production with Turbopack
pnpm start            # Start production server

# Database
pnpm postinstall      # Generate Prisma client
pnpm db:seed          # Seed database with test data
pnpm db:reset         # Reset and reseed database

# Code Quality
pnpm lint             # Run Biome linter
pnpm format           # Format code with Biome
```

## 💡 Key Implementation Guidelines

### **Mandatory Coding Standards**
1. **File Naming**: kebab-case for files, PascalCase for components
2. **Component Structure**: Section-based organization (stats, filters, tables)
3. **API Patterns**: Always use Zod validation + proper error handling
4. **TypeScript**: Strict mode, no `any` types, proper interface definitions
5. **Mantine Only**: No custom CSS, use Mantine components and props exclusively
6. **Error Handling**: Comprehensive try-catch with meaningful error messages
7. **Loading States**: Skeleton components for all async operations

### **GitHub Integration Principles**
1. **Token Security**: Encrypt all tokens, validate scopes, handle expiry
2. **Rate Limiting**: Implement proper rate limiting with exponential backoff
3. **Webhook Security**: HMAC signature validation, deduplication, idempotency
4. **Error Recovery**: Graceful handling of GitHub API failures with retries
5. **Approval Parsing**: Robust parsing of GitHub webhook payloads for approvers
6. **Status Sync**: Keep local state in sync with GitHub state

### **Performance & Scalability**
1. **Database Optimization**: Proper indexing for all query patterns
2. **Query Efficiency**: Use Prisma's relationJoins for optimal queries
3. **Caching Strategy**: TanStack Query + Redis for frequently accessed data
4. **Background Processing**: BullMQ queues for all heavy operations
5. **Real-time Updates**: Efficient SSE connections with proper cleanup

## 🚀 Success Criteria & Next Steps

### **Phase 2 Success Metrics**
- [ ] Repository sync works with real GitHub data
- [ ] Workflows can be triggered via platform
- [ ] Webhooks are processed correctly and update database
- [ ] Token management is secure and functional
- [ ] All existing features remain operational
- [ ] Performance meets enterprise standards

### **Immediate Actions Required**
1. **Create GitHub client factory** with Octokit and rate limiting
2. **Implement webhook endpoint** with HMAC signature validation
3. **Build workflow triggering system** with proper error handling
4. **Test with real GitHub repositories** to validate integration
5. **Maintain existing feature functionality** during integration

---

**Architecture Philosophy**: This is an enterprise internal tool built for reliability, security, and maintainability. Code should be simple, well-documented, and follow established patterns. Always prioritize security and user experience over feature complexity. GitHub is the source of truth - our system provides a better interface and workflow management layer on top of GitHub's native capabilities.

**Memory Update**: This document represents the current actual state of the Nexus Platform based on code analysis completed on 2025-08-24. All "completed" features are verified as implemented and operational. Next phase implementation should build upon these proven patterns and maintain the established architecture.