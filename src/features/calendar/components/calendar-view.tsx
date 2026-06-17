"use client";

import { useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventInput } from "@/validators";
import { EventForm } from "@/features/calendar/components/event-form";

type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  visibility: string;
  startTime: Date;
  endTime: Date;
  location: string | null;
  description: string | null;
  caseId: string | null;
};

type CaseOption = { id: string; label: string };

type CalendarViewProps = {
  events: CalendarEvent[];
  cases: CaseOption[];
  userTeamId: string | null;
  userTeamName?: string | null;
};

type ViewMode = "day" | "week" | "month";

const TYPE_COLORS: Record<string, string> = {
  HEARING: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  MEETING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  COURT_APPEARANCE: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  DEADLINE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  REMINDER: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

export function CalendarView({
  events,
  cases,
  userTeamId,
  userTeamName,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  function navigate(direction: "prev" | "next") {
    const fn =
      view === "month"
        ? direction === "prev"
          ? subMonths
          : addMonths
        : view === "week"
          ? direction === "prev"
            ? subWeeks
            : addWeeks
          : direction === "prev"
            ? (d: Date) => addDays(d, -1)
            : (d: Date) => addDays(d, 1);
    setCurrentDate(fn(currentDate, 1));
  }

  function getEventsForDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.startTime), day));
  }

  function openNewEvent(date?: Date) {
    setSelectedEvent(null);
    setSelectedDate(date ? format(date, "yyyy-MM-dd") : undefined);
    setEventFormOpen(true);
  }

  function openEditEvent(event: CalendarEvent) {
    setSelectedEvent(event);
    setEventFormOpen(true);
  }

  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentDate),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const monthDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[200px] text-center text-lg font-semibold">
            {view === "day"
              ? format(currentDate, "MMMM d, yyyy")
              : view === "week"
                ? `${format(weekStart, "MMM d")} – ${format(endOfWeek(currentDate), "MMM d, yyyy")}`
                : format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "outline"}
              size="sm"
              onClick={() => setView(v)}
              className="capitalize"
            >
              {v}
            </Button>
          ))}
          <Button onClick={() => openNewEvent(currentDate)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {view === "day" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(currentDate, "EEEE, MMMM d")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getEventsForDay(currentDate).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No events scheduled
              </p>
            ) : (
              getEventsForDay(currentDate).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEditEvent(event)}
                  className="w-full rounded-md border p-3 text-left hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge className={TYPE_COLORS[event.type] ?? ""}>
                      {event.type.replace(/_/g, " ")}
                    </Badge>
                    {event.visibility === "TEAM" && (
                      <Badge variant="outline">Team</Badge>
                    )}
                    <span className="font-medium">{event.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateTime(event.startTime)} –{" "}
                    {format(new Date(event.endTime), "h:mm a")}
                  </p>
                  {event.location && (
                    <p className="text-sm text-muted-foreground">
                      {event.location}
                    </p>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {view === "week" && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            return (
              <Card
                key={day.toISOString()}
                className={isToday(day) ? "ring-2 ring-primary" : ""}
              >
                <CardHeader className="p-3 pb-1">
                  <button
                    type="button"
                    onClick={() => openNewEvent(day)}
                    className="text-left"
                  >
                    <p className="text-xs text-muted-foreground">
                      {format(day, "EEE")}
                    </p>
                    <p
                      className={`text-lg font-semibold ${isToday(day) ? "text-primary" : ""}`}
                    >
                      {format(day, "d")}
                    </p>
                  </button>
                </CardHeader>
                <CardContent className="space-y-1 p-2 pt-0">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEditEvent(event)}
                      className={`w-full truncate rounded px-1 py-0.5 text-left text-xs ${TYPE_COLORS[event.type] ?? "bg-muted"}`}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div className="rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="p-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] border-b border-r p-1 ${!inMonth ? "bg-muted/30" : ""} ${isToday(day) ? "bg-primary/5" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => openNewEvent(day)}
                    className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-muted ${isToday(day) ? "bg-primary text-primary-foreground" : ""} ${!inMonth ? "text-muted-foreground" : ""}`}
                  >
                    {format(day, "d")}
                  </button>
                  {dayEvents.slice(0, 2).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEditEvent(event)}
                      className={`mb-0.5 w-full truncate rounded px-1 text-left text-[10px] leading-tight ${TYPE_COLORS[event.type] ?? "bg-muted"}`}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{dayEvents.length - 2}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EventForm
        open={eventFormOpen}
        onOpenChange={setEventFormOpen}
        cases={cases}
        userTeamId={userTeamId}
        userTeamName={userTeamName}
        defaultDate={selectedDate}
        initialData={
          selectedEvent
            ? {
                id: selectedEvent.id,
                title: selectedEvent.title,
                description: selectedEvent.description,
                type: selectedEvent.type as EventInput["type"],
                visibility: selectedEvent.visibility as EventInput["visibility"],
                startTime: new Date(selectedEvent.startTime)
                  .toISOString()
                  .slice(0, 16),
                endTime: new Date(selectedEvent.endTime)
                  .toISOString()
                  .slice(0, 16),
                location: selectedEvent.location,
                caseId: selectedEvent.caseId,
              }
            : undefined
        }
      />
    </div>
  );
}