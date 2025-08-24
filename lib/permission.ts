import type {
    Repository as ValidationRepository,
    RepositoryToken as ValidationRepositoryToken,
} from "@/lib/validations/repository";
import type {
    Repository as PrismaRepository,
    RepositoryToken as PrismaRepositoryToken,
    ResourceAction,
    ResourceType,
} from "@/prisma";

export type Permission = `${ResourceType}:${ResourceAction}`;

// Type for repository that can be either Prisma or Validation schema
type RepositoryForPermissions =
    | Pick<PrismaRepository, "userId" | "visibility">
    | Pick<ValidationRepository, "userId" | "visibility">;

// Type for token that can be either Prisma or Validation schema
type RepositoryTokenForPermissions =
    | Pick<PrismaRepositoryToken, "userId">
    | Pick<ValidationRepositoryToken, "userId">;

export const hasPermission = (
    userPermissions: string[],
    requiredPermission: Permission,
): boolean => {
    return userPermissions.includes(requiredPermission);
};

// Repository Token Permission Functions
export const canReadRepositoryTokens = (
    userPermissions: string[],
    repository: RepositoryForPermissions,
    userId: string,
): boolean => {
    // 1. Repository owner can read all tokens
    if (repository.userId === userId) return true;

    // 2. User with TOKEN:READ permission
    if (hasPermission(userPermissions, "TOKEN:READ")) return true;

    // 3. User with REPOSITORY:READ permission
    if (hasPermission(userPermissions, "REPOSITORY:READ")) return true;

    return false;
};

export const canCreateRepositoryToken = (
    userPermissions: string[],
    repository: RepositoryForPermissions,
    userId: string,
): boolean => {
    // 1. Repository owner can create tokens
    if (repository.userId === userId) return true;

    // 2. User with TOKEN:CREATE permission
    if (hasPermission(userPermissions, "TOKEN:CREATE")) return true;

    // 3. User with TOKEN:MANAGE permission
    if (hasPermission(userPermissions, "TOKEN:MANAGE")) return true;

    // 4. User with REPOSITORY:MANAGE permission for public repos
    if (
        repository.visibility === "PUBLIC" &&
        hasPermission(userPermissions, "REPOSITORY:MANAGE")
    )
        return true;

    return false;
};

export const canUpdateRepositoryToken = (
    userPermissions: string[],
    repository: RepositoryForPermissions,
    token: RepositoryTokenForPermissions,
    userId: string,
): boolean => {
    // 1. Repository owner can update all tokens
    if (repository.userId === userId) return true;

    // 2. Token owner can update their own token
    if (token.userId === userId) return true;

    // 3. User with TOKEN:UPDATE permission
    if (hasPermission(userPermissions, "TOKEN:UPDATE")) return true;

    // 4. User with TOKEN:MANAGE permission
    if (hasPermission(userPermissions, "TOKEN:MANAGE")) return true;

    return false;
};

export const canDeleteRepositoryToken = (
    userPermissions: string[],
    repository: RepositoryForPermissions,
    token: RepositoryTokenForPermissions,
    userId: string,
): boolean => {
    // 1. Repository owner can delete all tokens
    if (repository.userId === userId) return true;

    // 2. Token owner can delete their own token
    if (token.userId === userId) return true;

    // 3. User with TOKEN:DELETE permission
    if (hasPermission(userPermissions, "TOKEN:DELETE")) return true;

    // 4. User with TOKEN:MANAGE permission
    if (hasPermission(userPermissions, "TOKEN:MANAGE")) return true;

    return false;
};
