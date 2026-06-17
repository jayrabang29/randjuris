"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/pagination";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { updateInvoiceStatus } from "@/actions/billing";

type TimeEntryRow = {
  id: string;
  hours: unknown;
  rate: unknown;
  date: Date;
  notes: string | null;
  case: { caseNumber: string; title: string };
  user: { firstName: string; lastName: string };
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: unknown;
  dueDate: Date;
  client: { firstName: string; lastName: string };
};

type BillingTabsProps = {
  activeTab: "time-entries" | "invoices";
  timeEntries: TimeEntryRow[];
  invoices: InvoiceRow[];
  timePagination: PaginationMeta;
  invoicePagination: PaginationMeta;
};

export function BillingTabs({
  activeTab,
  timeEntries,
  invoices,
  timePagination,
  invoicePagination,
}: BillingTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  async function handleStatusChange(invoiceId: string, status: string) {
    await updateInvoiceStatus({
      invoiceId,
      status: status as "DRAFT" | "SENT" | "PAID" | "OVERDUE",
    });
    router.refresh();
  }

  const timeColumns: ColumnDef<TimeEntryRow>[] = [
    {
      id: "case",
      header: "Case",
      cell: ({ row }) => row.original.case.caseNumber,
    },
    {
      id: "user",
      header: "Lawyer",
      cell: ({ row }) =>
        `${row.original.user.firstName} ${row.original.user.lastName}`,
    },
    {
      accessorKey: "hours",
      header: "Hours",
      cell: ({ row }) => Number(row.original.hours).toFixed(2),
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }) => formatCurrency(Number(row.original.rate)),
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) =>
        formatCurrency(
          Number(row.original.hours) * Number(row.original.rate)
        ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => row.original.notes ?? "—",
    },
  ];

  const invoiceColumns: ColumnDef<InvoiceRow>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.invoiceNumber}</span>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: ({ row }) =>
        `${row.original.client.firstName} ${row.original.client.lastName}`,
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(Number(row.original.totalAmount)),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} type="invoice" />
      ),
    },
    {
      id: "actions",
      header: "Update Status",
      cell: ({ row }) => (
        <SearchableSelect
          value={row.original.status}
          onValueChange={(v) => handleStatusChange(row.original.id, v)}
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "SENT", label: "Sent" },
            { value: "PAID", label: "Paid" },
            { value: "OVERDUE", label: "Overdue" },
          ]}
          searchPlaceholder="Search status..."
          className="w-[130px]"
        />
      ),
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={switchTab}>
      <TabsList>
        <TabsTrigger value="time-entries">
          Time Entries ({timePagination.total})
        </TabsTrigger>
        <TabsTrigger value="invoices">
          Invoices ({invoicePagination.total})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="time-entries" className="mt-4">
        <DataTable
          columns={timeColumns}
          data={timeEntries}
          emptyMessage="No time entries recorded."
          serverPagination={timePagination}
          hideSearch
        />
      </TabsContent>
      <TabsContent value="invoices" className="mt-4">
        <DataTable
          columns={invoiceColumns}
          data={invoices}
          searchKey="invoiceNumber"
          searchPlaceholder="Search invoices..."
          emptyMessage="No invoices found."
          serverPagination={invoicePagination}
        />
      </TabsContent>
    </Tabs>
  );
}
