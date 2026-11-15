import { getMonthlyFinanceReport, listExpenses } from "@/features/finance/queries";
import { listBookings } from "@/features/bookings/queries";
import { FinanceClient } from "@/components/finance/finance-client";
import { getCurrentMonthStartHCM } from "@/lib/date";
import { vi } from "@/i18n/vi";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const defaultMonth = getCurrentMonthStartHCM().slice(0, 7);
  const selectedMonth =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : defaultMonth;
  const monthStart = `${selectedMonth}-01`;

  const [report, expenses, bookings] = await Promise.all([
    getMonthlyFinanceReport(monthStart),
    listExpenses(),
    listBookings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{vi.nav.finance}</h1>
        <p className="text-sm text-muted-foreground">
          Báo cáo doanh thu thực tế, dòng tiền thu/chi và lợi nhuận Studio theo tháng
        </p>
      </div>

      <FinanceClient
        selectedMonth={selectedMonth}
        report={report}
        expenses={expenses}
        bookings={bookings}
      />
    </div>
  );
}