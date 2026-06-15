"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useEmployeesQuery } from "@/hooks/queries/useEmployeesQuery";
import { useAuthStore } from "@/stores/auth";

export default function EmployeesPage() {
  const { user } = useAuthStore();
  const localId = user?.id ?? "";
  const { employees, isLoading, error, deleteEmployee } =
    useEmployeesQuery(localId);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(deleteId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.5rem] font-bold">Empleados</h1>
          <p className="text-white/54 text-[0.9rem]">
            Gestiona los empleados de tu local
          </p>
        </div>
        <Link href="/local/employees/edit/new">
          <Button>Nuevo empleado</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
          Cargando empleados...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {error}
        </div>
      ) : employees.length === 0 ? (
        <div className="min-h-[200px] grid place-items-center text-center">
          <div className="grid gap-4">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-12 h-12 mx-auto text-white/24"
            >
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            <p className="text-white/48">No hay empleados registrados</p>
            <Link href="/local/employees/edit/new">
              <Button variant="secondary">Agregar primer empleado</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {employees.map((employee) => (
            <article
              key={employee.id}
              className="flex items-center gap-4 p-4 rounded-[18px] border border-white/10 bg-white/[0.02] transition-[background-color,border-color] duration-150 hover:bg-white/[0.04] hover:border-white/16"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[0.9rem] font-bold text-[#0a0a0a] shrink-0"
                style={{ backgroundColor: employee.color || "#00f068" }}
              >
                {employee.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{employee.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.82rem] text-white/48">
                  {employee.email && <span>{employee.email}</span>}
                  {employee.phone && <span>{employee.phone}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/local/employees/edit/${employee.id}`}>
                  <Button variant="secondary" className="px-3 py-2 text-[0.85rem]">
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  className="px-3 py-2 text-[0.85rem]"
                  onClick={() => setDeleteId(employee.id)}
                >
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar empleado"
        description="Esta accion no se puede deshacer. El empleado sera desactivado permanentemente."
        confirmLabel="Eliminar"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
