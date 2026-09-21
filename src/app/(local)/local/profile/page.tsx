"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, ImageIcon, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { localService } from "@/features/local/services/local.service";
import { localImagesService } from "@/features/local/services/localImages.service";
import { useImageUpload } from "@/features/local/hooks/useImageUpload";
import { queryKeys } from "@/lib/queryKeys";

export default function LocalProfilePage() {
  const { user, updateUserProfile } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    notifyNewAppointmentWhatsapp: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // El logo se sube con `POST /local/:id/image`, un endpoint distinto del
  // PATCH del formulario, asi que tiene su propio estado de guardado.
  const {
    preview: logoPreview,
    hasNewImage: hasNewLogo,
    isProcessing: isProcessingLogo,
    error: logoError,
    selectFile: selectLogoFile,
    setError: setLogoError,
    commit: commitLogo,
    reset: resetLogo,
  } = useImageUpload({ initialPreview: user?.imageProfile ?? null });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadLocalData();
    }
  }, [user?.id]);

  async function loadLocalData() {
    if (!user?.id) return;

    try {
      // `GET /local/:id` is the source of truth for the owner's own business.
      // The paginated `/local/available` list only returns businesses with
      // active schedules and services, so it can silently miss this local.
      const local = await localService.getLocal(user.id);
      if (local) {
        setFormData({
          name: local.name || "",
          email: local.email || "",
          phone: local.phone || "",
          address: local.address || "",
          city: local.city || "",
          province: local.province || "",
          notifyNewAppointmentWhatsapp: Boolean(
            local.notifyNewAppointmentWhatsapp,
          ),
        });
        resetLogo(local.imageProfile ?? user.imageProfile ?? null);
      }
    } catch (err) {
      console.error("Error loading local data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // The WhatsApp notification is delivered to the business phone, so
      // clearing the phone must also turn the notification off.
      if (field === "phone" && !value.trim()) {
        next.notifyNewAppointmentWhatsapp = false;
      }
      return next;
    });
    setSaveError(null);
    setSaveSuccess(false);
  }

  function handleToggleWhatsappNotification(checked: boolean) {
    setFormData((prev) => ({
      ...prev,
      notifyNewAppointmentWhatsapp: checked,
    }));
    setSaveError(null);
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
        notifyNewAppointmentWhatsapp: formData.notifyNewAppointmentWhatsapp,
      });

      if (formData.name !== user.name) {
        updateUserProfile({ name: formData.name, localName: formData.name });
      }

      // Keep the cached `Local` in sync so the rest of the panel reflects the
      // new values without a re-login (same approach as
      // `useUpdatePaymentMethodsMutation`).
      queryClient.invalidateQueries({ queryKey: queryKeys.local(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.localHome(user.id) });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      // The backend rejects enabling the WhatsApp notification without a valid
      // mobile phone, but its message is in English. Show our own copy.
      if (err?.response?.status === 400 && formData.notifyNewAppointmentWhatsapp) {
        setSaveError(
          "No pudimos activar el aviso por WhatsApp. El teléfono del negocio debe ser un celular válido con código de área.",
        );
      } else {
        setSaveError(err?.message || "Error al guardar los cambios");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadLogo() {
    if (!user?.id) return;
    if (!logoPreview || !hasNewLogo) {
      setLogoError("Elegí una imagen nueva para reemplazar el logo.");
      return;
    }

    setIsUploadingLogo(true);
    setLogoError(null);
    setLogoSuccess(false);

    try {
      const result = await localImagesService.uploadLocalLogo(user.id, {
        uri: logoPreview,
      });
      // `uploadLocalLogo` atrapa el error y devuelve null, asi que un null es
      // un fallo, no una respuesta vacia.
      if (!result) throw new Error("No pudimos subir el logo. Proba de nuevo.");

      const imageUrl = result.image || result.url || null;
      commitLogo(imageUrl);
      if (imageUrl) updateUserProfile({ imageProfile: imageUrl });

      queryClient.invalidateQueries({ queryKey: queryKeys.local(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.localHome(user.id) });

      setLogoSuccess(true);
      setTimeout(() => setLogoSuccess(false), 3000);
    } catch (err: any) {
      setLogoError(err?.message || "No pudimos subir el logo. Proba de nuevo.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  // The WhatsApp notification is sent to the business phone. The backend
  // rejects enabling the flag without one, so the toggle stays disabled until
  // a phone is typed (it travels in the same PATCH, so no prior save needed).
  const hasPhone = formData.phone.trim().length > 0;

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 gap-6">
        <header>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-primary">
            Configuracion
          </p>
          <h2 className="text-2xl font-bold text-white">Perfil del local</h2>
        </header>
        <div className="min-h-[300px] grid place-items-center text-muted-foreground">
          Cargando datos del local...
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6">
      <header>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-primary">
          Configuracion
        </p>
        <h2 className="text-2xl font-bold text-white">Perfil del local</h2>
      </header>

      <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-6 grid grid-cols-1 gap-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Logo del local</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Es la imagen que ven los clientes cuando buscan tu negocio. PNG, JPG
            o WEBP, hasta 5MB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo del local"
              className="size-24 shrink-0 rounded-2xl border border-white/12 object-cover"
            />
          ) : (
            <div className="size-24 shrink-0 grid place-items-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] text-muted-foreground/70">
              <ImageIcon className="size-8" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 min-w-0">
            <input
              type="file"
              id="local-logo-input"
              accept="image/*"
              className="sr-only"
              disabled={isProcessingLogo || isUploadingLogo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void selectLogoFile(file);
                // Permite volver a elegir el mismo archivo tras descartarlo.
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              {/* `<label htmlFor>` en vez de un click sintetico sobre el input:
                  asi el control es alcanzable por teclado sin JS. */}
              <label
                htmlFor="local-logo-input"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[14px] border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/10"
              >
                <Upload className="size-4" />
                {isProcessingLogo
                  ? "Procesando..."
                  : logoPreview
                    ? "Cambiar logo"
                    : "Subir logo"}
              </label>

              {hasNewLogo && (
                <>
                  <Button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? "Guardando..." : "Guardar logo"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isUploadingLogo}
                    onClick={() => resetLogo(user?.imageProfile ?? null)}
                  >
                    Descartar
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasNewLogo
                ? "Imagen nueva sin guardar."
                : logoPreview
                  ? "Este es el logo actual."
                  : "Todavía no cargaste un logo."}
            </p>
          </div>
        </div>

        {logoError && (
          <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
            {logoError}
          </div>
        )}

        {logoSuccess && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-[0.95rem] text-primary flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Logo actualizado
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">
            Informacion del negocio
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre del local *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Nombre de tu negocio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email de contacto *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Provincia *
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleChange("province", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Buenos Aires"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ciudad *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Ciudad"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Direccion *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Calle y número"
              />
            </div>
          </div>
        </div>

        <div className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">Notificaciones</h3>

          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div className="space-y-1">
              <span className="block text-sm font-medium text-foreground">
                Avisarme por WhatsApp cuando un cliente saque un turno
              </span>
              <span className="block text-sm text-muted-foreground">
                Enviamos un mensaje al teléfono del negocio cada vez que se
                reserva un turno nuevo.
              </span>
              {!hasPhone && (
                <span className="block text-sm text-[#ffd6df]">
                  Para activar este aviso es necesario cargar el teléfono del negocio.
                </span>
              )}
            </div>
            <Switch
              aria-label="Avisarme por WhatsApp cuando un cliente saque un turno"
              checked={formData.notifyNewAppointmentWhatsapp}
              onCheckedChange={handleToggleWhatsappNotification}
              disabled={!hasPhone}
            />
          </label>
        </div>

        {saveError && (
          <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-[0.95rem] text-primary flex items-center gap-2">
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
