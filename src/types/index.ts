export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ClientWithCases = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  clientType: "INDIVIDUAL" | "CORPORATE";
  notes: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { cases: number };
};

export type DashboardStats = {
  totalClients: number;
  activeCases: number;
  upcomingHearings: number;
  outstandingInvoices: number;
  tasksDueToday: number;
};

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  permission?: string;
};
