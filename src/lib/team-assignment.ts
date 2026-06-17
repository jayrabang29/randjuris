import prisma from "@/lib/prisma";

export async function validateUserTeamAssignment(
  userId: string,
  targetTeamId: string | null | undefined
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!targetTeamId) {
    return { ok: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { team: { select: { id: true, name: true } } },
  });

  if (!user) {
    return { ok: false, error: "User not found" };
  }

  if (user.teamId && user.teamId !== targetTeamId) {
    return {
      ok: false,
      error: `User is already assigned to team "${user.team?.name}". Remove them from that team first.`,
    };
  }

  return { ok: true };
}

export async function validateNewUserTeamAssignment(
  teamId: string | null | undefined
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!teamId) {
    return { ok: true };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return { ok: false, error: "Team not found" };
  }

  return { ok: true };
}
