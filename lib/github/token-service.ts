import { prisma } from "@/lib/prisma";
import { createGitHubClient } from "./client";

export type TokenSelectionResult =
    | {
          success: true;
          token: string;
          tokenId: string;
          tokenType: "USER" | "REPOSITORY";
          source: "user_private" | "user_manage_permission" | "any_private";
      }
    | {
          success: false;
          error: string;
          code:
              | "NO_PRIVATE_TOKEN_REQUIRED"
              | "NO_TOKEN_FOUND"
              | "INVALID_TOKEN";
      };

export interface TokenValidationResult {
    valid: boolean;
    scopes: string[];
    rateLimit?: {
        remaining: number;
        reset: Date;
    };
    error?: string;
}

export interface BranchAccessResult {
    hasMainAccess: boolean;
    hasAllBranchAccess: boolean;
    specificBranches: string[];
}

/**
 * Token selection utility with priority logic:
 * 1. Private token for user on repo (highest priority)
 * 2. If user has MANAGE permission on repo, return any private token
 * 3. Otherwise, error for public repo access
 */
export async function selectTokenForUser(
    userId: string,
    repositoryId: string,
): Promise<TokenSelectionResult> {
    try {
        // Get user with permissions and repository with tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                githubAccessToken: true,
                permissions: true,
            },
        });

        if (!user) {
            return {
                success: false,
                error: "User not found",
                code: "NO_TOKEN_FOUND",
            };
        }

        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId },
            include: {
                repositoryTokens: {
                    where: { isActive: true },
                    orderBy: { lastUsedAt: "desc" },
                },
            },
        });

        if (!repository) {
            return {
                success: false,
                error: "Repository not found",
                code: "NO_TOKEN_FOUND",
            };
        }

        // Priority 1: Check if user has a private token for this repository
        const userPrivateToken = repository.repositoryTokens.find(
            (token) => token.type === "PRIVATE" && token.userId === userId,
        );

        if (userPrivateToken?.token) {
            return {
                success: true,
                token: userPrivateToken.token,
                tokenId: userPrivateToken.id,
                tokenType: "USER",
                source: "user_private",
            };
        }

        // Priority 2: Check if user has MANAGE permission on repository
        const hasManagePermission = hasRepositoryManagePermission(
            user.permissions,
            repositoryId,
        );

        if (!hasManagePermission && repository.visibility === "PUBLIC") {
            return {
                success: false,
                error: "Cannot use public token. Add a private token please.",
                code: "NO_PRIVATE_TOKEN_REQUIRED",
            };
        }

        // Priority 3: Return any private token for the repository (from other users)
        const anyPrivateToken = repository.repositoryTokens.find(
            (token) =>
                token.type === "PRIVATE" &&
                token.isActive &&
                token.userId !== userId,
        );

        if (anyPrivateToken?.token) {
            // Update last used timestamp
            await prisma.repositoryToken.update({
                where: { id: anyPrivateToken.id },
                data: { lastUsedAt: new Date() },
            });

            return {
                success: true,
                token: anyPrivateToken.token,
                tokenId: anyPrivateToken.id,
                tokenType: "REPOSITORY",
                source: hasManagePermission
                    ? "user_manage_permission"
                    : "any_private",
            };
        }

        return {
            success: false,
            error: "No token found",
            code: "NO_TOKEN_FOUND",
        };
    } catch (error) {
        console.error("Token selection failed:", error);
        return {
            success: false,
            error: "Token selection failed",
            code: "NO_TOKEN_FOUND",
        };
    }
}

/**
 * Validate a GitHub token and return its capabilities
 */
export async function validateGitHubToken(
    token: string,
): Promise<TokenValidationResult> {
    try {
        const client = createGitHubClient(token);
        const validation = await client.validateToken();

        if (!validation.valid) {
            return {
                valid: false,
                scopes: [],
                error: validation.error,
            };
        }

        // Get rate limit info
        const rateLimit = await client.getRateLimit();

        return {
            valid: true,
            scopes: validation.scopes || [],
            rateLimit: {
                remaining: rateLimit.rate.remaining,
                reset: new Date(rateLimit.rate.reset * 1000),
            },
        };
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        return {
            valid: false,
            scopes: [],
            error: errorMessage,
        };
    }
}

/**
 * Check if user has MANAGE permission for a specific repository
 */
export function hasRepositoryManagePermission(
    permissions: string[],
    repositoryId: string,
): boolean {
    return permissions.some(
        (permission) =>
            permission === "REPOSITORY:MANAGE" ||
            permission === `REPOSITORY:${repositoryId}:MANAGE`,
    );
}

/**
 * Get user's branch access level for a repository
 */
export async function getUserBranchAccess(
    userId: string,
    repositoryId: string,
): Promise<BranchAccessResult> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { permissions: true },
        });

        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId },
            select: { visibility: true },
        });

        if (!user || !repository) {
            return {
                hasMainAccess: false,
                hasAllBranchAccess: false,
                specificBranches: [],
            };
        }

        const hasManagePermission = hasRepositoryManagePermission(
            user.permissions,
            repositoryId,
        );

        // For public repos: main branch access by default, all branches if MANAGE permission
        if (repository.visibility === "PUBLIC") {
            return {
                hasMainAccess: true,
                hasAllBranchAccess: hasManagePermission,
                specificBranches: hasManagePermission
                    ? ["*"]
                    : ["main", "master"],
            };
        }

        // For private repos: all branch access by default
        return {
            hasMainAccess: true,
            hasAllBranchAccess: true,
            specificBranches: ["*"],
        };
    } catch (error) {
        console.error("Failed to get user branch access:", error);
        return {
            hasMainAccess: false,
            hasAllBranchAccess: false,
            specificBranches: [],
        };
    }
}

/**
 * Create GitHub client with automatic token selection for a user
 */
export async function createClientForUser(
    userId: string,
    repositoryId: string,
) {
    const tokenResult = await selectTokenForUser(userId, repositoryId);

    if (!tokenResult.success) {
        throw new Error(tokenResult.error);
    }

    return {
        client: createGitHubClient(tokenResult.token),
        tokenInfo: tokenResult,
    };
}
