import { z } from "zod";

export const studioSettingsSchema = z.object({
  studio_name: z.string().trim().min(1, "Vui lòng nhập tên studio").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  timezone: z.string().trim().min(1),
  doc_footer: z.string().trim().max(500).optional().or(z.literal("")),
});

export const servicePackageSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên gói dịch vụ").max(150),
  price: z
    .number()
    .refine((val) => !Number.isNaN(val), "Vui lòng nhập đơn giá hợp lệ")
    .int("Đơn giá phải là số nguyên VND")
    .min(0, "Đơn giá không được âm"),
  is_active: z.boolean(),
});

export type StudioSettingsInput = z.infer<typeof studioSettingsSchema>;
export type ServicePackageInput = z.infer<typeof servicePackageSchema>;
