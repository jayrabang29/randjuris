import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

type BackdropLoaderProps = {
  open: boolean;
  label?: string;
  className?: string;
};

export function BackdropLoader({
  open,
  label = "Loading...",
  className,
}: BackdropLoaderProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm",
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-8 py-6 shadow-lg">
        <LoadingSpinner size="lg" label={label} />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
