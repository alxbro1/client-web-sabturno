"use client";

import { useCallback, useState } from "react";
import { imageUploadUtils } from "@/features/local/utils/imageUploadUtils";

const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

type UseImageUploadOptions = {
  /** Ancho maximo del lado largo tras comprimir. */
  width?: number;
  /** Alto maximo del lado largo tras comprimir. */
  height?: number;
  /** Calidad JPEG, 0-1. */
  compress?: number;
  /** Peso maximo del archivo ORIGINAL, antes de comprimir. */
  maxSizeBytes?: number;
  /** Preview inicial (por ejemplo, el logo que ya tiene el local). */
  initialPreview?: string | null;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Paso comun de las tres pantallas que suben imagenes:
 * archivo -> validar tipo/peso -> data URL -> comprimir -> preview.
 *
 * Deliberadamente NO sube nada: cada endpoint es distinto
 * (`/local/:id/image`, `/local/:id/images`, `/users/:id/image`) y la mutacion
 * queda en la pantalla. Lo que se repetia, y divergia, era la validacion.
 */
export function useImageUpload({
  width = 800,
  height = 800,
  compress = 0.8,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  initialPreview = null,
}: UseImageUploadOptions = {}) {
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const [hasNewImage, setHasNewImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError("El archivo tiene que ser una imagen.");
        return;
      }

      if (file.size > maxSizeBytes) {
        const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
        setError(`La imagen no puede pesar mas de ${maxMb}MB.`);
        return;
      }

      setIsProcessing(true);
      try {
        const uri = await readFileAsDataUrl(file);
        const compressed = await imageUploadUtils.compressImage(uri, {
          width,
          height,
          compress,
        });
        setPreview(compressed);
        setHasNewImage(true);
      } catch (err) {
        console.error("Error procesando la imagen:", err);
        setError("No pudimos procesar la imagen. Proba con otro archivo.");
      } finally {
        setIsProcessing(false);
      }
    },
    [compress, height, maxSizeBytes, width],
  );

  /** Tras un upload exitoso: fija la URL definitiva y limpia el estado sucio. */
  const commit = useCallback((uploadedUrl: string | null) => {
    if (uploadedUrl) setPreview(uploadedUrl);
    setHasNewImage(false);
    setError(null);
  }, []);

  const reset = useCallback((nextPreview: string | null = null) => {
    setPreview(nextPreview);
    setHasNewImage(false);
    setIsProcessing(false);
    setError(null);
  }, []);

  return {
    preview,
    hasNewImage,
    isProcessing,
    error,
    selectFile,
    setError,
    commit,
    reset,
  };
}
