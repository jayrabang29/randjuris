import { AppShell } from "@/components/layout/app-shell";
import { PermissionsProvider } from "@/components/providers/permissions-provider";
import { getPermissionsForRole } from "@/lib/permission-store";
import { requireAuth } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const permissions = await getPermissionsForRole(user.role);

  return (
    <PermissionsProvider role={user.role} permissions={permissions}>
      <AppShell
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        }}
      >
        {children}
      </AppShell>
    </PermissionsProvider>
  );
}
