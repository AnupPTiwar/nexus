import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: { id: string };
}

// DELETE /api/notifications/[id] - Dismiss a specific notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id } = params;

        // Check if notification exists and belongs to the user
        const notification = await prisma.notification.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!notification) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 },
            );
        }

        if (notification.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete the notification
        await prisma.notification.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to dismiss notification:", error);
        return NextResponse.json(
            { error: "Failed to dismiss notification" },
            { status: 500 },
        );
    }
}
