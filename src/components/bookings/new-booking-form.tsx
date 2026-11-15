"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { createBookingSchema, type CreateBookingInput } from "@/features/bookings/schema";
import { createBookingAction } from "@/features/bookings/actions";
import type { ClientRow } from "@/features/clients/queries";
import type { ServicePackageRow } from "@/features/settings/queries";
import { formatVND, formatVNDInput, parseVNDInput } from "@/lib/money";
import { getDateKeyHCM } from "@/lib/date";
import { vi } from "@/i18n/vi";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NewBookingForm({
  clients,
  packages,
}: {
  clients: Pick<ClientRow, "id" | "name" | "phone">[];
  packages: ServicePackageRow[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      client_mode: clients.length > 0 ? "existing" : "new",
      client_id: "",
      new_client_name: "",
      new_client_phone: "",
      new_client_source: "",
      title: "",
      note: "",
      package_id: "",
      custom_item_name: "",
      custom_item_amount: 0,
      session_date: getDateKeyHCM(),
      start_time: "09:00",
      end_time: "11:00",
      location: "",
      crew_note: "",
      deposit_amount: 0,
      deposit_method: "Chuyển khoản",
    },
  });

  const clientMode = useWatch({ control: form.control, name: "client_mode" });
  const selectedPackageId = useWatch({ control: form.control, name: "package_id" }) ?? "";
  const customItemAmount = useWatch({ control: form.control, name: "custom_item_amount" }) ?? 0;
  const depositAmount = useWatch({ control: form.control, name: "deposit_amount" }) ?? 0;

  const handlePackageChange = (pkgId: string) => {
    form.setValue("package_id", pkgId);
    const found = packages.find((p) => p.id === pkgId);
    if (found && !form.getValues("title")) {
      form.setValue("title", found.name);
    }
  };

  const onSubmit = async (values: CreateBookingInput) => {
    setServerError(null);
    const res = await createBookingAction(values);
    if (res.error) {
      setServerError(res.error);
      return;
    }
    if (res.bookingId) {
      router.push(`/bookings/${res.bookingId}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/bookings" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {vi.common.back}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{vi.bookings.newBooking}</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Khách hàng */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{vi.bookings.form.selectClient}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={clientMode === "existing" ? "default" : "outline"}
                onClick={() => form.setValue("client_mode", "existing")}
              >
                {vi.bookings.form.clientModeExisting}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={clientMode === "new" ? "default" : "outline"}
                onClick={() => form.setValue("client_mode", "new")}
              >
                {vi.bookings.form.clientModeNew}
              </Button>
            </div>

            {clientMode === "existing" ? (
              <div className="space-y-1.5">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  {...form.register("client_id")}
                >
                  <option value="">{vi.bookings.form.selectClientPlaceholder}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
                {form.formState.errors.client_id && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.client_id.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>{vi.clients.name} *</Label>
                  <Input
                    placeholder={vi.clients.namePlaceholder}
                    {...form.register("new_client_name")}
                  />
                  {form.formState.errors.new_client_name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.new_client_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>{vi.clients.phone}</Label>
                  <Input
                    placeholder={vi.clients.phonePlaceholder}
                    {...form.register("new_client_phone")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{vi.clients.source}</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                    {...form.register("new_client_source")}
                  >
                    <option value="">{vi.clients.sourcePlaceholder}</option>
                    {vi.clients.sources.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Thông tin buổi chụp & Gói dịch vụ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung buổi chụp & Gói dịch vụ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{vi.bookings.form.selectPackage}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  value={selectedPackageId}
                  onChange={(e) => handlePackageChange(e.target.value)}
                >
                  <option value="">{vi.bookings.form.noPackageOption}</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatVND(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>{vi.bookings.form.bookingTitle} *</Label>
                <Input
                  placeholder={vi.bookings.form.bookingTitlePlaceholder}
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
            </div>

            {!selectedPackageId && (
              <div className="grid gap-4 rounded-lg border bg-muted/40 p-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{vi.bookings.form.customItemName}</Label>
                  <Input
                    placeholder="Ví dụ: Chụp ngoại cảnh 2 tiếng"
                    {...form.register("custom_item_name")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{vi.bookings.form.customItemAmount}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="tabular-nums"
                    placeholder="0"
                    value={formatVNDInput(customItemAmount)}
                    onChange={(e) =>
                      form.setValue("custom_item_amount", parseVNDInput(e.target.value), {
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{vi.common.note}</Label>
              <Textarea rows={2} placeholder="Yêu cầu concept, trang phục..." {...form.register("note")} />
            </div>
          </CardContent>
        </Card>

        {/* 3. Ca chụp & Tiền cọc */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{vi.bookings.form.sessionSection}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>{vi.bookings.form.sessionDate}</Label>
                <Input type="date" {...form.register("session_date")} />
              </div>
              <div className="space-y-1.5">
                <Label>{vi.bookings.form.startTime}</Label>
                <Input type="time" {...form.register("start_time")} />
              </div>
              <div className="space-y-1.5">
                <Label>{vi.bookings.form.endTime}</Label>
                <Input type="time" {...form.register("end_time")} />
                {form.formState.errors.end_time && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.end_time.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{vi.bookings.form.location}</Label>
                <Input
                  placeholder={vi.bookings.form.locationPlaceholder}
                  {...form.register("location")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{vi.bookings.form.crewNote}</Label>
                <Input
                  placeholder={vi.bookings.form.crewNotePlaceholder}
                  {...form.register("crew_note")}
                />
              </div>
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{vi.bookings.form.depositAmount}</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="tabular-nums"
                  placeholder="0"
                  value={formatVNDInput(depositAmount)}
                  onChange={(e) =>
                    form.setValue("deposit_amount", parseVNDInput(e.target.value), {
                      shouldValidate: true,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{vi.bookings.form.paymentMethod}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  {...form.register("deposit_method")}
                >
                  {vi.bookings.form.methods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {serverError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? vi.bookings.form.submittingCreate
              : vi.bookings.form.submitCreate}
          </Button>
          <Link href="/bookings" className={buttonVariants({ variant: "outline" })}>{vi.common.cancel}</Link>
        </div>
      </form>
    </div>
  );
}