import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  companyName: z.string().max(200).optional().nullable(),
  email: z.string().email("Invalid email"),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  clientType: z.enum(["INDIVIDUAL", "CORPORATE"]),
  notes: z.string().max(5000).optional().nullable(),
});

export const caseSchema = z.object({
  caseNumber: z.string().min(1).max(50),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  category: z.enum([
    "CIVIL",
    "CRIMINAL",
    "CORPORATE",
    "FAMILY",
    "REAL_ESTATE",
    "INTELLECTUAL_PROPERTY",
    "LABOR",
    "TAX",
    "OTHER",
  ]),
  courtName: z.string().max(200).optional().nullable(),
  filingDate: z.string().optional().nullable(),
  status: z.enum(["NEW", "ACTIVE", "PENDING", "IN_COURT", "SETTLED", "CLOSED"]),
  clientId: z.string().min(1, "Client is required"),
  lawyerIds: z.array(z.string()).optional(),
  visibility: z.enum(["GENERAL", "TEAM"]).optional().default("GENERAL"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().optional().nullable(),
  caseId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  visibility: z.enum(["GENERAL", "TEAM"]).optional().default("GENERAL"),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(["HEARING", "MEETING", "COURT_APPEARANCE", "DEADLINE", "REMINDER"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().max(200).optional().nullable(),
  isAllDay: z.boolean().optional(),
  caseId: z.string().optional().nullable(),
  reminderMinutes: z.number().optional().nullable(),
  visibility: z.enum(["GENERAL", "TEAM"]).optional().default("GENERAL"),
});

export const timeEntrySchema = z.object({
  caseId: z.string().min(1, "Case is required"),
  hours: z.coerce.number().positive("Hours must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
  notes: z.string().max(1000).optional().nullable(),
  date: z.string().optional(),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().max(2000).optional().nullable(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().positive(),
        caseId: z.string().optional().nullable(),
        timeEntryId: z.string().optional().nullable(),
      })
    )
    .min(1, "At least one item is required"),
});

export const caseNoteSchema = z.object({
  caseId: z.string().min(1),
  content: z.string().min(1, "Note content is required").max(5000),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export const clientFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  clientType: z.enum(["INDIVIDUAL", "CORPORATE"]).optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
});

export const caseFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z
    .enum(["NEW", "ACTIVE", "PENDING", "IN_COURT", "SETTLED", "CLOSED"])
    .optional(),
  category: z
    .enum([
      "CIVIL",
      "CRIMINAL",
      "CORPORATE",
      "FAMILY",
      "REAL_ESTATE",
      "INTELLECTUAL_PROPERTY",
      "LABOR",
      "TAX",
      "OTHER",
    ])
    .optional(),
  clientId: z.string().optional(),
});

export const assignLawyersSchema = z.object({
  caseId: z.string().min(1),
  lawyerIds: z.array(z.string()).min(1, "At least one lawyer is required"),
  leadLawyerId: z.string().optional(),
});

export const documentFilterSchema = paginationSchema.extend({
  caseId: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
});

export const documentUploadSchema = z.object({
  caseId: z.string().min(1, "Case is required"),
  categoryId: z.string().min(1, "Category is required"),
  visibility: z.enum(["GENERAL", "TEAM"]).optional().default("GENERAL"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Use uppercase letters, numbers, and underscores"),
  description: z.string().max(500).optional().nullable(),
});

export const categoryFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const taskFilterSchema = paginationSchema.extend({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().optional(),
  caseId: z.string().optional(),
});

export const eventFilterSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  caseId: z.string().optional(),
});

export const invoiceFilterSchema = paginationSchema.extend({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]).optional(),
  clientId: z.string().optional(),
});

export const timeEntryFilterSchema = paginationSchema.extend({
  caseId: z.string().optional(),
  userId: z.string().optional(),
});

export const activityLogFilterSchema = paginationSchema.extend({});

export const caseNoteFilterSchema = paginationSchema.extend({
  caseId: z.string().min(1),
});

const userRoleSchema = z.enum([
  "SUPER_ADMIN",
  "MANAGING_PARTNER",
  "LAWYER",
  "PARALEGAL",
  "SECRETARY",
  "ACCOUNTANT",
  "CLIENT",
]);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number");

export const createUserSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Invalid email"),
    phone: z.string().max(20).optional().nullable(),
    role: userRoleSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm the password"),
    teamId: z.string().optional().nullable(),
    legalServiceIds: z.array(z.string()).optional().default([]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email"),
  phone: z.string().max(20).optional().nullable(),
  role: userRoleSchema,
  password: passwordSchema.optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  teamId: z.string().optional().nullable(),
  legalServiceIds: z.array(z.string()).optional(),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Invalid email"),
    phone: z.string().max(20).optional().nullable(),
    currentPassword: z.string().optional(),
    newPassword: passwordSchema.optional().or(z.literal("")),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      const changingPassword = Boolean(data.newPassword || data.currentPassword);
      if (!changingPassword) {
        return true;
      }
      return Boolean(data.currentPassword && data.newPassword);
    },
    {
      message: "Current password is required to set a new password",
      path: ["currentPassword"],
    }
  )
  .refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const teamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const teamFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const addTeamMemberSchema = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
});

export const updateUserLegalServicesSchema = z.object({
  userId: z.string().min(1),
  legalServiceIds: z.array(z.string()),
});

export const legalServiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const legalServiceFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const userFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  role: userRoleSchema.optional(),
  status: z.enum(["active", "inactive", "all"]).optional().default("all"),
});

export const updateInvoiceStatusSchema = z.object({
  invoiceId: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.string().max(50).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  paymentDate: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type CaseInput = z.infer<typeof caseSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type LegalServiceInput = z.infer<typeof legalServiceSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
