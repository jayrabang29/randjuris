import { getPermissionsMatrix } from "@/actions/permissions";
import { PermissionsPageContent } from "@/features/permissions/components/permissions-page-content";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function PermissionsPage() {
  await requirePermission(PERMISSIONS.settings.manage);

  const result = await getPermissionsMatrix();
  const pages = result.success
    ? result.data!.pages
    : { pages: [], items: [], roles: [], access: {} };
  const scopes = result.success
    ? result.data!.scopes
    : { items: [], roles: [], access: {} };

  return (
    <PermissionsPageContent initialPages={pages} initialScopes={scopes} />
  );
}
