import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateUserPermissionsSchema } from "@/lib/validations/user";

export async function PUT(
    request: Request,
    { params }: { params: { userId: string } },
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = UpdateUserPermissionsSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request body",
                    details: validationResult.error.issues,
                },
                { status: 400 },
            );
        }

        const { permissions } = validationResult.data;

        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { id: params.userId },
        });

        if (!userExists) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        // Update user permissions
        const updatedUser = await prisma.user.update({
            where: { id: params.userId },
            data: { permissions },
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
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user permissions:", error);
        return NextResponse.json(
            { error: "Failed to update user permissions" },
            { status: 500 },
        );
    }
}
