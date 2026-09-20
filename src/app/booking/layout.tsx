import { BookingShell } from "@/components/booking/BookingShell";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BookingShell>{children}</BookingShell>;
}
