import { z } from "zod";

// Enums matching Prisma schema
export const VisibilityEnum = z.enum(["PUBLIC", "PRIVATE"]);

export const TokenTypeEnum = z.enum(["PUBLIC", "PRIVATE"]);

// Repository query params schema
export const RepositoriesQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    visibility: VisibilityEnum.optional(),
    isActive: z.coerce.boolean().optional(),
    isSyncing: z.coerce.boolean().optional(),
    sortBy: z.enum(["name", "githubOwner", "createdAt", "lastSyncAt", "visibility"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Create repository schema
export const CreateRepositorySchema = z.object({
    name: z.string().min(1, "Repository name is required"),
    githubOwner: z.string().min(1, "GitHub owner is required"),
    githubUrl: z.string().url("Valid GitHub URL is required"),
    description: z.string().optional(),
    visibility: VisibilityEnum,
});

// Update repository schema
export const UpdateRepositorySchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    visibility: VisibilityEnum.optional(),
    isActive: z.boolean().optional(),
    webhookSecret: z.string().optional(),
});

// Repository sync schema
export const SyncRepositorySchema = z.object({
    force: z.boolean().default(false),
});

// Repository token schemas
export const CreateRepositoryTokenSchema = z.object({
    token: z.string().min(1, "Token is required"),
    alias: z.string().optional(),
    type: TokenTypeEnum.default("PRIVATE"),
});

export const UpdateRepositoryTokenSchema = z.object({
    alias: z.string().optional(),
    type: TokenTypeEnum.optional(),
    isActive: z.boolean().optional(),
});

// Repository response schemas
export const RepositorySchema = z.object({
    id: z.string(),
    name: z.string(),
    githubOwner: z.string(),
    githubUrl: z.string(),
    description: z.string().nullable(),
    visibility: VisibilityEnum,
    isActive: z.boolean(),
    isSyncing: z.boolean(),
    lastSyncAt: z.date().nullable(),
    webhookSecret: z.string().nullable(),
    userId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    _count: z.object({
        repositoryTokens: z.number(),
        workflows: z.number(),
    }).optional(),
    user: z.object({
        id: z.string(),
        name: z.string().nullable(),
        email: z.string().nullable(),
    }).nullable().optional(),
});

export const RepositoryTokenSchema = z.object({
    id: z.string(),
    alias: z.string().nullable(),
    type: TokenTypeEnum,
    isActive: z.boolean(),
    lastUsedAt: z.date().nullable(),
    githubUserId: z.bigint().nullable(),
    githubLogin: z.string().nullable(),
    githubEmail: z.string().nullable(),
    githubName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    repositoryId: z.string(),
    userId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const RepositoriesResponseSchema = z.object({
    repositories: z.array(RepositorySchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

export const RepositoryTokensResponseSchema = z.object({
    tokens: z.array(RepositoryTokenSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

// Repository stats schema
export const RepositoryStatsSchema = z.object({
    totalRepositories: z.number(),
    activeRepositories: z.number(),
    inactiveRepositories: z.number(),
    syncingRepositories: z.number(),
    publicRepositories: z.number(),
    privateRepositories: z.number(),
    totalWorkflows: z.number(),
    averageWorkflowsPerRepo: z.number(),
});

// Type exports
export type Visibility = z.infer<typeof VisibilityEnum>;
export type TokenType = z.infer<typeof TokenTypeEnum>;
export type RepositoriesQuery = z.infer<typeof RepositoriesQuerySchema>;
export type CreateRepository = z.infer<typeof CreateRepositorySchema>;
export type UpdateRepository = z.infer<typeof UpdateRepositorySchema>;
export type SyncRepository = z.infer<typeof SyncRepositorySchema>;
export type CreateRepositoryToken = z.infer<typeof CreateRepositoryTokenSchema>;
export type UpdateRepositoryToken = z.infer<typeof UpdateRepositoryTokenSchema>;
export type Repository = z.infer<typeof RepositorySchema>;
export type RepositoryToken = z.infer<typeof RepositoryTokenSchema>;
export type RepositoriesResponse = z.infer<typeof RepositoriesResponseSchema>;
export type RepositoryTokensResponse = z.infer<typeof RepositoryTokensResponseSchema>;
export type RepositoryStats = z.infer<typeof RepositoryStatsSchema>;
