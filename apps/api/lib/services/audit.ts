import { prisma } from "../prisma";

export async function writeAudit(input: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      before: input.before === undefined ? undefined : (input.before as object),
      after: input.after === undefined ? undefined : (input.after as object),
      ip: input.ip ?? undefined,
    },
  });
}
