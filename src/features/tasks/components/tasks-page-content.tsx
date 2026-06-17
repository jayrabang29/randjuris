"use client";

import { useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import type { TaskInput } from "@/validators";
import type { PaginationMeta } from "@/lib/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskForm } from "@/features/tasks/components/task-form";
import { TaskTable } from "@/features/tasks/components/task-table";
import { TaskBoard } from "@/features/tasks/components/task-board";

type CaseOption = { id: string; label: string };

type TasksPageContentProps = {
  tasks: Parameters<typeof TaskTable>[0]["tasks"];
  cases: CaseOption[];
  pagination: PaginationMeta;
  userTeamId: string | null;
  userTeamName?: string | null;
};

export function TasksPageContent({
  tasks,
  cases,
  pagination,
  userTeamId,
  userTeamName,
}: TasksPageContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<
    (TaskInput & { id: string }) | null
  >(null);

  const formOpen = createOpen || !!editingTask;

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setCreateOpen(false);
      setEditingTask(null);
    }
  }

  function handleEdit(task: TaskInput & { id: string }) {
    setCreateOpen(false);
    setEditingTask(task);
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Track and manage firm tasks"
        actions={
          <Button
            onClick={() => {
              setEditingTask(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        }
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="board" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Board
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <TaskTable tasks={tasks} pagination={pagination} onEdit={handleEdit} />
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <TaskBoard tasks={tasks} onEdit={handleEdit} />
        </TabsContent>
      </Tabs>

      <TaskForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        cases={cases}
        userTeamId={userTeamId}
        userTeamName={userTeamName}
        initialData={editingTask ?? undefined}
      />
    </>
  );
}
