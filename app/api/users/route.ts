import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsersQuerySchema } from "@/lib/validations/user";
import type { UserWhereInput } from "@/prisma/generated/models";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams.entries());

        // Validate query parameters
        const validationResult = UsersQuerySchema.safeParse(params);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid query parameters",
                    details: validationResult.error.issues,
                },
                { status: 400 },
            );
        }

        const { page, limit, search, status, sortBy, sortOrder } =
            validationResult.data;
        const skip = (page - 1) * limit;

        const where: UserWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (status) {
            where.status = status;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    status: true,
                    lastLoginAt: true,
                    permissions: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            repositories: true,
                            workflowRuns: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 },
        );
    }
}
