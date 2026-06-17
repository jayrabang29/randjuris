import prisma from "@/lib/prisma";

export const memberLegalServicesSelect = {
  legalServices: {
    select: {
      legalService: {
        select: { id: true, name: true },
      },
    },
    orderBy: { legalService: { name: "asc" as const } },
  },
} as const;

export function mapUserLegalServices(user: {
  legalServices: { legalService: { id: string; name: string } }[];
}): { id: string; name: string }[] {
  return user.legalServices.map((entry) => entry.legalService);
}

export async function syncUserLegalServices(
  userId: string,
  legalServiceIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(legalServiceIds)];

  if (uniqueIds.length > 0) {
    const existing = await prisma.legalService.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (existing.length !== uniqueIds.length) {
      throw new Error("One or more legal services were not found");
    }
  }

  await prisma.$transaction([
    prisma.userLegalService.deleteMany({ where: { userId } }),
    ...(uniqueIds.length > 0
      ? [
          prisma.userLegalService.createMany({
            data: uniqueIds.map((legalServiceId) => ({
              userId,
              legalServiceId,
            })),
          }),
        ]
      : []),
  ]);
}
