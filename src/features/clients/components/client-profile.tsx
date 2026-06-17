"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Edit, Mail, MapPin, Phone } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientForm } from "@/features/clients/components/client-form";
import type { ClientWithCases } from "@/types";

type CaseSummary = {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  createdAt: Date;
};

type ClientProfileProps = {
  client: ClientWithCases & { _count?: { cases: number } };
  cases: CaseSummary[];
  casesPagination: PaginationMeta;
};

export function ClientProfile({
  client,
  cases,
  casesPagination,
}: ClientProfileProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={`${client.firstName} ${client.lastName}`}
        description={client.companyName ?? client.email}
        actions={
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="outline">
              {client.clientType === "CORPORATE" ? "Corporate" : "Individual"}
            </Badge>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>{client.address}</span>
                </div>
              )}
            </div>
            {client.notes && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium">Notes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {client.notes}
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Client since {formatDate(client.createdAt)}
            </p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="cases">
            <TabsList>
              <TabsTrigger value="cases">
                Cases ({client._count?.cases ?? casesPagination.total})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cases" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-0">
                  {!cases.length ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      No cases for this client yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case Number</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cases.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <Link
                                href={`/cases/${c.id}`}
                                className="font-medium hover:underline"
                              >
                                {c.caseNumber}
                              </Link>
                            </TableCell>
                            <TableCell>{c.title}</TableCell>
                            <TableCell>
                              <StatusBadge status={c.status} type="case" />
                            </TableCell>
                            <TableCell>{formatDate(c.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              {cases.length > 0 && (
                <Suspense fallback={<LoadingSpinner size="sm" />}>
                  <PaginationControls {...casesPagination} />
                </Suspense>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ClientForm
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
      />
    </>
  );
}
