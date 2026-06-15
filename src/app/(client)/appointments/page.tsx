"use client";

export default function AppointmentsPage() {
  return (
    <section className="grid gap-6">
      <div>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
          Mis turnos
        </p>
        <h2>Turnos reservados</h2>
      </div>

      <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
        <p>Cargando turnos...</p>
      </div>
    </section>
  );
}
