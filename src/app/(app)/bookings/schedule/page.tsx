import { listAllScheduleSessions } from "@/features/bookings/queries";
import { ScheduleClient } from "@/components/bookings/schedule-client";
import { vi } from "@/i18n/vi";

export default async function SchedulePage() {
  const sessions = await listAllScheduleSessions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{vi.schedule.title}</h1>
        <p className="text-sm text-muted-foreground">{vi.schedule.subtitle}</p>
      </div>
      <ScheduleClient sessions={sessions} />
    </div>
  );
}
