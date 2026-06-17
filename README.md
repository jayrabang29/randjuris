# RandJuris

Legal practice management platform built with Next.js 15, TypeScript, MySQL, Prisma, and NextAuth.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** MySQL with Prisma ORM
- **Authentication:** NextAuth.js (Auth.js v5)
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **State:** Zustand (client notifications)
- **Charts:** Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Push database schema
npm run db:push

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts

All accounts use password: `Password123!`

| Email | Role |
|-------|------|
| admin@randtek.com | Super Admin |
| partner@randtek.com | Managing Partner |
| lawyer1@randtek.com | Lawyer |
| lawyer2@randtek.com | Lawyer |
| paralegal@randtek.com | Paralegal |
| secretary@randtek.com | Secretary |
| accountant@randtek.com | Accountant |

## Modules

- **Authentication & RBAC** - Login, logout, password reset, role-based access
- **Dashboard** - Stats, charts, recent activities
- **Client Management** - CRUD, search, filter, archive
- **Case Management** - Cases, assignments, notes, timeline
- **Document Management** - Upload, download, preview, versioning
- **Task Management** - Tasks with priorities and due dates
- **Calendar** - Hearings, meetings, court appearances
- **Billing** - Time tracking, invoicing, payments
- **Activity Logs** - Audit trail for critical actions
- **Notifications** - In-app notifications
- **User Management** - Staff accounts, roles, and access control

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── actions/          # Server Actions
├── components/       # Shared UI components
├── features/         # Feature-based modules
├── hooks/            # Custom React hooks
├── lib/              # Core utilities
├── types/            # TypeScript types
├── validators/       # Zod schemas
└── prisma/           # Database schema & seed
```

## Database

See [docs/DATABASE.md](docs/DATABASE.md) for the entity relationship diagram.

## Security

- Input validation with Zod on all server actions
- bcrypt password hashing
- JWT session management
- Role-based route protection via middleware
- Activity audit logging
- SQL injection protection via Prisma ORM

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## License

Proprietary - RandJuris © 2026
