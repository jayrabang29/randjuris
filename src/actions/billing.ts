"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity, createNotification } from "@/lib/activity";
import {
  buildInvoiceAccessWhere,
  buildTimeEntryAccessWhere,
  canAccessInvoice,
  type BillingAccessUser,
} from "@/lib/billing-access";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import {
  invoiceFilterSchema,
  invoiceSchema,
  recordPaymentSchema,
  timeEntryFilterSchema,
  timeEntrySchema,
  updateInvoiceStatusSchema,
  type InvoiceInput,
  type TimeEntryInput,
} from "@/validators";
import type { ActionResult, PaginatedResult } from "@/types";
import type { Invoice, InvoiceStatus, TimeEntry } from "@prisma/client";

type TimeEntryWithRelations = Omit<TimeEntry, "hours" | "rate"> & {
  hours: number;
  rate: number;
  case: { id: string; caseNumber: string; title: string };
  user: { id: string; firstName: string; lastName: string };
};

type SerializedInvoice = Omit<Invoice, "amount" | "taxAmount" | "totalAmount"> & {
  amount: number;
  taxAmount: number;
  totalAmount: number;
};

type InvoiceWithRelations = SerializedInvoice & {
  client: { id: string; firstName: string; lastName: string; email: string };
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  _count: { payments: number };
};

async function getBillingAccessUser(userId: string, permissions: string[]) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, role: true, teamId: true },
  });

  return {
    ...user,
    permissions,
  } satisfies BillingAccessUser;
}
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const latest = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  const nextNum = latest
    ? parseInt(latest.invoiceNumber.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function getTimeEntries(
  params: {
    caseId?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ActionResult<PaginatedResult<TimeEntryWithRelations>>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.billing.read);
    const accessUser = await getBillingAccessUser(
      sessionUser.id,
      sessionUser.permissions
    );

    const parsed = timeEntryFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { caseId, userId, page, pageSize } = parsed.data;
    const accessWhere = await buildTimeEntryAccessWhere(accessUser);
    const where = {
      ...accessWhere,
      ...(caseId ? { caseId } : {}),
      ...(userId ? { userId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          case: { select: { id: true, caseNumber: true, title: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.timeEntry.count({ where }),
    ]);

    const serialized = {
      data: data.map((entry) => ({
        ...entry,
        hours: entry.hours.toNumber(),
        rate: entry.rate.toNumber(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch time entries" };
  }
}

export async function createTimeEntry(
  data: TimeEntryInput
): Promise<ActionResult<TimeEntry>> {
  try {
    const user = await requirePermission(PERMISSIONS.billing.create);

    const parsed = timeEntrySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id: parsed.data.caseId },
    });

    if (!caseRecord) {
      return { success: false, error: "Case not found" };
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        caseId: parsed.data.caseId,
        userId: user.id,
        hours: parsed.data.hours,
        rate: parsed.data.rate,
        notes: parsed.data.notes,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      },
    });

    await logActivity({
      userId: user.id,
      action: "TIME_ENTRY_CREATED",
      entity: "TimeEntry",
      entityId: timeEntry.id,
      details: `Logged ${parsed.data.hours} hours on case ${caseRecord.caseNumber}`,
    });

    return { success: true, data: timeEntry };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create time entry" };
  }
}

export async function getInvoices(
  params: {
    status?: InvoiceStatus;
    clientId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ActionResult<PaginatedResult<InvoiceWithRelations>>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.billing.read);
    const accessUser = await getBillingAccessUser(
      sessionUser.id,
      sessionUser.permissions
    );

    const parsed = invoiceFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { status, clientId, page, pageSize } = parsed.data;
    const accessWhere = await buildInvoiceAccessWhere(accessUser);
    const where = {
      ...accessWhere,
      ...(status ? { status } : {}),
      ...(clientId ? { clientId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              amount: true,
            },
          },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    const serialized = {
      data: data.map((invoice) => ({
        ...invoice,
        amount: invoice.amount.toNumber(),
        taxAmount: invoice.taxAmount.toNumber(),
        totalAmount: invoice.totalAmount.toNumber(),
        items: invoice.items.map((item) => ({
          ...item,
          quantity: item.quantity.toNumber(),
          unitPrice: item.unitPrice.toNumber(),
          amount: item.amount.toNumber(),
        })),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch invoices" };
  }
}

export async function createInvoice(
  data: InvoiceInput
): Promise<ActionResult<Invoice>> {
  try {
    const user = await requirePermission(PERMISSIONS.billing.create);

    const parsed = invoiceSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, isArchived: false },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    const items = parsed.data.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      caseId: item.caseId,
      timeEntryId: item.timeEntryId,
    }));

    const amount = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = 0;
    const totalAmount = amount + taxAmount;
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: parsed.data.clientId,
        amount,
        taxAmount,
        totalAmount,
        dueDate: new Date(parsed.data.dueDate),
        notes: parsed.data.notes,
        items: { create: items },
      },
    });

    await logActivity({
      userId: user.id,
      action: "INVOICE_CREATED",
      entity: "Invoice",
      entityId: invoice.id,
      details: `Created invoice ${invoiceNumber} for ${client.firstName} ${client.lastName}`,
    });

    return { success: true, data: invoice };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create invoice" };
  }
}

export async function updateInvoiceStatus(data: {
  invoiceId: string;
  status: InvoiceStatus;
}): Promise<ActionResult<Invoice>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.billing.update);
    const accessUser = await getBillingAccessUser(
      sessionUser.id,
      sessionUser.permissions
    );

    const parsed = updateInvoiceStatusSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const hasAccess = await canAccessInvoice(
      accessUser,
      parsed.data.invoiceId
    );
    if (!hasAccess) {
      return { success: false, error: "You do not have access to this invoice" };
    }

    const existing = await prisma.invoice.findUnique({
      where: { id: parsed.data.invoiceId },
    });

    if (!existing) {
      return { success: false, error: "Invoice not found" };
    }

    const updateData: {
      status: InvoiceStatus;
      sentAt?: Date;
      paidAt?: Date;
    } = { status: parsed.data.status };

    if (parsed.data.status === "SENT" && !existing.sentAt) {
      updateData.sentAt = new Date();
    }

    if (parsed.data.status === "PAID" && !existing.paidAt) {
      updateData.paidAt = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: parsed.data.invoiceId },
      data: updateData,
    });

    await logActivity({
      userId: sessionUser.id,
      action: "INVOICE_STATUS_UPDATED",
      entity: "Invoice",
      entityId: invoice.id,
      details: `Updated invoice ${invoice.invoiceNumber} status to ${parsed.data.status}`,
    });

    if (parsed.data.status === "SENT") {
      const client = await prisma.client.findUnique({
        where: { id: existing.clientId },
        select: { email: true },
      });

      if (client) {
        const clientUser = await prisma.user.findFirst({
          where: { role: "CLIENT", email: client.email },
          select: { id: true },
        });

        if (clientUser) {
          await createNotification({
            userId: clientUser.id,
            type: "INVOICE_DUE",
            title: "New Invoice",
            message: `Invoice ${invoice.invoiceNumber} has been sent`,
            link: `/billing/invoices/${invoice.id}`,
          });
        }
      }
    }

    return { success: true, data: invoice };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update invoice status" };
  }
}

export async function recordPayment(data: {
  invoiceId: string;
  amount: number;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  paymentDate?: string;
}): Promise<ActionResult> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.billing.update);
    const accessUser = await getBillingAccessUser(
      sessionUser.id,
      sessionUser.permissions
    );

    const parsed = recordPaymentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const hasAccess = await canAccessInvoice(
      accessUser,
      parsed.data.invoiceId
    );
    if (!hasAccess) {
      return { success: false, error: "You do not have access to this invoice" };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: parsed.data.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    const totalPaid =
      invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) +
      parsed.data.amount;

    if (totalPaid > Number(invoice.totalAmount)) {
      return { success: false, error: "Payment exceeds invoice total" };
    }

    await prisma.payment.create({
      data: {
        invoiceId: parsed.data.invoiceId,
        amount: parsed.data.amount,
        paymentMethod: parsed.data.paymentMethod,
        reference: parsed.data.reference,
        notes: parsed.data.notes,
        paymentDate: parsed.data.paymentDate
          ? new Date(parsed.data.paymentDate)
          : new Date(),
      },
    });

    if (totalPaid >= Number(invoice.totalAmount)) {
      await prisma.invoice.update({
        where: { id: parsed.data.invoiceId },
        data: { status: "PAID", paidAt: new Date() },
      });
    }

    await logActivity({
      userId: sessionUser.id,
      action: "PAYMENT_RECORDED",
      entity: "Payment",
      entityId: parsed.data.invoiceId,
      details: `Recorded payment of ${parsed.data.amount} for invoice ${invoice.invoiceNumber}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to record payment" };
  }
}
