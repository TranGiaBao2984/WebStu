"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Pencil, Trash2, ExternalLink, Repeat } from "lucide-react";
import { clientSchema, type ClientInput } from "@/features/clients/schema";
import {
  createClientAction,
  updateClientAction,
  deleteClientAction,
} from "@/features/clients/actions";
import type { ClientWithStats } from "@/features/clients/queries";
import { formatVND } from "@/lib/money";
import { vi } from "@/i18n/vi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClientsClient({
  initialClients,
  initialSearch,
}: {
  initialClients: ClientWithStats[];
  initialSearch: string;
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithStats | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", link: "", source: "" },
  });

  const openCreate = () => {
    setEditingClient(null);
    form.reset({ name: "", phone: "", link: "", source: "" });
    setShowForm(true);
    setNotice(null);
  };

  const openEdit = (c: ClientWithStats) => {
    setEditingClient(c);
    form.reset({
      name: c.name,
      phone: c.phone ?? "",
      link: c.link ?? "",
      source: c.source ?? "",
    });
    setShowForm(true);
    setNotice(null);
  };

  const onSubmit = async (values: ClientInput) => {
    setNotice(null);
    const res = editingClient
      ? await updateClientAction(editingClient.id, values)
      : await createClientAction(values);

    if (res.error) {
      setNotice({ type: "err", text: res.error });
      return;
    }

    setNotice({
      type: "ok",
      text: editingClient ? vi.clients.updated : vi.clients.created,
    });
    setShowForm(false);
    setEditingClient(null);
    form.reset({ name: "", phone: "", link: "", source: "" });
    router.refresh();
  };

  const handleDelete = (client: ClientWithStats) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khách hàng "${client.name}" không?`)) {
      return;
    }

    startTransition(async () => {
      setNotice(null);
      const res = await deleteClientAction(client.id);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setNotice({ type: "ok", text: vi.clients.deleted });
        router.refresh();
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("q", searchInput.trim());
    router.push(`/clients?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={vi.clients.searchPlaceholder}
            />
          </div>
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
        </form>

        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          {vi.clients.addTitle}
        </Button>
      </div>

      {notice && (
        <div
          className={
            notice.type === "ok"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          }
        >
          {notice.text}
        </div>
      )}

      {showForm && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingClient ? vi.clients.editTitle : vi.clients.addTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="client_name">{vi.clients.name} *</Label>
                  <Input
                    id="client_name"
                    placeholder={vi.clients.namePlaceholder}
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="client_phone">{vi.clients.phone}</Label>
                  <Input
                    id="client_phone"
                    placeholder={vi.clients.phonePlaceholder}
                    {...form.register("phone")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="client_source">{vi.clients.source}</Label>
                  <select
                    id="client_source"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...form.register("source")}
                  >
                    <option value="">{vi.clients.sourcePlaceholder}</option>
                    {vi.clients.sources.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="client_link">{vi.clients.link}</Label>
                  <Input
                    id="client_link"
                    placeholder={vi.clients.linkPlaceholder}
                    {...form.register("link")}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? vi.common.saving : vi.common.save}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClient(null);
                  }}
                >
                  {vi.common.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {initialClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {vi.clients.empty}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {initialClients.map((client) => (
            <Card key={client.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="flex flex-col justify-between gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{client.name}</span>
                      {client.isReturning && (
                        <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/20">
                          <Repeat className="h-3 w-3" />
                          {vi.clients.returningBadge}
                        </Badge>
                      )}
                      {client.source && <Badge variant="outline">{client.source}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client.phone || "Chưa có SĐT"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {client.link && (
                      <a
                        href={client.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        title="Mở trang cá nhân"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(client)}
                      aria-label={vi.common.edit}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleDelete(client)}
                      aria-label={vi.common.delete}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2.5 text-sm">
                  <div>
                    <span className="block text-xs text-muted-foreground">
                      {vi.clients.sessionsCount}
                    </span>
                    <span className="font-semibold">{client.sessionsCount} buổi</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">
                      {vi.clients.totalSpent}
                    </span>
                    <span className="font-semibold text-primary">
                      {formatVND(client.totalSpent)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}