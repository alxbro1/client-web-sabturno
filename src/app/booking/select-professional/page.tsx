"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";
import { Button } from "@/components/Button";
import { usePublicEmployeesQuery } from "@/hooks/queries/usePublicEmployeesQuery";
import { useBookingStore } from "@/stores/booking";
import type { PublicEmployee } from "@/lib/types/employee";

const APPOINTMENT_PATH = "/booking/appointment";

const cardBase =
  "group flex min-h-16 w-full items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all duration-[140ms] outline-none hover:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95";

function EmployeeAvatar({ employee }: { employee: PublicEmployee }) {
  if (employee.avatar) {
    return (
      <img
        src={employee.avatar}
        alt=""
        aria-hidden="true"
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#0a0a0a]"
      style={{ backgroundColor: employee.color || "#00f068" }}
      aria-hidden="true"
    >
      {employee.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function SelectProfessionalPage() {
  const router = useRouter();
  const local = useBookingStore((s) => s.local);
  const service = useBookingStore((s) => s.service);
  const setService = useBookingStore((s) => s.setService);
  const setEmployee = useBookingStore((s) => s.setEmployee);

  const { data: employees, isLoading, error } = usePublicEmployeesQuery(
    local?.id,
    service?.id ?? null,
  );

  useEffect(() => {
    if (!local || !service) {
      router.replace(local ? "/booking/select-service" : "/booking/select-local");
    }
  }, [local, service, router]);

  // Domain rule 7: 0 o 1 elegibles -> saltear el selector.
  useEffect(() => {
    if (!local || !service || isLoading || error || !employees) return;

    if (employees.length === 0) {
      setEmployee("any");
      router.replace(APPOINTMENT_PATH);
    } else if (employees.length === 1) {
      setEmployee(employees[0]);
      router.replace(APPOINTMENT_PATH);
    }
  }, [employees, isLoading, error, local, service, setEmployee, router]);

  if (!local || !service) return null;

  function handleSelect(employee: PublicEmployee | "any") {
    setEmployee(employee);
    router.push(APPOINTMENT_PATH);
  }

  const willAutoAdvance = !isLoading && !error && !!employees && employees.length <= 1;
  const showLoading = isLoading || willAutoAdvance;

  return (
    <section className="flex flex-col items-start gap-6 py-6">
      <div>
        <Button
          variant="ghost"
          className="-ml-3 gap-1 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setService(null);
            router.push("/booking/select-service");
          }}
        >
          <ChevronLeft className="size-4" />
          Cambiar servicio
        </Button>
      </div>

      <header>
        <h2 className="text-2xl font-bold text-foreground">Elegí un profesional</h2>
        <p className="text-muted-foreground">
          {service.name} en {local.name}
        </p>
      </header>

      {showLoading ? (
        <div className="w-full rounded-xl border border-border bg-card p-5 min-h-[140px] grid place-items-center text-center text-muted-foreground">
          Cargando profesionales...
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error.message}
        </div>
      ) : null}

      {!showLoading && !error && employees && employees.length > 1 ? (
        <div className="flex w-full flex-col gap-4">
          <button
            type="button"
            onClick={() => handleSelect("any")}
            className={cardBase}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Users className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">Sin preferencia</h3>
              <p className="text-xs text-muted-foreground">
                Te asignamos un profesional disponible.
              </p>
            </div>
          </button>

          {employees.map((employee) => (
            <button
              key={employee.id}
              type="button"
              onClick={() => handleSelect(employee)}
              className={cardBase}
            >
              <EmployeeAvatar employee={employee} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-foreground">
                  {employee.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
