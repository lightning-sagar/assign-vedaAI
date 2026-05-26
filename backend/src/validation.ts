import { z } from "zod";

export const assignmentSchema = z.object({
  title: z.string().trim().min(1, "Assignment title is required"),
  dueDate: z.string().trim().min(1, "Due date is required"),
  instructions: z.string().optional().default(""),
  sourceText: z.string().optional().default(""),
  questionTypes: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        count: z.number().int().nonnegative(),
        marks: z.number().int().positive()
      })
    )
    .min(1)
    .refine((types) => types.some((type) => type.count > 0), "At least one question is required")
});
