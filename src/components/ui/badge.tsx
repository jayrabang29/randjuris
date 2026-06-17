import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
        {
          "border-transparent bg-primary/10 text-primary":
            variant === "default",
          "border-transparent bg-secondary text-secondary-foreground":
            variant === "secondary",
          "border-transparent bg-destructive/10 text-destructive":
            variant === "destructive",
          "border-border/60 text-foreground": variant === "outline",
          "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400":
            variant === "success",
          "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400":
            variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
