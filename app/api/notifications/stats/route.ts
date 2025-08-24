import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications/stats - Get notification statistics for the authenticated user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [
            total,
            unread,
            byType,
            byResourceType,
        ] = await Promise.all([
            prisma.notification.count({
                where: { userId: session.user.id },
            }),
            prisma.notification.count({
                where: { userId: session.user.id, isRead: false },
            }),
            prisma.notification.groupBy({
                by: ['type'],
                where: { userId: session.user.id },
                _count: { type: true },
            }),
            prisma.notification.groupBy({
                by: ['resourceType'],
                where: { userId: session.user.id },
                _count: { resourceType: true },
            }),
        ]);

        const stats = {
            total,
            unread,
            byType: byType.reduce((acc, item) => {
                if (item.type) {
                    acc[item.type] = item._count.type;
                }
                return acc;
            }, {} as Record<string, number>),
            byResourceType: byResourceType.reduce((acc, item) => {
                if (item.resourceType) {
                    acc[item.resourceType] = item._count.resourceType;
                }
                return acc;
            }, {} as Record<string, number>),
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Failed to fetch notification stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch notification stats" },
            { status: 500 }
        );
    }
}