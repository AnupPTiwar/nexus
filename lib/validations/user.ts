import { z } from "zod";

// Enums matching Prisma schema
export const UserStatusEnum = z.enum([
    "ACTIVE",
    "INACTIVE",
    "LOCKED",
    "PENDING_VERIFICATION",
]);

export const ResourceTypeEnum = z.enum([
    "REPOSITORY",
    "WORKFLOW",
    "WORKFLOW_RUN",
    "WORKFLOW_GROUP",
    "TOKEN",
    "USER",
    "AUDIT",
    "SCHEDULER",
    "WORKFLOW_TEMPLATE",
    "NOTIFICATION",
    "USER_PREFERENCES",
]);

export const ResourceActionEnum = z.enum([
    "CREATE",
    "DELETE",
    "MANAGE",
    "READ",
    "UPDATE",
]);

// Permission format: "RESOURCE:ACTION"
export const PermissionSchema = z
    .string()
    .regex(
        /^[A-Z_]+:[A-Z]+$/,
        "Invalid permission format. Use RESOURCE:ACTION",
    );

// User query params schema
export const UsersQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: UserStatusEnum.optional(),
    sortBy: z
        .enum(["name", "email", "createdAt", "lastLoginAt", "status"])
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// User update schema
export const UpdateUserSchema = z.object({
    status: UserStatusEnum.optional(),
    permissions: z.array(PermissionSchema).optional(),
});

// User permissions update schema
export const UpdateUserPermissionsSchema = z.object({
    permissions: z.array(PermissionSchema),
});

// User response schema
export const UserSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    image: z.string().nullable(),
    status: UserStatusEnum,
    lastLoginAt: z.date().nullable(),
    permissions: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date(),
    _count: z
        .object({
            repositories: z.number(),
            workflowRuns: z.number(),
        })
        .optional(),
});

export const UsersResponseSchema = z.object({
    users: z.array(UserSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

// Type exports
export type UserStatus = z.infer<typeof UserStatusEnum>;
export type ResourceType = z.infer<typeof ResourceTypeEnum>;
export type ResourceAction = z.infer<typeof ResourceActionEnum>;
export type Permission = z.infer<typeof PermissionSchema>;
export type UsersQuery = z.infer<typeof UsersQuerySchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UpdateUserPermissions = z.infer<typeof UpdateUserPermissionsSchema>;
export type User = z.infer<typeof UserSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
