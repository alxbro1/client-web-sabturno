"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { localService } from "@/features/local/services/local.service";
import type { Local } from "@/lib/types/local";

export default function LocalProfilePage() {
  const { user, updateUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadLocalData();
    }
  }, [user?.id]);

  async function loadLocalData() {
    try {
      const response = await localService.getLocales();
      const local = response.items.find((l: Local) => l.id === user?.id);
      if (local) {
        setFormData({
          name: local.name || "",
          email: local.email || "",
          phone: local.phone || "",
          address: local.address || "",
          city: local.city || "",
          province: local.province || "",
        });
      }
    } catch (err) {
      console.error("Error loading local data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await localService.updateLocal(user.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address,
        city: formData.city,
        province: formData.province,
      });

      if (formData.name !== user.name) {
        updateUserProfile({ name: formData.name, localName: formData.name });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="grid gap-6">
        <header>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Configuracion
          </p>
          <h2 className="text-2xl font-bold text-white">Perfil del local</h2>
        </header>
        <div className="min-h-[300px] grid place-items-center text-white/50">
          Cargando datos del local...
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <header>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
          Configuracion
        </p>
        <h2 className="text-2xl font-bold text-white">Perfil del local</h2>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">
            Informacion del negocio
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Nombre del local *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50 focus:ring-1 focus:ring-[#00f068]/30 transition-all"
                placeholder="Nombre de tu negocio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email de contacto *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50 focus:ring-1 focus:ring-[#00f068]/30 transition-all"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Telefono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50 focus:ring-1 focus:ring-[#00f068]/30 transition-all"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Provincia *
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleChange("province", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50 focus:ring-1 focus:ring-[#00f068]/30 transition-all"
                placeholder="Buenos Aires"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Ciudad *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50 focus:ring-1 focus:ring-[#00f068]/30 transition-all"
                placeholder="Ciudad"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Direccion *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#00f068]/50 focus:ring-1 focus:ring-[#00f068]/30 transition-all"
                placeholder="Calle y numero"
              />
            </div>
          </div>
        </div>

        {saveError && (
          <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-2xl border border-[#00f068]/40 bg-[rgba(0,240,104,0.1)] px-4 py-[0.95rem] text-[#00f068] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Cambios guardados exitosamente
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <span className="flex items-center gap-2">
              <Save className="w-5 h-5" /> {isSaving ? "Guardando..." : "Guardar cambios"}
            </span>
          </Button>
        </div>
      </form>
    </section>
  );
}
