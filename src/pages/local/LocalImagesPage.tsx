import { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { useLocalImages } from "@/features/local/hooks/useLocalImages";
import { imageUploadUtils } from "@/features/local/utils/imageUploadUtils";
import { useAuthStore } from "@/stores/auth";

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function LocalImagesPage() {
  const { user } = useAuthStore();
  const localId = user?.id || '';
  const { images, isLoading, uploadImage, deleteImage, refreshImages } = useLocalImages(localId);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uri = await readFileAsDataUrl(file);
        const compressed = await imageUploadUtils.compressImage(uri, {
          width: 1200,
          height: 1200,
          compress: 0.8,
        });

        await uploadImage(localId, { uri: compressed });
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
    } catch (err) {
      setError('Error al subir la imagen. Intenta de nuevo.');
      console.error('Error uploading image:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadImage]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleDelete() {
    if (deleteId === null) return;
    setIsDeleting(true);
    try {
      await deleteImage(deleteId);
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting image:', err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="grid gap-6">
      <header>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-[#00f068]">Configuracion</p>
        <h2 className="text-2xl font-bold text-white">Fotos del local</h2>
      </header>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-[28px] p-8 text-center transition-all
          ${isDragging
            ? 'border-[#00f068] bg-[#00f068]/10'
            : 'border-white/15 bg-white/[0.02] hover:border-white/25'}
        `}
      >
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isUploading}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <div className={`text-white/40 ${isDragging ? 'text-[#00f068]' : ''}`}>
            <IconUpload />
          </div>
          <div>
            <p className="text-white font-medium">
              {isUploading ? `Subiendo... ${uploadProgress}%` : 'Arrastra imagenes aqui o haz clic'}
            </p>
            <p className="text-sm text-white/50 mt-1">PNG, JPG hasta 10MB</p>
          </div>
        </label>
      </div>

      {error && (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[200px] grid place-items-center text-white/50">
          Cargando imagenes...
        </div>
      ) : images.length === 0 ? (
        <div className="min-h-[200px] grid place-items-center text-center rounded-[28px] border border-white/10 bg-white/[0.02] p-8">
          <div className="text-white/40 mb-4">
            <IconImage />
          </div>
          <p className="text-white/60">No hay fotos del local.</p>
          <p className="text-sm text-white/40 mt-1">Sube imagenes para que los clientes puedan ver tu negocio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]"
            >
              <img
                src={image.url || image.image}
                alt={image.description || 'Imagen del local'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                onClick={() => setDeleteId(image.id)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-[#ff5678]/80 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-[#ff5678]"
              >
                <IconDelete />
              </button>
              {image.description && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white/80 truncate">{image.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="text-center text-white/50 text-sm">
          {images.length} imagen{images.length !== 1 ? 'es' : ''} del local
        </div>
      )}

      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="border border-white/12 bg-[#141414] rounded-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.5)] p-6 w-full max-w-sm">
          <h3 className="text-xl font-bold text-white mb-2">Eliminar imagen</h3>
          <p className="text-white/60 mb-6">Esta seguro de que desea eliminar esta imagen? Esta accion no se puede deshacer.</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteId(null)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}