import { DocumentVisibility, UserRole } from "@prisma/client";

export type EventAccessUser = {
  id: string;
  role: UserRole;
  teamId: string | null;
};

export type EventAccessRecord = {
  visibility: DocumentVisibility;
  teamId: string | null;
  userId: string;
};

export function canBypassEventVisibility(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGING_PARTNER";
}

export function buildEventAccessWhere(user: EventAccessUser) {
  if (canBypassEventVisibility(user.role)) {
    return {};
  }

  return {
    OR: [
      { visibility: DocumentVisibility.GENERAL },
      { userId: user.id },
      ...(user.teamId
        ? [
            {
              visibility: DocumentVisibility.TEAM,
              teamId: user.teamId,
            },
          ]
        : []),
    ],
  };
}

export function canAccessEvent(
  user: EventAccessUser,
  event: EventAccessRecord
): boolean {
  if (canBypassEventVisibility(user.role)) {
    return true;
  }

  if (event.visibility === DocumentVisibility.GENERAL) {
    return true;
  }

  if (event.userId === user.id) {
    return true;
  }

  return (
    event.visibility === DocumentVisibility.TEAM &&
    !!event.teamId &&
    event.teamId === user.teamId
  );
}
