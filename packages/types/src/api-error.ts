import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
