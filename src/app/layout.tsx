import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { vi } from "@/i18n/vi";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: vi.common.appName,
  description: vi.auth.subtitle,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.className} min-h-screen bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
