import { getTimeEntries, getInvoices } from "@/actions/billing";
import { getCases } from "@/actions/cases";
import { getClients } from "@/actions/clients";
import { PageHeader } from "@/components/shared/page-header";
import { TimeEntryForm } from "@/features/billing/components/time-entry-form";
import { InvoiceForm } from "@/features/billing/components/invoice-form";
import { BillingTabs } from "@/features/billing/components/billing-tabs";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import { canViewAllBilling } from "@/lib/billing-access";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import prisma from "@/lib/prisma";

type SearchParams = Promise<{
  tab?: string;
  page?: string;
  pageSize?: string;
}>;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePermission(PERMISSIONS.billing.read);
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);
  const tab = params.tab === "invoices" ? "invoices" : "time-entries";

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      teamId: true,
      team: { select: { name: true } },
    },
  });

  const billingScope = canViewAllBilling({
    id: user.id,
    role: user.role,
    teamId: dbUser?.teamId ?? null,
    permissions: user.permissions,
  });

  const billingDescription = billingScope
    ? "Manage firm-wide time entries and invoices"
    : dbUser?.team?.name
      ? `Showing billing for team: ${dbUser.team.name}`
      : "Showing your billing records only";

  const [timeResult, invoiceResult, casesResult, clientsResult] =
    await Promise.all([
      getTimeEntries({ page, pageSize }),
      getInvoices({ page, pageSize }),
      getCases({ pageSize: 100 }),
      getClients({ pageSize: 100 }),
    ]);

  const timeEntries = timeResult.success ? timeResult.data!.data : [];
  const invoices = invoiceResult.success ? invoiceResult.data!.data : [];
  const timePagination = toPaginationMeta(
    timeResult.success ? timeResult.data : undefined
  );
  const invoicePagination = toPaginationMeta(
    invoiceResult.success ? invoiceResult.data : undefined
  );
  const cases = casesResult.success
    ? casesResult.data!.data.map((c) => ({
        id: c.id,
        label: `${c.caseNumber} — ${c.title}`,
      }))
    : [];
  const clients = clientsResult.success
    ? clientsResult.data!.data.map((c) => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}`,
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Billing"
        description={billingDescription}
        actions={
          <div className="flex gap-2">
            <TimeEntryForm cases={cases} />
            <InvoiceForm clients={clients} />
          </div>
        }
      />
      <BillingTabs
        activeTab={tab}
        timeEntries={timeEntries}
        invoices={invoices}
        timePagination={timePagination}
        invoicePagination={invoicePagination}
      />
    </div>
  );
}
