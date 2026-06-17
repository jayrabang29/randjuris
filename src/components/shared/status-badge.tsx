import {
  CaseStatus,
  InvoiceStatus,
  TaskStatus,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "case" | "task" | "invoice";

type StatusBadgeProps = {
  status: CaseStatus | TaskStatus | InvoiceStatus | string;
  type?: StatusType;
  className?: string;
};

type StatusConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
};

const CASE_STATUS_MAP: Record<CaseStatus, StatusConfig> = {
  NEW: { label: "New", variant: "secondary" },
  ACTIVE: { label: "Active", variant: "default" },
  PENDING: { label: "Pending", variant: "warning" },
  IN_COURT: { label: "In Court", variant: "default" },
  SETTLED: { label: "Settled", variant: "success" },
  CLOSED: { label: "Closed", variant: "outline" },
};

const TASK_STATUS_MAP: Record<TaskStatus, StatusConfig> = {
  TODO: { label: "To Do", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
};

const INVOICE_STATUS_MAP: Record<InvoiceStatus, StatusConfig> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SENT: { label: "Sent", variant: "default" },
  PAID: { label: "Paid", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
};

function getStatusConfig(
  status: string,
  type?: StatusType
): StatusConfig {
  if (type === "case" && status in CASE_STATUS_MAP) {
    return CASE_STATUS_MAP[status as CaseStatus];
  }
  if (type === "task" && status in TASK_STATUS_MAP) {
    return TASK_STATUS_MAP[status as TaskStatus];
  }
  if (type === "invoice" && status in INVOICE_STATUS_MAP) {
    return INVOICE_STATUS_MAP[status as InvoiceStatus];
  }

  const allMaps: Record<string, StatusConfig>[] = [
    CASE_STATUS_MAP,
    TASK_STATUS_MAP,
    INVOICE_STATUS_MAP,
  ];
  for (const map of allMaps) {
    if (status in map) {
      return map[status];
    }
  }

  return {
    label: status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" "),
    variant: "outline",
  };
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const config = getStatusConfig(status, type);

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
