import type { Metadata } from "next";
import { Lora, Be_Vietnam_Pro } from "next/font/google";

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-customer-serif",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-customer-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NI'S IMAGES | Portfolio",
  description: "Fine Art & Portrait Photography",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${lora.variable} ${beVietnamPro.variable} antialiased`}
      style={{ fontFamily: "var(--font-customer-sans), sans-serif" }}
    >
      {children}
    </div>
  );
}
