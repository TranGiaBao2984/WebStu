const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatVND(amount: number | bigint | null | undefined, fallback = "Chưa tính được"): string {
  if (amount === null || amount === undefined) {
    return fallback;
  }
  return vndFormatter.format(typeof amount === "bigint" ? Number(amount) : Math.round(amount));
}

export function formatVNDInput(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "" || value === 0) {
    return "";
  }
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.replace(/^0+(?=\d)/, "");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseVNDInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function calcPaidPercent(paid: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((paid * 100) / total);
}

export function calcRemaining(total: number, paid: number): number {
  return total - paid;
}