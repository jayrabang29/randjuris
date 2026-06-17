"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Download, Eye, FileText } from "lucide-react";
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
import { CaseNotes } from "@/features/cases/components/case-notes";
import { CaseTimeline } from "@/features/cases/components/case-timeline";

type CaseDetailProps = {
  caseData: {
    id: string;
    caseNumber: string;
    title: string;
    description: string | null;
    category: string;
    status: string;
    courtName: string | null;
    filingDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    client: { id: string; firstName: string; lastName: string; email: string };
    assignments: {
      isLead: boolean;
      user: { firstName: string; lastName: string; email: string };
    }[];
  };
  documents: {
    id: string;
    fileName: string;
    category: { name: string };
    fileSize: number;
    createdAt: Date;
  }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
  }[];
  notes: { id: string; content: string; createdAt: Date; createdBy: string }[];
  timelineEvents: {
    id: string;
    type: "activity" | "note" | "event";
    title: string;
    description?: string | null;
    timestamp: Date;
    icon?: "gavel" | "note" | "calendar" | "file";
  }[];
  documentsPagination: PaginationMeta;
  tasksPagination: PaginationMeta;
  notesPagination: PaginationMeta;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CaseDetail({
  caseData,
  documents,
  tasks,
  notes,
  timelineEvents,
  documentsPagination,
  tasksPagination,
  notesPagination,
}: CaseDetailProps) {
  return (
    <>
      <PageHeader
        title={caseData.title}
        description={caseData.caseNumber}
        actions={<StatusBadge status={caseData.status} type="case" />}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documentsPagination.total})
          </TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasksPagination.total})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notesPagination.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">
                    {caseData.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                {caseData.courtName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Court</span>
                    <span>{caseData.courtName}</span>
                  </div>
                )}
                {caseData.filingDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filing Date</span>
                    <span>{formatDate(caseData.filingDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(caseData.createdAt)}</span>
                </div>
                {caseData.description && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground">Description</p>
                    <p className="mt-1">{caseData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Client</p>
                  <Link
                    href={`/clients/${caseData.client.id}`}
                    className="hover:underline"
                  >
                    {caseData.client.firstName} {caseData.client.lastName}
                  </Link>
                  <p className="text-muted-foreground">{caseData.client.email}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Assigned Lawyers
                  </p>
                  {caseData.assignments.length === 0 ? (
                    <p className="text-muted-foreground">None assigned</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {caseData.assignments.map((a, i) => (
                        <li key={i}>
                          {a.user.firstName} {a.user.lastName}
                          {a.isLead && (
                            <Badge variant="secondary" className="ml-2">
                              Lead
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {documents.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No documents uploaded for this case.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.fileName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {doc.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={`/api/documents/${doc.id}/preview`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={`/api/documents/${doc.id}/download`}>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {documents.length > 0 && (
            <Suspense fallback={<LoadingSpinner size="sm" />}>
              <PaginationControls
                {...documentsPagination}
                pageParam="docPage"
              />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No tasks for this case.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} type="task" />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? formatDate(task.dueDate) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {tasks.length > 0 && (
            <Suspense fallback={<LoadingSpinner size="sm" />}>
              <PaginationControls {...tasksPagination} pageParam="taskPage" />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <CaseTimeline events={timelineEvents} />
        </TabsContent>

        <TabsContent value="notes">
          <CaseNotes
            caseId={caseData.id}
            notes={notes}
            pagination={notesPagination}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
