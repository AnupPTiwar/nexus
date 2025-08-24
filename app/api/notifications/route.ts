import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationWhereInput } from "@/prisma/generated/models";

// Query parameters validation
const notificationQuerySchema = z.object({
    types: z.array(z.enum(["SUCCESS", "ERROR", "WARNING", "INFO"])).optional(),
    resourceTypes: z
        .array(
            z.enum([
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
            ]),
        )
        .optional(),
    isRead: z.boolean().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
});

// GET /api/notifications - Get notifications for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const queryParams = {
            types: searchParams.getAll("types") || undefined,
            resourceTypes: searchParams.getAll("resourceTypes") || undefined,
            isRead: searchParams.get("isRead")
                ? searchParams.get("isRead") === "true"
                : undefined,
            dateFrom: searchParams.get("dateFrom") || undefined,
            dateTo: searchParams.get("dateTo") || undefined,
            limit: searchParams.get("limit")
                ? Number(searchParams.get("limit"))
                : 25,
            offset: searchParams.get("offset")
                ? Number(searchParams.get("offset"))
                : 0,
        };

        const validation = notificationQuerySchema.safeParse(queryParams);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Invalid query parameters",
                    details: validation.error.issues,
                },
                { status: 400 },
            );
        }

        const {
            types,
            resourceTypes,
            isRead,
            dateFrom,
            dateTo,
            limit,
            offset,
        } = validation.data;

        // Build where clause
        const whereClause: NotificationWhereInput = {
            userId: session.user.id,
        };

        if (types?.length) {
            whereClause.type = { in: types };
        }

        if (resourceTypes?.length) {
            whereClause.resourceType = { in: resourceTypes };
        }

        if (isRead !== undefined) {
            whereClause.isRead = isRead;
        }

        if (dateFrom || dateTo) {
            whereClause.createdAt = {};
            if (dateFrom) {
                whereClause.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                whereClause.createdAt.lte = new Date(dateTo);
            }
        }

        // Get notifications with count
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.notification.count({ where: whereClause }),
        ]);

        const hasMore = (offset || 0) + (limit || 25) < total;

        return NextResponse.json({
            notifications,
            total,
            hasMore,
        });
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 },
        );
    }
}

// DELETE /api/notifications - Dismiss all notifications for the authenticated user
export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        await prisma.notification.deleteMany({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to dismiss all notifications:", error);
        return NextResponse.json(
            { error: "Failed to dismiss all notifications" },
            { status: 500 },
        );
    }
}
