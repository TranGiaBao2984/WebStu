"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/features/auth/actions";
import { vi } from "@/i18n/vi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const INPUT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const trimmedEmail = email.trim();
    const nextErrors: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Email không hợp lệ";
    }
    if (password.length < 6) {
      nextErrors.password = "Mật khẩu tối thiểu 6 ký tự";
    }

    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const res = await loginAction({ email: trimmedEmail, password });
      if (res?.error) {
        setServerError(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{vi.auth.emailLabel}</Label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={vi.auth.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLASS}
        />
        {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{vi.auth.passwordLabel}</Label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={vi.auth.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLASS}
        />
        {fieldErrors.password && (
          <p className="text-xs text-destructive">{fieldErrors.password}</p>
        )}
      </div>

      {serverError && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? vi.auth.submitting : vi.auth.submit}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{vi.auth.signupClosedNotice}</p>
    </form>
  );
}