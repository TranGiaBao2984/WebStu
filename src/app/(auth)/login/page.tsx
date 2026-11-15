"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { loginSchema, type LoginInput } from "@/features/auth/schema";
import { loginAction } from "@/features/auth/actions";
import { vi } from "@/i18n/vi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    const res = await loginAction(values);
    if (res?.error) {
      setServerError(res.error);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Camera className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">{vi.auth.title}</CardTitle>
          <CardDescription>{vi.auth.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{vi.auth.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={vi.auth.emailPlaceholder}
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{vi.auth.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={vi.auth.passwordPlaceholder}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? vi.auth.submitting : vi.auth.submit}
            </Button>

            <p className="text-center text-xs text-muted-foreground">{vi.auth.signupClosedNotice}</p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
