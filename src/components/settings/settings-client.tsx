"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import {
  studioSettingsSchema,
  servicePackageSchema,
  type StudioSettingsInput,
  type ServicePackageInput,
} from "@/features/settings/schema";
import {
  updateStudioSettingsAction,
  createServicePackageAction,
  toggleServicePackageActiveAction,
  deleteServicePackageAction,
} from "@/features/settings/actions";
import type { StudioSettingsRow, ServicePackageRow } from "@/features/settings/queries";
import { formatVND } from "@/lib/money";
import { vi } from "@/i18n/vi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsClient({
  initialSettings,
  initialPackages,
}: {
  initialSettings: StudioSettingsRow | null;
  initialPackages: ServicePackageRow[];
}) {
  const [studioNotice, setStudioNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pkgNotice, setPkgNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const studioForm = useForm<StudioSettingsInput>({
    resolver: zodResolver(studioSettingsSchema),
    defaultValues: {
      studio_name: initialSettings?.studio_name ?? vi.common.appName,
      phone: initialSettings?.phone ?? "",
      timezone: initialSettings?.timezone ?? "Asia/Ho_Chi_Minh",
      doc_footer: initialSettings?.doc_footer ?? "",
    },
  });

  const pkgForm = useForm<ServicePackageInput>({
    resolver: zodResolver(servicePackageSchema),
    defaultValues: {
      name: "",
      price: 0,
      is_active: true,
    },
  });

  const onSaveStudio = async (values: StudioSettingsInput) => {
    setStudioNotice(null);
    const res = await updateStudioSettingsAction(values);
    if (res.error) {
      setStudioNotice({ type: "err", text: res.error });
    } else {
      setStudioNotice({ type: "ok", text: vi.settings.savedStudioSuccess });
    }
  };

  const onAddPackage = async (values: ServicePackageInput) => {
    setPkgNotice(null);
    const res = await createServicePackageAction(values);
    if (res.error) {
      setPkgNotice({ type: "err", text: res.error });
    } else {
      pkgForm.reset({ name: "", price: 0, is_active: true });
      setPkgNotice({ type: "ok", text: vi.settings.packageCreated });
    }
  };

  const handleTogglePackage = (pkg: ServicePackageRow) => {
    startTransition(async () => {
      const res = await toggleServicePackageActiveAction(pkg.id, !pkg.is_active);
      if (res.error) {
        setPkgNotice({ type: "err", text: res.error });
      }
    });
  };

  const handleDeletePackage = (id: string) => {
    startTransition(async () => {
      const res = await deleteServicePackageAction(id);
      if (res.error) {
        setPkgNotice({ type: "err", text: res.error });
      } else {
        setPkgNotice({ type: "ok", text: vi.settings.packageDeleted });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{vi.settings.studioSectionTitle}</CardTitle>
          <CardDescription>{vi.settings.studioSectionDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={studioForm.handleSubmit(onSaveStudio)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="studio_name">{vi.settings.studioName}</Label>
                <Input id="studio_name" {...studioForm.register("studio_name")} />
                {studioForm.formState.errors.studio_name && (
                  <p className="text-xs text-destructive">
                    {studioForm.formState.errors.studio_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">{vi.settings.phone}</Label>
                <Input id="phone" placeholder="0901234567" {...studioForm.register("phone")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timezone">{vi.settings.timezone}</Label>
              <Input id="timezone" readOnly className="bg-muted" {...studioForm.register("timezone")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_footer">{vi.settings.docFooter}</Label>
              <Textarea
                id="doc_footer"
                rows={3}
                placeholder={vi.settings.docFooterPlaceholder}
                {...studioForm.register("doc_footer")}
              />
            </div>

            {studioNotice && (
              <p
                className={
                  studioNotice.type === "ok"
                    ? "text-sm font-medium text-emerald-700"
                    : "text-sm font-medium text-destructive"
                }
              >
                {studioNotice.text}
              </p>
            )}

            <Button type="submit" disabled={studioForm.formState.isSubmitting}>
              {studioForm.formState.isSubmitting ? vi.common.saving : vi.common.save}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{vi.settings.packagesSectionTitle}</CardTitle>
          <CardDescription>{vi.settings.packagesSectionDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={pkgForm.handleSubmit(onAddPackage)}
            className="grid gap-3 rounded-lg border bg-muted/40 p-4 sm:grid-cols-[1fr_180px_auto]"
          >
            <div className="space-y-1">
              <Label htmlFor="pkg_name">{vi.settings.packageName}</Label>
              <Input
                id="pkg_name"
                placeholder={vi.settings.packageNamePlaceholder}
                {...pkgForm.register("name")}
              />
              {pkgForm.formState.errors.name && (
                <p className="text-xs text-destructive">{pkgForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="pkg_price">{vi.settings.packagePrice}</Label>
              <Input
                id="pkg_price"
                type="number"
                step={1000}
                min={0}
                {...pkgForm.register("price", { valueAsNumber: true })}
              />
              {pkgForm.formState.errors.price && (
                <p className="text-xs text-destructive">{pkgForm.formState.errors.price.message}</p>
              )}
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full sm:w-auto" disabled={pkgForm.formState.isSubmitting}>
                <Plus className="mr-1.5 h-4 w-4" />
                {vi.common.add}
              </Button>
            </div>
          </form>

          {pkgNotice && (
            <p
              className={
                pkgNotice.type === "ok"
                  ? "text-sm font-medium text-emerald-700"
                  : "text-sm font-medium text-destructive"
              }
            >
              {pkgNotice.text}
            </p>
          )}

          {initialPackages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {vi.settings.packageEmpty}
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {initialPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pkg.name}</span>
                      <Badge variant={pkg.is_active ? "default" : "secondary"}>
                        {pkg.is_active ? vi.settings.packageActive : vi.settings.packageInactive}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatVND(pkg.price)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleTogglePackage(pkg)}
                    >
                      {pkg.is_active ? vi.settings.packageInactive : vi.settings.packageActive}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleDeletePackage(pkg.id)}
                      aria-label={vi.common.delete}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>{vi.settings.securitySectionTitle}</span>
          </CardTitle>
          <CardDescription>{vi.settings.securityDesc}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
