import { DocumentVisibility, UserRole } from "@prisma/client";

export type DocumentAccessUser = {
  id: string;
  role: UserRole;
  teamId: string | null;
};

export type DocumentAccessRecord = {
  visibility: DocumentVisibility;
  teamId: string | null;
  uploadedById: string;
};

export function canBypassDocumentVisibility(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGING_PARTNER";
}

export function buildDocumentAccessWhere(user: DocumentAccessUser) {
  if (canBypassDocumentVisibility(user.role)) {
    return {};
  }

  return {
    OR: [
      { visibility: DocumentVisibility.GENERAL },
      { uploadedById: user.id },
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

export function canAccessDocument(
  user: DocumentAccessUser,
  document: DocumentAccessRecord
): boolean {
  if (canBypassDocumentVisibility(user.role)) {
    return true;
  }

  if (document.visibility === DocumentVisibility.GENERAL) {
    return true;
  }

  if (document.uploadedById === user.id) {
    return true;
  }

  return (
    document.visibility === DocumentVisibility.TEAM &&
    !!document.teamId &&
    document.teamId === user.teamId
  );
}
