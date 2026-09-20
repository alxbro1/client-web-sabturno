import { redirect } from "next/navigation";

export default function BookingPage() {
  // Se redirige en el servidor: llamar a router.replace durante el render de un
  // client component rompe el prerender con "ReferenceError: location is not defined".
  redirect("/booking/select-local");
}
