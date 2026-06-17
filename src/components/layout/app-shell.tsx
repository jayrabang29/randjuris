"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

type AppShellUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
};

type AppShellProps = {
  user: AppShellUser;
  children: React.ReactNode;
  className?: string;
};

export function AppShell({ user, children, className }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", className)}>
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 animate-in slide-in-from-left duration-300 lg:hidden">
            <Sidebar
              onNavigate={closeMobile}
              onClose={closeMobile}
            />
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="mesh-bg flex-1 overflow-y-auto scrollbar-thin">
          <div className="animate-fade-in p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
