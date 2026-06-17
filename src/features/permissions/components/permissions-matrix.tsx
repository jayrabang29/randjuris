"use client";

import { UserRole } from "@prisma/client";
import type { PageAccessMatrix, PermissionMatrix } from "@/lib/permission-store";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PermissionsMatrixProps = {
  title: string;
  description?: string;
  matrix: PageAccessMatrix | PermissionMatrix;
  disabled?: boolean;
  onToggle: (role: UserRole, permissionId: string, enabled: boolean) => void;
  roleLabels: Record<UserRole, string>;
  showDescriptions?: boolean;
};

export function PermissionsMatrix({
  title,
  description,
  matrix,
  disabled = false,
  onToggle,
  roleLabels,
  showDescriptions = false,
}: PermissionsMatrixProps) {
  const items = "pages" in matrix ? matrix.pages : matrix.items;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No permissions are configured yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Permission</TableHead>
            {matrix.roles.map((role) => (
              <TableHead key={role} className="min-w-[120px] text-center">
                {roleLabels[role]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.permissionId}>
              <TableCell>
                <div className="font-medium">{item.label}</div>
                {showDescriptions && item.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </TableCell>
              {matrix.roles.map((role) => {
                const enabled = matrix.access[item.permissionId]?.[role] ?? false;

                return (
                  <TableCell key={`${item.permissionId}-${role}`}>
                    <div className="flex justify-center">
                      <Switch
                        checked={enabled}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          onToggle(role, item.permissionId, checked)
                        }
                        aria-label={`${item.label} for ${roleLabels[role]}`}
                      />
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
