// ============================================================
// app/api/notifications/route.ts
// ------------------------------------------------------------
// Notification endpoints:
//   GET /api/notifications
//     Headers: Authorization: Bearer <token>
//     Query: ?limit=20&offset=0&unread=true
//     Response: { notifications: [...], unreadCount: number }
//
//   POST /api/notifications/read
//     Body: { notificationIds: string[] }
//     Response: { success: true }
//
//   POST /api/notifications/read-all
//     Response: { success: true }
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

// GET: Fetch notifications for current user
export async function GET(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unread") === "true";

    const where: any = { userId: auth.userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId: auth.userId, isRead: false },
      }),
    ]);

    return NextResponse.json(
      {
        notifications,
        unreadCount,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Mark notifications as read
export async function POST(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "read-all") {
      await prisma.notification.updateMany({
        where: { userId: auth.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "read" && body.notificationIds) {
      await prisma.notification.updateMany({
        where: {
          id: { in: body.notificationIds },
          userId: auth.userId,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete all notifications
export async function DELETE(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.deleteMany({
      where: { userId: auth.userId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
