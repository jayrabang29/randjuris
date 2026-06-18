"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail } from "lucide-react";
import { login } from "@/actions/auth";
import { normalizeCallbackUrl } from "@/lib/url";
import { loginSchema, type LoginInput } from "@/validators";
import { BackdropLoader } from "@/components/shared/backdrop-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground shadow-soft">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = normalizeCallbackUrl(
    searchParams.get("callbackUrl") || "/dashboard"
  );
  const urlError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    urlError === "unauthorized"
      ? "You do not have access to that page."
      : urlError
        ? "Your session expired. Please sign in again."
        : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setError(null);
    setIsLoading(true);

    const loginTimeoutMs = 30_000;

    try {
      const result = await Promise.race([
        login(data, callbackUrl),
        new Promise<{ success: false; error: string }>((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: false,
                error:
                  "Login timed out. The server may be unable to reach the database.",
              }),
            loginTimeoutMs
          )
        ),
      ]);

      setIsLoading(false);
      setError(result.error ?? "Login failed");
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      setIsLoading(false);
      setError("Login failed");
    }
  }

  return (
    <div className="w-full">
      <BackdropLoader open={isLoading} label="Signing in..." />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to access your law firm portal
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="email"
              type="email"
              placeholder="admin@randtek.com"
              autoComplete="email"
              className="h-11 pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-11 pl-10"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full text-base"
          size="lg"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Protected by enterprise-grade security and role-based access
        </p>
      </form>

      {/* <div className="mt-8 rounded-xl border border-dashed border-border/60 bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground">Demo account</p>
        <p className="mt-1 text-sm">
          <span className="font-medium">admin@randtek.com</span>
          <span className="text-muted-foreground"> · Password: </span>
          <span className="font-mono text-xs">Password123!</span>
        </p>
      </div> */}
    </div>
  );
}
