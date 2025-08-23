# Nexus Platform - Complete Development Plan

## 🏗️ **Project Architecture & Key Components**

### **Core Technology Stack**
- **Framework**: Next.js 15 with App Router + React 19 + TypeScript
- **UI Library**: Mantine v8 (comprehensive component system)
- **Authentication**: NextAuth.js v5 with GitHub OAuth
- **Database**: PostgreSQL with Prisma ORM v6
- **State Management**: TanStack Query v5 for server state
- **Validation**: Zod v4 for runtime type validation
- **Styling**: PostCSS with Mantine preset + CSS Modules
- **Icons**: Tabler Icons React
- **Environment**: T3 Env for type-safe environment variables

### **Critical Imports & References**
```typescript
// Core Types (Always import from generated Prisma types)
import type { User, Repository, Workflow, WorkflowRun } from "@/prisma/generated/models";
import type { UserWhereInput, RepositoryWhereInput } from "@/prisma/generated/models";

// Validation Schemas (Create for each domain)
import { UsersQuerySchema, UpdateUserSchema } from "@/lib/validations/user";
import { RepositorySchema, CreateRepositorySchema } from "@/lib/validations/repository";

// Core Services
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { env } from "@/env";

// UI Components (Mantine pattern)
import { Button, Card, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { useDisclosure, useForm } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

// Icons (Consistent naming)
import { IconBrandGithub, IconGitBranch, IconUsers } from "@tabler/icons-react";

// Hooks (Custom patterns)
import { useUsers, useUpdateUserPermissions } from "@/hooks/use-users";
import { useRepositories, useCreateRepository } from "@/hooks/use-repositories";
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

## 🎯 **Development Roadmap**

### **Phase 1: Core API Development**
Build the foundational API endpoints that power the entire application.

#### **Repository Management APIs**
- `POST /api/repositories` - Add GitHub repositories
- `GET /api/repositories` - List user repositories with filtering
- `PUT /api/repositories/[id]` - Update repository settings
- `DELETE /api/repositories/[id]` - Remove repository
- `POST /api/repositories/[id]/sync` - Manual sync with GitHub
- `GET /api/repositories/[id]/workflows` - List repository workflows

#### **Token Management APIs**
- `POST /api/repositories/[id]/tokens` - Add GitHub tokens
- `GET /api/repositories/[id]/tokens` - List repository tokens
- `PUT /api/tokens/[id]` - Update token settings
- `DELETE /api/tokens/[id]` - Remove tokens
- `POST /api/tokens/[id]/validate` - Validate token permissions

#### **Workflow Management APIs**
- `GET /api/workflows` - List workflows across repositories
- `POST /api/workflows/[id]/trigger` - Trigger workflow runs
- `GET /api/workflows/[id]/runs` - List workflow run history
- `PUT /api/workflows/[id]` - Update workflow settings

#### **Workflow Run APIs**
- `GET /api/workflow-runs` - List runs with advanced filtering
- `GET /api/workflow-runs/[id]` - Get detailed run information
- `POST /api/workflow-runs/[id]/rerun` - Re-run failed workflows
- `POST /api/workflow-runs/[id]/cancel` - Cancel running workflows

### **Phase 2: GitHub Integration Layer**
Create services to interact with GitHub API and handle real-time updates.

#### **GitHub Service Layer**
- Repository synchronization service
- Workflow discovery and caching
- Token validation and permission checking
- Rate limiting and error handling

#### **Webhook System**
- Webhook endpoint for GitHub events
- Event processing and database updates
- Real-time notification system
- Webhook security and validation

### **Phase 3: Dashboard Implementation**
Build the user interface components following established patterns.

#### **Repository Management Dashboard**
- Repository listing with sync status indicators
- Add/remove repository interface
- Token management with validation status
- Bulk operations and filtering

#### **Workflow Management Dashboard**
- Workflow listing with status indicators
- Manual trigger interface with input forms
- Workflow configuration and settings
- Template management system

#### **Workflow Runs Dashboard**
- Run history with advanced filtering
- Real-time status updates
- Detailed run logs and step information
- Re-run and cancellation controls

### **Phase 4: Advanced Features**
Implement sophisticated functionality for enterprise use.

#### **Real-time Updates**
- WebSocket/Server-Sent Events for live updates
- Real-time dashboard metrics
- Live workflow run status
- Notification system integration

#### **Analytics & Reporting**
- Workflow success/failure metrics
- Performance analytics and trends
- Usage reports and dashboards
- Export functionality

#### **Security & Compliance**
- Comprehensive audit logging
- Role-based access control
- Security scanning integration
- Compliance reporting tools

## 🔧 **Development Guidelines**

### **Code Quality Standards**
- Always use TypeScript with strict mode
- Implement proper error handling in all API routes
- Use Zod for all input validation
- Follow the established component patterns
- Write comprehensive JSDoc comments
- Use consistent naming conventions

### **Testing Strategy**
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for UI interactions
- End-to-end tests for critical user flows

### **Performance Considerations**
- Implement proper database indexing
- Use React Query for efficient caching
- Optimize bundle size with proper imports
- Implement pagination for large datasets

### **Security Best Practices**
- Validate all inputs server-side
- Implement proper authentication checks
- Use environment variables for secrets
- Follow OWASP security guidelines

## 📚 **Reference Documentation**
- **Next.js 15**: App Router patterns and best practices
- **Mantine v8**: Component library documentation
- **Prisma**: Database modeling and query optimization
- **TanStack Query**: Server state management patterns
- **NextAuth.js v5**: Authentication configuration
- **GitHub API**: Webhook events and API endpoints

This plan serves as your complete development guide. Reference it in every session to maintain consistency and follow established patterns.
