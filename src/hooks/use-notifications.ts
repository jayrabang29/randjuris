"use client";

import { create } from "zustand";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsState = {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = (await response.json()) as NotificationItem[];
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.isRead).length,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load notifications",
        isLoading: false,
      });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update notification",
      });
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      const notifications = get().notifications.map((n) => ({
        ...n,
        isRead: true,
      }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update notifications",
      });
    }
  },
}));
