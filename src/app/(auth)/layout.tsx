import {
  Briefcase,
  Calendar,
  FileText,
  Scale,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";

const MODULES = [
  { icon: Users, label: "Client Management" },
  { icon: Briefcase, label: "Case Tracking" },
  { icon: FileText, label: "Document Control" },
  { icon: Calendar, label: "Hearings & Calendar" },
];

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: "Enterprise-grade security",
    description: "Role-based access, audit logs, and secure sessions.",
  },
  {
    icon: Zap,
    title: "Built for modern firms",
    description: "Manage cases, billing, tasks, and teams in one place.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — login form */}
      <div className="auth-gradient flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between px-6 py-6 lg:px-12">
          <Link href="/login" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold leading-tight">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12 lg:px-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <div className="px-6 pb-6 text-center text-xs text-muted-foreground lg:px-12 lg:text-left">
          © 2026 {APP_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right panel — content */}
      <div className="relative hidden w-1/2 overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-bl from-sidebar via-sidebar to-sidebar-primary/25" />
        <div className="absolute -left-16 top-1/4 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-sidebar-primary/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            {APP_TAGLINE}
          </p>
        </div>

        <div className="relative space-y-10">
          <div>
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-sidebar-foreground xl:text-5xl">
              Run your practice
              <br />
              <span className="text-gold">smarter & faster.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-sidebar-foreground/65">
              From client intake to case closure — streamline operations,
              billing, documents, and team collaboration on a single secure
              platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MODULES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-sidebar-border/50 bg-sidebar-accent/40 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/20">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <span className="text-sm font-medium text-sidebar-foreground/90">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-sidebar-foreground">{title}</p>
                  <p className="mt-1 text-sm text-sidebar-foreground/55">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-8 border-t border-sidebar-border/50 pt-8">
            {[
              { value: "7", label: "User roles" },
              { value: "10+", label: "Core modules" },
              { value: "24/7", label: "Secure access" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-gold">{stat.value}</p>
                <p className="text-xs text-sidebar-foreground/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-sidebar-foreground/40">
          Trusted by legal teams for case, client, and billing management.
        </p>
      </div>
    </div>
  );
}
