import {
  Briefcase,
  Calendar,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import type { DashboardStats } from "@/types";
import { cn } from "@/lib/utils";

type StatsCardsProps = {
  stats: DashboardStats;
};

const statConfig = [
  {
    key: "totalClients" as const,
    title: "Total Clients",
    icon: Users,
    gradient: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    accent: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "activeCases" as const,
    title: "Active Cases",
    icon: Briefcase,
    gradient: "from-indigo-500/20 to-indigo-600/5",
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    accent: "text-indigo-600 dark:text-indigo-400",
  },
  {
    key: "upcomingHearings" as const,
    title: "Upcoming Hearings",
    icon: Calendar,
    gradient: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    accent: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "outstandingInvoices" as const,
    title: "Outstanding Invoices",
    icon: DollarSign,
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "tasksDueToday" as const,
    title: "Tasks Due Today",
    icon: CheckSquare,
    gradient: "from-rose-500/20 to-rose-600/5",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    accent: "text-rose-600 dark:text-rose-400",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {statConfig.map(({ key, title, icon: Icon, gradient, iconBg, accent }) => (
        <div key={key} className="stat-card group">
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100",
              gradient
            )}
          />
          <div className="relative p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-[13px] font-medium text-muted-foreground">
                  {title}
                </p>
                <p className="text-3xl font-bold tracking-tight">
                  {stats[key]}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  iconBg
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className={cn("h-3 w-3", accent)} />
              <span>Live data</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
