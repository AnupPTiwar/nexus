# 🧠 Nexus Platform - Claude Memory File

## 📋 Project Overview

**Nexus Platform** is an enterprise-grade GitHub workflow management system built for internal teams and customers. It provides centralized control over GitHub Actions workflows, repository management, and user access control.

### 🎯 Core Purpose
- **Internal Tool**: Not for selling/advertising, but for teams using our other products
- **Workflow Management**: Execute, monitor, and manage GitHub Actions workflows
- **Enterprise Security**: Role-based permissions and audit trails
- **Real-time Monitoring**: Track workflow runs, jobs, and steps

### 🏗️ Architecture Stack
- **Framework**: Next.js 15.5.0 with App Router
- **UI Library**: Mantine v8.2.7 (Professional, enterprise-grade components)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with GitHub OAuth
- **State Management**: TanStack Query v5 for server state
- **Validation**: Zod v4 for type-safe schemas
- **Styling**: Mantine components only (NO custom CSS)
- **TypeScript**: Full type safety throughout

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
- `lib/auth.ts`: NextAuth configuration with GitHub OAuth
- `middleware.ts`: Route protection
- `app/(auth)/`: Authentication routes and layouts

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

---

**Remember**: This is an enterprise internal tool, so prioritize reliability, security, and maintainability over fancy features. Always maintain professional code quality and ask questions when in doubt!