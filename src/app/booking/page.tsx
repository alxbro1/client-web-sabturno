"use client";

import { useRouter } from "next/navigation";

export default function BookingPage() {
  const router = useRouter();
  router.replace("/booking/select-local");
  return null;
}
