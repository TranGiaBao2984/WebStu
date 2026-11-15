import { listSimpleClients } from "@/features/clients/queries";
import { listServicePackages } from "@/features/settings/queries";
import { NewBookingForm } from "@/components/bookings/new-booking-form";

export default async function NewBookingPage() {
  const [clients, packages] = await Promise.all([
    listSimpleClients(),
    listServicePackages(),
  ]);

  const activePackages = packages.filter((p) => p.is_active);
  return <NewBookingForm clients={clients} packages={activePackages} />;
}
