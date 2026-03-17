import { z } from "zod";

export const PROJECT_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#d97706", // amber
  "#e11d48", // rose
  "#7c3aed", // violet
] as const;

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name too long"),
  client: z.string().max(120).optional().or(z.literal("")),
  color: z.union([z.enum(PROJECT_COLORS), z.literal("")]),
});

export const resourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name too long"),
  role: z.string().max(80).optional().or(z.literal("")),
  team: z.string().max(80).optional().or(z.literal("")),
});

export const bookingSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  resourceId: z.string().min(1, "Resource is required"),
  weekStart: z.string().min(1, "Week is required"),
  allocationPct: z.coerce.number().min(1, "Min 1%").max(100, "Max 100%"),
  note: z.string().max(200).optional().or(z.literal("")),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
export type ResourceFormData = z.infer<typeof resourceSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
