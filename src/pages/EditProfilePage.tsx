import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Field";
import { validateEmail } from "@/lib/utils/validation";
import { userProfileService } from "@/services/userProfile";
import { useAuthStore } from "@/stores/auth";

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailErrors = useMemo(() => validateEmail(formData.email), [formData.email]);
  const canSave = formData.name.trim() && formData.phone.trim() && emailErrors.length === 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id || !canSave) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (imageFile) {
        const imageResponse = await userProfileService.uploadProfileImage(user.id, imageFile);
        updateUserProfile({ imageProfile: imageResponse.imageProfile });
      }

      const response = await userProfileService.updateUserProfile(user.id, formData);
      updateUserProfile({
        name: response.name,
        email: response.email,
        phone: response.phone,
        imageProfile: response.imageProfile || response.imageProfile,
      });
      navigate("/profile", { replace: true });
    } catch (caughtError: any) {
      setError(caughtError?.response?.data?.message || "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-6">
      <header className="flex justify-between gap-4 items-center max-sm:flex-col max-sm:items-stretch">
        <div>
          <p className="eyebrow">Perfil</p>
          <h2>Editar perfil</h2>
          <p>Actualiza tus datos desde la web y conserva el mismo backend de la app movil.</p>
        </div>
      </header>

      <form className="surface grid gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <InputField label="Nombre" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
          <InputField label="Telefono" value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} />
        </div>

        <InputField
          label="Correo electronico"
          type="email"
          value={formData.email}
          onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
          errors={emailErrors}
        />

        <label className="grid gap-[0.45rem]">
          <span className="text-[0.9rem] text-slate-100">Imagen de perfil</span>
          <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
        </label>

        {error ? <div className="rounded-2xl px-4 py-[0.95rem] border border-white/[0.18] bg-red-950/40 text-red-200">{error}</div> : null}

        <div className="flex flex-wrap gap-4 items-center">
          <Button type="submit" disabled={!canSave || saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/profile")}>Cancelar</Button>
        </div>
      </form>
    </section>
  );
}