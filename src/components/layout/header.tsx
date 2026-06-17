"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { LogOut, Menu, Moon, Search, Sun, User } from "lucide-react";
import { UserRole } from "@prisma/client";
import { cn, getInitials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";
import { BackdropLoader } from "@/components/shared/backdrop-loader";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
};

type HeaderProps = {
  user: HeaderUser;
  onMenuClick?: () => void;
  className?: string;
};

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-lg"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function Header({ user, onMenuClick, className }: HeaderProps) {
  const initials = getInitials(user.firstName, user.lastName);
  const fullName = `${user.firstName} ${user.lastName}`;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <BackdropLoader open={isLoggingOut} label="Signing out..." />
      <header
      className={cn(
        "glass-panel flex h-[4.25rem] shrink-0 items-center justify-between px-4 lg:px-6",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
        <Breadcrumbs className="hidden sm:flex" />
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-9 w-9 rounded-lg sm:flex"
          disabled
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Search</span>
        </Button>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative ml-1 h-10 gap-2.5 rounded-lg px-2 hover:bg-accent"
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-none">{fullName}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold">{fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}
