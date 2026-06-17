"use client";

import Link from "next/link";
import type { LegalServiceItem } from "@/actions/legal-services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LegalServicesPanelProps = {
  legalServices: LegalServiceItem[];
  canManage: boolean;
};

export function LegalServicesPanel({
  legalServices,
  canManage,
}: LegalServicesPanelProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Legal Services</CardTitle>
          <CardDescription>
            Practice areas assigned to team members
          </CardDescription>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/legal-services">Manage Services</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {legalServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No legal services configured yet.{" "}
            {canManage && (
              <Link
                href="/legal-services"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Add your first service
              </Link>
            )}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {legalServices.map((service) => (
              <Badge key={service.id} variant="secondary" className="px-3 py-1">
                {service.name}
                {service._count ? (
                  <span className="ml-2 text-muted-foreground">
                    ({service._count.users})
                  </span>
                ) : null}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
