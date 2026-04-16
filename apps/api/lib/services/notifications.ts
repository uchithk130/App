import { prisma } from "@/lib/prisma";

/**
 * Create an in-app notification for a user.
 * Lightweight  just persists to DB. Clients poll for updates.
 */
export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      data: (input.data as object) ?? undefined,
    },
  });
}

/**
 * Notify multiple users at once (e.g. all admins).
 */
export async function createNotifications(
  inputs: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }[],
) {
  if (inputs.length === 0) return;
  await prisma.notification.createMany({
    data: inputs.map((i) => ({
      userId: i.userId,
      type: i.type,
      title: i.title,
      body: i.body ?? null,
      data: (i.data as object) ?? undefined,
    })),
  });
}
