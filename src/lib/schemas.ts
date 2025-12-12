import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Title required"),
  status: z.enum(["cancel", "in-progress", "done"]).default("done"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignee: z.string().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
