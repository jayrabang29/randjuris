"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotifications();
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              const content = (
                <NotificationContent notification={notification} />
              );

              const handleClick = () => {
                if (!notification.isRead) {
                  markAsRead(notification.id);
                }
              };

              if (notification.link) {
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className="cursor-pointer flex-col items-start gap-1 p-3"
                    asChild
                  >
                    <Link href={notification.link} onClick={handleClick}>
                      {content}
                    </Link>
                  </DropdownMenuItem>
                );
              }

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer flex-col items-start gap-1 p-3"
                  onClick={handleClick}
                >
                  {content}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationContent({
  notification,
}: {
  notification: {
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  };
}) {
  return (
    <>
      <div className="flex w-full items-start justify-between gap-2">
        <p
          className={
            notification.isRead
              ? "text-sm text-muted-foreground"
              : "text-sm font-medium"
          }
        >
          {notification.title}
        </p>
        {!notification.isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">
        {notification.message}
      </p>
      <p className="text-xs text-muted-foreground/70">
        {formatDateTime(notification.createdAt)}
      </p>
    </>
  );
}
