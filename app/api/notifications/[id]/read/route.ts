import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: { id: string };
}

// POST /api/notifications/[id]/read - Mark a notification as read
export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        // Check if notification exists and belongs to the user
        const notification = await prisma.notification.findUnique({
            where: { id },
            select: { userId: true, isRead: true },
        });

        if (!notification) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            );
        }

        if (notification.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Only update if not already read
        if (!notification.isRead) {
            await prisma.notification.update({
                where: { id },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return NextResponse.json(
            { error: "Failed to mark notification as read" },
            { status: 500 }
        );
    }
}