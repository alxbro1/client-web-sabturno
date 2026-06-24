import type { LucideProps } from "lucide-react";
import {
  Home,
  CalendarDays,
  User,
  CheckCircle2,
  Clock,
  CreditCard,
  ArrowRight,
  LogOut,
  Settings,
  CreditCard as PaymentIcon,
} from "lucide-react";

export function IconHome(props: LucideProps) {
  return <Home {...props} />;
}

export function IconCalendar(props: LucideProps) {
  return <CalendarDays {...props} />;
}

export function IconUser(props: LucideProps) {
  return <User {...props} />;
}

export function IconCheckCircle(props: LucideProps) {
  return <CheckCircle2 {...props} />;
}

export function IconClock(props: LucideProps) {
  return <Clock {...props} />;
}

export function IconCreditCard(props: LucideProps) {
  return <CreditCard {...props} />;
}

export function IconArrowRight(props: LucideProps) {
  return <ArrowRight {...props} />;
}

export function IconLogout(props: LucideProps) {
  return <LogOut {...props} />;
}

export function IconSettings(props: LucideProps) {
  return <Settings {...props} />;
}

export function IconPayment(props: LucideProps) {
  return <PaymentIcon {...props} />;
}
