import {
  getChartData,
  getDashboardStats,
  getRecentActivities,
} from "@/actions/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCards } from "@/features/dashboard/components/stats-cards";
import { RecentActivities } from "@/features/dashboard/components/recent-activities";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";

export default async function DashboardPage() {
  const [statsResult, activitiesResult, chartResult] = await Promise.all([
    getDashboardStats(),
    getRecentActivities(10),
    getChartData(),
  ]);

  const stats = statsResult.success
    ? statsResult.data!
    : {
        totalClients: 0,
        activeCases: 0,
        upcomingHearings: 0,
        outstandingInvoices: 0,
        tasksDueToday: 0,
      };

  const activities = activitiesResult.success ? activitiesResult.data! : [];
  const chartData = chartResult.success
    ? chartResult.data!
    : { casesByStatus: [], revenueByMonth: [], tasksByPriority: [] };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your law firm operations"
      />

      <StatsCards stats={stats} />

      <DashboardCharts data={chartData} />

      <RecentActivities activities={activities} />
    </div>
  );
}
