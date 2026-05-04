// ============================================================
// lib/repositories/notification.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Notification Repository
// ============================================================

import { prisma } from "@/lib/prisma";

export const notificationRepository = {
  // Create a new notification
  create: (data: {
    userId: string;
    type: string;
    target: "VENDOR" | "ADMIN" | "USER";
    title: string;
    message: string;
    data?: any;
  }) =>
    prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        target: data.target,
        title: data.title,
        message: data.message,
        data: data.data || undefined,
      },
    }),

  // Get notifications for a user
  findByUserId: (
    userId: string,
    options?: { limit?: number; offset?: number },
  ) =>
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),

  // Get unread notification count
  countUnread: (userId: string) =>
    prisma.notification.count({
      where: { userId, isRead: false },
    }),

  // Mark notification as read
  markAsRead: (id: string) =>
    prisma.notification.update({
      where: { id },
      data: { isRead: true },
    }),

  // Mark all notifications as read for a user
  markAllAsRead: (userId: string) =>
    prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    }),

  // Get notifications by target (for Admin)
  findByTarget: (
    target: "VENDOR" | "ADMIN" | "USER",
    options?: { limit?: number; offset?: number },
  ) =>
    prisma.notification.findMany({
      where: { target },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),

  // Delete old notifications (cleanup)
  deleteOld: (daysOld: number) =>
    prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000),
        },
        isRead: true,
      },
    }),
};
