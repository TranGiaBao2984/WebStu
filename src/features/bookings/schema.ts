import { z } from "zod";

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "shooting",
  "selecting",
  "selected",
  "retouching",
  "retouched",
  "completed",
  "cancelled",
] as const;

export type BookingStatusValue = (typeof BOOKING_STATUSES)[number];

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

export const createBookingSchema = z
  .object({
    client_mode: z.enum(["existing", "new"]),
    client_id: z.string().optional().or(z.literal("")),
    new_client_name: z.string().trim().max(120).optional().or(z.literal("")),
    new_client_phone: z.string().trim().max(25).optional().or(z.literal("")),
    new_client_source: z.string().trim().max(80).optional().or(z.literal("")),
    title: z.string().trim().min(1, "Vui lòng nhập tên buổi chụp").max(160),
    note: z.string().trim().max(1000).optional().or(z.literal("")),
    package_id: z.string().optional().or(z.literal("")),
    custom_item_name: z.string().trim().max(150).optional().or(z.literal("")),
    custom_item_amount: z.number().int().min(0),
    session_date: z.string().optional().or(z.literal("")),
    start_time: z.string().optional().or(z.literal("")),
    end_time: z.string().optional().or(z.literal("")),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    crew_note: z.string().trim().max(200).optional().or(z.literal("")),
    deposit_amount: z.number().int().min(0),
    deposit_method: z.string().trim().max(60).optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (val.client_mode === "existing" && !val.client_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["client_id"],
        message: "Vui lòng chọn khách hàng",
      });
    }
    if (val.client_mode === "new" && !val.new_client_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_client_name"],
        message: "Vui lòng nhập tên khách hàng mới",
      });
    }
    if (val.session_date && val.start_time && val.end_time) {
      if (val.end_time <= val.start_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["end_time"],
          message: "Giờ kết thúc phải sau giờ bắt đầu",
        });
      }
    }
  });

export const bookingItemSchema = z.object({
  kind: z.enum(["package", "custom", "surcharge"]),
  package_id: z.string().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Vui lòng nhập tên hạng mục").max(150),
  amount: z.number().int("Số tiền phải là số nguyên VND"),
});

export const bookingSessionSchema = z
  .object({
    session_date: z.string().min(1, "Vui lòng chọn ngày chụp"),
    start_time: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
    end_time: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    crew_note: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: "Giờ kết thúc phải sau giờ bắt đầu",
    path: ["end_time"],
  });

export const paymentSchema = z.object({
  kind: z.enum(["deposit", "balance", "refund"]),
  amount: z.number().int("Số tiền phải là số nguyên VND").positive("Số tiền phải lớn hơn 0"),
  paid_at: z.string().optional().or(z.literal("")),
  method: z.string().trim().max(60).optional().or(z.literal("")),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingItemInput = z.infer<typeof bookingItemSchema>;
export type BookingSessionInput = z.infer<typeof bookingSessionSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
