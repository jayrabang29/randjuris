import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedPermissionsFromDefaults } from "../src/lib/permission-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.category.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.caseAssignment.deleteMany();
  await prisma.case.deleteMany();
  await prisma.client.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.userLegalService.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.legalService.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@randtek.com",
        passwordHash,
        firstName: "System",
        lastName: "Admin",
        role: UserRole.SUPER_ADMIN,
        phone: "+1-555-0100",
      },
    }),
    prisma.user.create({
      data: {
        email: "partner@randtek.com",
        passwordHash,
        firstName: "James",
        lastName: "Mitchell",
        role: UserRole.MANAGING_PARTNER,
        phone: "+1-555-0101",
      },
    }),
    prisma.user.create({
      data: {
        email: "lawyer1@randtek.com",
        passwordHash,
        firstName: "Sarah",
        lastName: "Chen",
        role: UserRole.LAWYER,
        phone: "+1-555-0102",
      },
    }),
    prisma.user.create({
      data: {
        email: "lawyer2@randtek.com",
        passwordHash,
        firstName: "Michael",
        lastName: "Rodriguez",
        role: UserRole.LAWYER,
        phone: "+1-555-0103",
      },
    }),
    prisma.user.create({
      data: {
        email: "paralegal@randtek.com",
        passwordHash,
        firstName: "Emily",
        lastName: "Johnson",
        role: UserRole.PARALEGAL,
        phone: "+1-555-0104",
      },
    }),
    prisma.user.create({
      data: {
        email: "secretary@randtek.com",
        passwordHash,
        firstName: "Lisa",
        lastName: "Thompson",
        role: UserRole.SECRETARY,
        phone: "+1-555-0105",
      },
    }),
    prisma.user.create({
      data: {
        email: "accountant@randtek.com",
        passwordHash,
        firstName: "David",
        lastName: "Kim",
        role: UserRole.ACCOUNTANT,
        phone: "+1-555-0106",
      },
    }),
  ]);

  const [admin, partner, lawyer1, lawyer2, paralegal] = users;

  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: "Litigation",
        description: "Civil and criminal litigation matters",
      },
    }),
    prisma.team.create({
      data: {
        name: "Corporate",
        description: "Corporate and commercial law",
      },
    }),
  ]);

  await prisma.user.update({
    where: { id: lawyer1.id },
    data: { teamId: teams[0].id },
  });
  await prisma.user.update({
    where: { id: lawyer2.id },
    data: { teamId: teams[0].id },
  });
  await prisma.user.update({
    where: { id: paralegal.id },
    data: { teamId: teams[1].id },
  });

  const legalServices = await Promise.all([
    prisma.legalService.create({ data: { name: "Insurance" } }),
    prisma.legalService.create({ data: { name: "Criminal Law" } }),
    prisma.legalService.create({ data: { name: "Business Law" } }),
    prisma.legalService.create({ data: { name: "Election Contest" } }),
    prisma.legalService.create({
      data: { name: "Labor and Employment Law" },
    }),
    prisma.legalService.create({ data: { name: "Data Privacy" } }),
  ]);

  const [
    insurance,
    criminalLaw,
    businessLaw,
    electionContest,
    laborLaw,
    dataPrivacy,
  ] = legalServices;

  await prisma.userLegalService.createMany({
    data: [
      { userId: lawyer1.id, legalServiceId: criminalLaw.id },
      { userId: lawyer1.id, legalServiceId: insurance.id },
      { userId: lawyer2.id, legalServiceId: businessLaw.id },
      { userId: lawyer2.id, legalServiceId: electionContest.id },
      { userId: paralegal.id, legalServiceId: laborLaw.id },
      { userId: paralegal.id, legalServiceId: dataPrivacy.id },
    ],
  });

  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Pleading", code: "PLEADING" },
    }),
    prisma.category.create({
      data: { name: "Evidence", code: "EVIDENCE" },
    }),
    prisma.category.create({
      data: { name: "Correspondence", code: "CORRESPONDENCE" },
    }),
    prisma.category.create({
      data: { name: "Contract", code: "CONTRACT" },
    }),
    prisma.category.create({
      data: { name: "Court Order", code: "COURT_ORDER" },
    }),
    prisma.category.create({
      data: { name: "Research", code: "RESEARCH" },
    }),
    prisma.category.create({
      data: { name: "Other", code: "OTHER" },
    }),
  ]);

  // Create permissions
  const modules = [
    "dashboard", "clients", "cases", "documents", "tasks",
    "calendar", "billing", "users", "teams", "settings", "activity_logs",
  ];
  const actions = ["create", "read", "update", "delete", "manage"];

  for (const module of modules) {
    for (const action of actions) {
      await prisma.permission.create({
        data: {
          name: `${module}:${action}`,
          module,
          action,
          description: `${action} ${module}`,
        },
      });
    }
  }

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        firstName: "Robert",
        lastName: "Anderson",
        email: "robert.anderson@email.com",
        phone: "+1-555-1001",
        address: "123 Main St, New York, NY 10001",
        clientType: "INDIVIDUAL",
        notes: "Referred by existing client",
      },
    }),
    prisma.client.create({
      data: {
        firstName: "Jennifer",
        lastName: "Williams",
        companyName: "Williams Tech Inc.",
        email: "j.williams@williamstech.com",
        phone: "+1-555-1002",
        address: "456 Tech Blvd, San Francisco, CA 94102",
        clientType: "CORPORATE",
        notes: "Corporate litigation client",
      },
    }),
    prisma.client.create({
      data: {
        firstName: "Thomas",
        lastName: "Martinez",
        email: "t.martinez@email.com",
        phone: "+1-555-1003",
        address: "789 Oak Ave, Chicago, IL 60601",
        clientType: "INDIVIDUAL",
      },
    }),
    prisma.client.create({
      data: {
        firstName: "Patricia",
        lastName: "Brown",
        companyName: "Brown Real Estate LLC",
        email: "p.brown@brownrealestate.com",
        phone: "+1-555-1004",
        address: "321 Property Lane, Miami, FL 33101",
        clientType: "CORPORATE",
      },
    }),
    prisma.client.create({
      data: {
        firstName: "William",
        lastName: "Davis",
        email: "w.davis@email.com",
        phone: "+1-555-1005",
        address: "654 Pine St, Boston, MA 02101",
        clientType: "INDIVIDUAL",
        notes: "Family law matter",
      },
    }),
  ]);

  // Create cases
  const cases = await Promise.all([
    prisma.case.create({
      data: {
        caseNumber: "CASE-2026-0001",
        title: "Anderson vs. City of New York",
        description: "Personal injury claim arising from sidewalk accident",
        category: "CIVIL",
        courtName: "Supreme Court of New York",
        filingDate: new Date("2026-01-15"),
        status: "ACTIVE",
        clientId: clients[0].id,
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: "CASE-2026-0002",
        title: "Williams Tech IP Dispute",
        description: "Patent infringement litigation against competitor",
        category: "INTELLECTUAL_PROPERTY",
        courtName: "US District Court, N.D. California",
        filingDate: new Date("2026-02-01"),
        status: "IN_COURT",
        clientId: clients[1].id,
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: "CASE-2026-0003",
        title: "Martinez Criminal Defense",
        description: "Defense against white collar crime charges",
        category: "CRIMINAL",
        courtName: "Cook County Circuit Court",
        filingDate: new Date("2026-01-20"),
        status: "ACTIVE",
        clientId: clients[2].id,
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: "CASE-2026-0004",
        title: "Brown Real Estate Acquisition",
        description: "Commercial property acquisition and due diligence",
        category: "REAL_ESTATE",
        courtName: "Miami-Dade County Court",
        filingDate: new Date("2026-02-10"),
        status: "PENDING",
        clientId: clients[3].id,
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: "CASE-2026-0005",
        title: "Davis Divorce Proceedings",
        description: "Contested divorce with child custody matters",
        category: "FAMILY",
        courtName: "Suffolk Probate and Family Court",
        filingDate: new Date("2026-01-05"),
        status: "ACTIVE",
        clientId: clients[4].id,
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: "CASE-2026-0006",
        title: "Williams Tech Employment Matter",
        description: "Wrongful termination defense",
        category: "LABOR",
        filingDate: new Date("2026-03-01"),
        status: "NEW",
        clientId: clients[1].id,
      },
    }),
  ]);

  // Assign lawyers to cases
  const assignments = [
    { caseId: cases[0].id, userId: lawyer1.id, isLead: true },
    { caseId: cases[0].id, userId: lawyer2.id, isLead: false },
    { caseId: cases[1].id, userId: lawyer1.id, isLead: true },
    { caseId: cases[2].id, userId: lawyer2.id, isLead: true },
    { caseId: cases[3].id, userId: lawyer1.id, isLead: true },
    { caseId: cases[4].id, userId: lawyer2.id, isLead: true },
    { caseId: cases[5].id, userId: lawyer1.id, isLead: true },
  ];

  for (const assignment of assignments) {
    await prisma.caseAssignment.create({ data: assignment });
  }

  // Create case notes
  await prisma.caseNote.createMany({
    data: [
      { caseId: cases[0].id, content: "Initial client meeting completed. Gathered incident details and witness statements.", createdBy: lawyer1.id },
      { caseId: cases[0].id, content: "Filed complaint with the court. Awaiting response from defendant.", createdBy: lawyer1.id },
      { caseId: cases[1].id, content: "Prior art search completed. Strong case for patent validity.", createdBy: lawyer1.id },
      { caseId: cases[2].id, content: "Discovery phase initiated. Requesting financial records.", createdBy: lawyer2.id },
    ],
  });

  // Create tasks
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.task.createMany({
    data: [
      { title: "Prepare motion for summary judgment", description: "Draft and review MSJ for Anderson case", status: "IN_PROGRESS", priority: "HIGH", dueDate: nextWeek, caseId: cases[0].id, assigneeId: lawyer1.id, createdById: partner.id },
      { title: "Review patent documentation", status: "TODO", priority: "CRITICAL", dueDate: tomorrow, caseId: cases[1].id, assigneeId: paralegal.id, createdById: lawyer1.id },
      { title: "Schedule client meeting", status: "TODO", priority: "MEDIUM", dueDate: tomorrow, caseId: cases[2].id, assigneeId: lawyer2.id, createdById: partner.id },
      { title: "File property title search", status: "IN_PROGRESS", priority: "HIGH", caseId: cases[3].id, assigneeId: paralegal.id, createdById: lawyer1.id },
      { title: "Prepare custody evaluation request", status: "TODO", priority: "HIGH", dueDate: nextWeek, caseId: cases[4].id, assigneeId: lawyer2.id, createdById: lawyer2.id },
      { title: "Update case management system", status: "COMPLETED", priority: "LOW", assigneeId: paralegal.id, createdById: admin.id, completedAt: new Date() },
    ],
  });

  // Create events
  const today = new Date();
  const hearingDate = new Date();
  hearingDate.setDate(hearingDate.getDate() + 3);

  await prisma.event.createMany({
    data: [
      { title: "Anderson Case - Pre-trial Conference", type: "HEARING", startTime: hearingDate, endTime: new Date(hearingDate.getTime() + 2 * 60 * 60 * 1000), location: "Supreme Court Room 401", caseId: cases[0].id, userId: lawyer1.id },
      { title: "Williams Tech - Strategy Meeting", type: "MEETING", startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000), endTime: new Date(today.getTime() + 25 * 60 * 60 * 1000), location: "Conference Room A", caseId: cases[1].id, userId: lawyer1.id },
      { title: "Martinez - Court Appearance", type: "COURT_APPEARANCE", startTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), endTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), location: "Cook County Courthouse", caseId: cases[2].id, userId: lawyer2.id },
      { title: "Team Weekly Standup", type: "MEETING", startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), endTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), location: "Conference Room B", userId: partner.id },
    ],
  });

  // Create time entries
  await prisma.timeEntry.createMany({
    data: [
      { caseId: cases[0].id, userId: lawyer1.id, hours: 3.5, rate: 350, notes: "Drafted motion for summary judgment", date: new Date("2026-06-01") },
      { caseId: cases[0].id, userId: lawyer1.id, hours: 2.0, rate: 350, notes: "Client consultation", date: new Date("2026-06-02") },
      { caseId: cases[1].id, userId: lawyer1.id, hours: 5.0, rate: 350, notes: "Patent analysis and prior art review", date: new Date("2026-06-03") },
      { caseId: cases[2].id, userId: lawyer2.id, hours: 4.0, rate: 325, notes: "Discovery document review", date: new Date("2026-06-04") },
      { caseId: cases[4].id, userId: lawyer2.id, hours: 2.5, rate: 325, notes: "Custody evaluation preparation", date: new Date("2026-06-05") },
    ],
  });

  // Create invoices
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0001",
      clientId: clients[0].id,
      amount: 1925,
      taxAmount: 0,
      totalAmount: 1925,
      dueDate,
      status: "SENT",
      sentAt: new Date(),
      items: {
        create: [
          { description: "Legal services - Motion drafting (3.5 hrs @ ₱350)", quantity: 3.5, unitPrice: 350, amount: 1225, caseId: cases[0].id },
          { description: "Legal services - Client consultation (2 hrs @ ₱350)", quantity: 2, unitPrice: 350, amount: 700, caseId: cases[0].id },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0002",
      clientId: clients[1].id,
      amount: 1750,
      taxAmount: 0,
      totalAmount: 1750,
      dueDate: new Date(dueDate.getTime() - 15 * 24 * 60 * 60 * 1000),
      status: "OVERDUE",
      sentAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { description: "Legal services - Patent analysis (5 hrs @ ₱350)", quantity: 5, unitPrice: 350, amount: 1750, caseId: cases[1].id },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0003",
      clientId: clients[2].id,
      amount: 1300,
      taxAmount: 0,
      totalAmount: 1300,
      dueDate,
      status: "DRAFT",
      items: {
        create: [
          { description: "Legal services - Discovery review (4 hrs @ ₱325)", quantity: 4, unitPrice: 325, amount: 1300, caseId: cases[2].id },
        ],
      },
    },
  });

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, action: "USER_LOGIN", entity: "User", entityId: admin.id, details: "Admin logged in", ipAddress: "127.0.0.1" },
      { userId: lawyer1.id, action: "CASE_CREATED", entity: "Case", entityId: cases[0].id, details: "Created case CASE-2026-0001", ipAddress: "192.168.1.10" },
      { userId: lawyer1.id, action: "CASE_UPDATED", entity: "Case", entityId: cases[0].id, details: "Updated case status to ACTIVE", ipAddress: "192.168.1.10" },
      { userId: paralegal.id, action: "DOCUMENT_UPLOADED", entity: "Document", details: "Uploaded complaint.pdf", ipAddress: "192.168.1.15" },
      { userId: partner.id, action: "INVOICE_SENT", entity: "Invoice", entityId: invoice1.id, details: "Sent invoice INV-2026-0001", ipAddress: "192.168.1.5" },
    ],
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      { userId: lawyer1.id, type: "HEARING_REMINDER", title: "Upcoming Hearing", message: "Anderson Case pre-trial conference in 3 days", link: "/calendar" },
      { userId: lawyer1.id, type: "TASK_DEADLINE", title: "Task Due Tomorrow", message: "Review patent documentation is due tomorrow", link: "/tasks" },
      { userId: lawyer2.id, type: "CASE_ASSIGNMENT", title: "New Case Assignment", message: "You have been assigned to Martinez Criminal Defense", link: `/cases/${cases[2].id}` },
      { userId: partner.id, type: "INVOICE_DUE", title: "Overdue Invoice", message: "Invoice INV-2026-0002 for Williams Tech is overdue", link: "/billing" },
      { userId: paralegal.id, type: "TASK_DEADLINE", title: "Task Due Tomorrow", message: "Review patent documentation is due tomorrow", link: "/tasks" },
    ],
  });

  console.log("✅ Database seeded successfully!");
  await seedPermissionsFromDefaults();
  console.log("\n📋 Demo Accounts (password: Password123!):");
  console.log("  admin@randtek.com       - Super Admin");
  console.log("  partner@randtek.com     - Managing Partner");
  console.log("  lawyer1@randtek.com     - Lawyer");
  console.log("  lawyer2@randtek.com     - Lawyer");
  console.log("  paralegal@randtek.com   - Paralegal");
  console.log("  secretary@randtek.com   - Secretary");
  console.log("  accountant@randtek.com  - Accountant");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
