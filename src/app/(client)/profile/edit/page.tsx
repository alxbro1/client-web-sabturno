"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { validateEmail } from "@/lib/utils/validation";
import { userProfileService } from "@/services/userProfile";
import { useAuthStore } from "@/stores/auth";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailErrors = useMemo(
    () => validateEmail(formData.email),
    [formData.email],
  );
  const canSave =
    formData.name.trim() && formData.phone.trim() && emailErrors.length === 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id || !canSave) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (imageFile) {
        const imageResponse = await userProfileService.uploadProfileImage(
          user.id,
          imageFile,
        );
        updateUserProfile({ imageProfile: imageResponse.imageProfile });
      }

      const response = await userProfileService.updateUserProfile(
        user.id,
        formData,
      );
      updateUserProfile({
        name: response.name,
        email: response.email,
        phone: response.phone,
        imageProfile: response.imageProfile || response.imageProfile,
      });
      router.replace("/profile");
    } catch (caughtError: any) {
      setError(
        caughtError?.response?.data?.message ||
          "No se pudo actualizar el perfil",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">
            Perfil
          </p>
          <h2>Editar perfil</h2>
          <p>
            Actualiza tus datos desde la web y conserva el mismo backend de la
            app movil.
          </p>
        </div>
      </header>

      <form
        className="border border-white/12 bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.95))] rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-[12px] p-5 grid gap-4"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <InputField
            label="Nombre"
            value={formData.name}
            onChange={(event) =>
              setFormData((current) => ({ ...current, name: event.target.value }))
            }
          />
          <InputField
            label="Telefono"
            value={formData.phone}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
          />
        </div>

        <InputField
          label="Correo electronico"
          type="email"
          value={formData.email}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          errors={emailErrors}
        />

        <label className="grid gap-[0.45rem]">
          <span className="text-[0.86rem] font-semibold tracking-[0.04em] text-white/88">
            Imagen de perfil
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setImageFile(event.target.files?.[0] || null)
            }
            className="w-full border border-white/16 bg-[rgba(255,255,255,0.03)] text-white rounded-2xl px-4 py-[0.75rem] transition-[border-color,box-shadow,background-color] duration-150 focus:border-[#00f068]/55 focus:bg-[rgba(255,255,255,0.045)] focus:outline-none focus:ring-2 focus:ring-[#00f068]/22"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-4 items-center">
          <Button type="submit" disabled={!canSave || saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/profile")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}
