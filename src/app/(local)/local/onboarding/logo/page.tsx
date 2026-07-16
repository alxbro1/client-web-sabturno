"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, ArrowRight, CheckCircle2, ImageIcon } from "lucide-react";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStore } from "@/stores/onboarding";
import { localImagesService } from "@/features/local/services/localImages.service";
import { imageUploadUtils } from "@/features/local/utils/imageUploadUtils";
import { queryKeys } from "@/lib/queryKeys";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Step 1 del wizard: subir el logo del local.
 *
 * - Usa el endpoint `POST /local/:id/image` (singular, no galeria).
 * - Si el usuario ya tiene logo, lo mantiene y permite "Saltar".
 * - Al guardar, actualiza `useAuth.user.imageProfile` y el cache
 *   del local para que el resto de la UI se entere.
 */
export default function OnboardingLogoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateUserProfile } = useAuth();
  const { setHasLogo } = useOnboardingStore();
  const queryClient = useQueryClient();

  const [preview, setPreview] = useState<string | null>(user?.imageProfile ?? null);
  const [error, setError] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false);

  const localId = user?.id ?? "";

  const uploadMutation = useMutation({
    mutationFn: async (uri: string) => {
      const result = await localImagesService.uploadLocalLogo(localId, { uri });
      if (!result) {
        throw new Error("No se recibio respuesta del servidor");
      }
      return result;
    },
    onSuccess: (data) => {
      const imageUrl = data.image || data.url;
      if (imageUrl) {
        updateUserProfile({ imageProfile: imageUrl });
        setPreview(imageUrl);
      }
      setHasLogo(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.localHome(localId) });
      toast.success("Logo guardado correctamente");
      router.push("/local/onboarding/subscription");
    },
    onError: (err: Error) => {
      setError(err.message || "No se pudo subir el logo");
      toast.error("No se pudo subir el logo. Intenta de nuevo.");
    },
  });

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar mas de 5MB");
      return;
    }

    try {
      const uri = await readFileAsDataUrl(file);
      const compressed = await imageUploadUtils.compressImage(uri, {
        width: 800,
        height: 800,
        compress: 0.8,
      });
      setPreview(compressed);
      setHasNewImage(true);
    } catch (err) {
      console.error("Error procesando imagen:", err);
      setError("No se pudo procesar la imagen");
    }
  }

  async function handleSave() {
    if (!preview) {
      setError("Selecciona una imagen primero");
      return;
    }
    uploadMutation.mutate(preview);
  }

  function handleSkip() {
    if (!user?.imageProfile) {
      // No tiene logo aun. Marcar como completado en el store y avanzar.
      setHasLogo(true);
    }
    router.push("/local/onboarding/subscription");
  }

  return (
    <section className="grid gap-6 max-w-2xl mx-auto">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Paso 1 de 3
        </p>
        <h2 className="text-2xl font-bold text-foreground mt-1">
          Subi el logo de tu local
        </h2>
        <p className="text-muted-foreground mt-2">
          Es la imagen que veran los clientes cuando busquen tu negocio.
          Podes saltear este paso y agregarlo despues.
        </p>
      </header>

      <div className="grid gap-4">
        <div
          className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center bg-white/[0.02]"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
        >
          {preview ? (
            <div className="grid place-items-center gap-3">
              <img
                src={preview}
                alt="Logo del local"
                className="max-h-48 rounded-2xl border border-white/10"
              />
              <p className="text-sm text-muted-foreground">
                {hasNewImage ? "Nueva imagen seleccionada" : "Logo actual"}
              </p>
            </div>
          ) : (
            <div className="grid place-items-center gap-3 py-6 text-muted-foreground">
              <ImageIcon className="size-10 opacity-50" />
              <p>Arrastra una imagen aqui o haz clic para seleccionar</p>
              <p className="text-xs">PNG, JPG o WEBP. Max 5MB.</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Button
              variant="secondary"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {preview ? "Cambiar imagen" : "Subir imagen"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="ghost" onClick={handleSkip}>
            Saltar por ahora
          </Button>
          <Button
            onClick={handleSave}
            disabled={!preview || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              "Subiendo..."
            ) : (
              <>
                {hasNewImage ? <CheckCircle2 className="size-4" /> : null}
                Continuar
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
