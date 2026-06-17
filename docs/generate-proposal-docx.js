#!/usr/bin/env node
/**
 * Generates a minimal .docx (Office Open XML) without external dependencies.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "RandJuris-Proposal.docx");

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function para(text, opts = {}) {
  const { bold, size = 22, spacing = 120, center } = opts;
  const align = center ? '<w:jc w:val="center"/>' : "";
  const rPr = bold
    ? `<w:rPr><w:b/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>`
    : `<w:rPr><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>`;
  return `<w:p><w:pPr>${align}<w:spacing w:after="${spacing}"/></w:pPr><w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function heading(text, level = 1) {
  const size = level === 1 ? 32 : 26;
  return `<w:p><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:color w:val="0F2744"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="80"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function tableRow(cells, header = false) {
  const tcs = cells
    .map((c) => {
      const rPr = header
        ? `<w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr>`
        : `<w:rPr><w:sz w:val="20"/></w:rPr>`;
      const shd = header
        ? `<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F2744"/></w:tcPr>`
        : "";
      return `<w:tc>${shd}<w:p><w:r>${rPr}<w:t>${esc(c)}</w:t></w:r></w:p></w:tc>`;
    })
    .join("");
  return `<w:tr>${tcs}</w:tr>`;
}

function table(rows) {
  const body = rows.map((r, i) => tableRow(r, i === 0)).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${body}</w:tbl>`;
}

const body = [
  para("CONFIDENTIAL — PROJECT PROPOSAL", { bold: true, size: 18, spacing: 60 }),
  para(""),
  heading("RandJuris"),
  para(
    "A modern, secure, and integrated platform to streamline legal practice operations — from client intake to case closure, billing, and compliance.",
    { size: 24, spacing: 200 }
  ),
  para(""),
  table([
    ["Prepared By", "RANDTEK IT Solution", "Version", "1.0"],
    ["Date", "June 2025", "Status", "Phase 1 Delivered"],
    ["Prepared For", "Law Firm Stakeholders", "Project Code", "randjuris"],
  ]),
  para(""),
  heading("1. Executive Summary"),
  para(
    "RANDTEK IT Solution proposes RandJuris — a comprehensive web-based platform designed specifically for law firms operating in the Philippines and similar jurisdictions. The system centralizes client management, case tracking, document storage, task coordination, calendar scheduling, billing in Philippine Peso (₱), and audit logging into a single secure environment."
  ),
  para(
    "Key Value Proposition: Replace fragmented spreadsheets, email threads, and paper-based workflows with a unified digital platform that improves productivity, reduces errors, strengthens client service, and provides full visibility into firm operations.",
    { bold: true }
  ),
  para(
    "Phase 1 of the platform has been developed and is operational, delivering ten core modules with enterprise-grade authentication, seven distinct user roles, and a modern responsive interface."
  ),
  heading("2. Background & Problem Statement"),
  heading("Industry Challenges", 2),
  ...[
    "Disconnected data across multiple tools with no single source of truth",
    "Manual billing inefficiency leading to revenue leakage",
    "Document management risk without version control or access logs",
    "Poor team coordination on tasks, deadlines, and court appearances",
    "Compliance gaps with limited audit trails",
    "Scalability limits as informal processes break down",
  ].map(bullet),
  heading("3. Proposed Solution"),
  ...[
    "Cloud-ready web application accessible from any modern browser",
    "Role-based access control (RBAC) with seven predefined user roles",
    "End-to-end case lifecycle management from intake to closure",
    "Integrated time tracking and invoicing in Philippine Peso (₱)",
    "Secure document upload, preview, and download per case",
    "Shared calendar for hearings, meetings, and deadlines",
    "Real-time in-app notifications and activity audit logs",
    "Server-side pagination across all data listings",
    "Modern, professional UI designed for legal professionals",
  ].map(bullet),
  heading("4. Core Features & Modules"),
  ...[
    "Dashboard — KPIs, charts, recent activity feed",
    "Client Management — Individual/corporate clients, search, profiles",
    "Case Management — Categories, status, assignments, notes, timeline",
    "Document Management — Upload, categorize, preview, download",
    "Task Management — Priorities, due dates, list and Kanban views",
    "Calendar & Events — Hearings, meetings, deadlines, reminders",
    "Billing & Invoicing — Time entries, invoices in ₱, payment recording",
    "Notifications — In-app alerts with read/unread tracking",
    "Activity Logs — Full audit trail with pagination",
    "Authentication — Secure login, password reset flows",
  ].map(bullet),
  heading("5. User Roles & Access Control"),
  table([
    ["Role", "Description", "Key Permissions"],
    ["Super Admin", "System administrator", "Full access to all modules"],
    ["Managing Partner", "Firm leadership", "All modules; user read; activity logs"],
    ["Lawyer", "Attorney / counsel", "Clients, cases, documents, tasks, calendar, billing"],
    ["Paralegal", "Legal support", "Cases, documents, tasks, calendar"],
    ["Secretary", "Administrative staff", "Clients, calendar, tasks"],
    ["Accountant", "Finance / billing", "Billing full access; read-only clients/cases"],
    ["Client", "External portal", "Limited read access to own cases and invoices"],
  ]),
  heading("6. Security & Compliance"),
  ...[
    "Bcrypt password hashing with complexity enforcement",
    "Secure server-side sessions via NextAuth v5",
    "Permission validation on every server action",
    "Comprehensive activity auditing",
    "Zod schema validation on all inputs",
    "Authenticated document API routes",
    "Role-based data isolation",
  ].map(bullet),
  heading("7. Technology Architecture"),
  para(
    "Stack: Next.js 15, React 19, TypeScript, MySQL, Prisma ORM, NextAuth v5, Tailwind CSS, shadcn/ui, TanStack Table, React Hook Form, Zod, Recharts"
  ),
  table([
    ["Layer", "Technology", "Purpose"],
    ["Frontend", "Next.js App Router, React 19", "Responsive UI"],
    ["Backend", "Server Actions, API Routes", "Business logic"],
    ["Database", "MySQL + Prisma ORM", "Relational data with migrations"],
    ["Authentication", "NextAuth v5, bcryptjs", "Secure sessions"],
    ["Deployment", "Node.js 18+", "Vercel / VPS ready"],
  ]),
  heading("8. User Interface & Experience"),
  ...[
    "Professional navy and gold theme",
    "Plus Jakarta Sans typography",
    "Responsive sidebar navigation",
    "Searchable tables with server-side pagination",
    "Dashboard charts and status badges",
    "Philippine Peso (₱) formatting throughout",
  ].map(bullet),
  heading("9. Deliverables & Current Status"),
  para("Phase 1 development is complete and delivered:"),
  table([
    ["Deliverable", "Status"],
    ["Authentication & RBAC (7 roles)", "Complete"],
    ["Dashboard, Clients, Cases, Documents", "Complete"],
    ["Tasks (List + Kanban), Calendar", "Complete"],
    ["Billing (₱), Notifications, Activity Logs", "Complete"],
    ["Server-side pagination on all listings", "Complete"],
    ["Demo data & admin account", "Complete"],
  ]),
  heading("10. Implementation Roadmap"),
  para("Phase 1 — Core Platform (Delivered): All ten modules, RBAC, UI, database, pagination.", { bold: true }),
  para("Phase 2 — Production Deployment: Cloud hosting, SSL, domain, training, backups."),
  para("Phase 3 — Enhanced Features: User management, email notifications, PDF invoices, reporting."),
  para("Phase 4 — Integrations: Payment gateway, SMS, calendar sync, multi-branch support."),
  heading("11. Investment Overview"),
  para("Investment based on Philippine market rates for custom enterprise web applications of comparable scope. Pricing may adjust for multi-branch deployment or additional integrations."),
  table([
    ["Item", "Description", "Amount (PHP)"],
    ["Phase 1 — Development", "Full platform as delivered (10 modules, RBAC, UI)", "1,250,000.00"],
    ["Phase 2 — Deployment", "Production setup, SSL, domain, training (1 session)", "125,000.00"],
    ["Annual Maintenance", "Updates, bug fixes, security patches, support", "187,500.00 / year"],
    ["Phase 3 Enhancements", "Email alerts, PDF invoices, user mgmt, reporting", "350,000.00 – 750,000.00"],
  ]),
  heading("Phase 1 — Development Payment Schedule", 2),
  para("Total Phase 1 investment of PHP 1,250,000.00 is payable in four (4) terms:"),
  table([
    ["Term", "Milestone", "%", "Amount (PHP)"],
    ["1st Payment", "Upon contract signing and project kickoff", "15%", "187,500.00"],
    ["2nd Payment", "Upon delivery of core modules (Auth, Clients, Cases, Dashboard)", "15%", "187,500.00"],
    ["3rd Payment", "Upon delivery of remaining modules (Documents, Tasks, Calendar, Billing)", "30%", "375,000.00"],
    ["4th Payment", "Upon Phase 1 final acceptance and handover", "40%", "500,000.00"],
    ["Total Phase 1", "", "100%", "1,250,000.00"],
  ]),
  para("Phase 2 is invoiced in full (PHP 125,000.00) upon production deployment. Annual maintenance (PHP 187,500.00) is billed annually in advance.", { size: 20 }),
  heading("12. Support & Maintenance"),
  ...[
    "Priority bug fixes for core workflows",
    "Security and dependency updates",
    "Automated daily database backups",
    "Email/ticket support during business hours",
    "Database schema and deployment documentation",
  ].map(bullet),
  heading("13. Conclusion"),
  para(
    "RandJuris delivers a production-ready foundation for digitizing legal practice operations. RANDTEK IT Solution is prepared to proceed with deployment, training, and phased enhancements."
  ),
  heading("14. Acceptance & Sign-Off"),
  para("By signing below, both parties acknowledge review of this proposal and agreement to proceed."),
  para(""),
  table([
    ["For RANDTEK IT Solution", "For the Client / Law Firm"],
    ["Authorized Signature & Date", "Authorized Signature & Date"],
    ["Name: _______________________", "Name: _______________________"],
    ["Title: Project Lead", "Title: _______________________"],
  ]),
  para(""),
  para("RANDTEK IT Solution | RandJuris | Proposal v1.0 | June 2025", {
    center: true,
    size: 18,
    spacing: 0,
  }),
].join("");

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1260" w:bottom="1440" w:left="1260"/></w:sectPr></w:body>
</w:document>`;

const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/><w:qFormat/>
    <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/>
  </w:style>
</w:styles>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

// Minimal ZIP writer (store only, no compression — Word accepts it)
function crc32(buf) {
  let c = 0xffffffff;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function createZip(files) {
  const parts = [];
  const central = [];
  let offset = 0;

  for (const [name, data] of files) {
    const buf = Buffer.from(data, "utf8");
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(buf);
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(buf.length, 18);
    local.writeUInt32LE(buf.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    const centralHdr = Buffer.alloc(46 + nameBuf.length);
    centralHdr.writeUInt32LE(0x02014b50, 0);
    centralHdr.writeUInt16LE(20, 4);
    centralHdr.writeUInt16LE(20, 6);
    centralHdr.writeUInt16LE(0, 8);
    centralHdr.writeUInt16LE(0, 10);
    centralHdr.writeUInt16LE(0, 12);
    centralHdr.writeUInt16LE(0, 14);
    centralHdr.writeUInt32LE(crc, 16);
    centralHdr.writeUInt32LE(buf.length, 20);
    centralHdr.writeUInt32LE(buf.length, 24);
    centralHdr.writeUInt16LE(nameBuf.length, 28);
    centralHdr.writeUInt16LE(0, 30);
    centralHdr.writeUInt16LE(0, 32);
    centralHdr.writeUInt16LE(0, 34);
    centralHdr.writeUInt16LE(0, 36);
    centralHdr.writeUInt32LE(0, 38);
    centralHdr.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHdr, 46);

    parts.push(local, buf);
    central.push(centralHdr);
    offset += local.length + buf.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...parts, centralBuf, end]);
}

const zip = createZip([
  ["[Content_Types].xml", contentTypes],
  ["_rels/.rels", rels],
  ["word/document.xml", documentXml],
  ["word/styles.xml", stylesXml],
  ["word/numbering.xml", numberingXml],
  ["word/_rels/document.xml.rels", docRels],
]);

fs.writeFileSync(OUT, zip);
console.log(`Created: ${OUT} (${zip.length} bytes)`);
