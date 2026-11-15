import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên khách hàng").max(120),
  phone: z.string().trim().max(25).optional().or(z.literal("")),
  link: z.string().trim().max(300).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;
