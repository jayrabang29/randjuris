"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import {
  buildEventAccessWhere,
  canAccessEvent,
} from "@/lib/event-access";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { eventFilterSchema, eventSchema, type EventInput } from "@/validators";
import type { ActionResult } from "@/types";
import type { Event } from "@prisma/client";

type EventWithRelations = Event & {
  case: { id: string; caseNumber: string; title: string } | null;
  user: { id: string; firstName: string; lastName: string };
  team: { id: string; name: string } | null;
};

async function getEventAccessUser(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, role: true, teamId: true },
  });
}

export async function getEvents(params: {
  startDate: string;
  endDate: string;
  caseId?: string;
}): Promise<ActionResult<EventWithRelations[]>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.calendar.read);
    const accessUser = await getEventAccessUser(sessionUser.id);

    const parsed = eventFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { startDate, endDate, caseId } = parsed.data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return { success: false, error: "Start date must be before end date" };
    }

    const events = await prisma.event.findMany({
      where: {
        ...buildEventAccessWhere(accessUser),
        ...(caseId ? { caseId } : {}),
        startTime: { lte: end },
        endTime: { gte: start },
      },
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return { success: true, data: events };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch events" };
  }
}

export async function createEvent(
  data: EventInput
): Promise<ActionResult<Event>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.calendar.create);
    const accessUser = await getEventAccessUser(sessionUser.id);

    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    if (parsed.data.visibility === "TEAM" && !accessUser.teamId) {
      return {
        success: false,
        error: "You must belong to a team to create team-only events",
      };
    }

    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(parsed.data.endTime);

    if (startTime >= endTime) {
      return { success: false, error: "End time must be after start time" };
    }

    if (parsed.data.caseId) {
      const caseRecord = await prisma.case.findUnique({
        where: { id: parsed.data.caseId },
      });
      if (!caseRecord) {
        return { success: false, error: "Case not found" };
      }
    }

    const event = await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        startTime,
        endTime,
        location: parsed.data.location,
        isAllDay: parsed.data.isAllDay ?? false,
        visibility: parsed.data.visibility,
        teamId:
          parsed.data.visibility === "TEAM" ? accessUser.teamId : null,
        caseId: parsed.data.caseId,
        reminderMinutes: parsed.data.reminderMinutes ?? 60,
        userId: accessUser.id,
      },
    });

    await logActivity({
      userId: accessUser.id,
      action: "EVENT_CREATED",
      entity: "Event",
      entityId: event.id,
      details: `Created ${parsed.data.visibility.toLowerCase()} event "${event.title}"`,
    });

    return { success: true, data: event };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(
  id: string,
  data: EventInput
): Promise<ActionResult<Event>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.calendar.update);
    const accessUser = await getEventAccessUser(sessionUser.id);

    if (!id) {
      return { success: false, error: "Event ID is required" };
    }

    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    if (!canAccessEvent(accessUser, existing)) {
      return { success: false, error: "You do not have access to this event" };
    }

    if (parsed.data.visibility === "TEAM" && !accessUser.teamId) {
      return {
        success: false,
        error: "You must belong to a team to create team-only events",
      };
    }

    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(parsed.data.endTime);

    if (startTime >= endTime) {
      return { success: false, error: "End time must be after start time" };
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        startTime,
        endTime,
        location: parsed.data.location,
        isAllDay: parsed.data.isAllDay ?? false,
        visibility: parsed.data.visibility,
        teamId:
          parsed.data.visibility === "TEAM" ? accessUser.teamId : null,
        caseId: parsed.data.caseId,
        reminderMinutes: parsed.data.reminderMinutes ?? 60,
      },
    });

    await logActivity({
      userId: accessUser.id,
      action: "EVENT_UPDATED",
      entity: "Event",
      entityId: event.id,
      details: `Updated event "${event.title}"`,
    });

    return { success: true, data: event };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.calendar.delete);
    const accessUser = await getEventAccessUser(sessionUser.id);

    if (!id) {
      return { success: false, error: "Event ID is required" };
    }

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    if (!canAccessEvent(accessUser, existing)) {
      return { success: false, error: "You do not have access to this event" };
    }

    await prisma.event.delete({ where: { id } });

    await logActivity({
      userId: accessUser.id,
      action: "EVENT_DELETED",
      entity: "Event",
      entityId: id,
      details: `Deleted event "${existing.title}"`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to delete event" };
  }
}
