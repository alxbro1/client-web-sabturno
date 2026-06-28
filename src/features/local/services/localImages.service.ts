import { apiService } from '@/lib/api';
import { LocalImage, ImageUploadRequest } from '../types/local.types';

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export const localImagesService = {
  getLocalImages: async (localId: string): Promise<LocalImage[]> => {
    try {
      const response = await apiService.get<{ items?: LocalImage[] }>(`/local/${localId}/images`);
      const data = response.data;

      if (data?.items && Array.isArray(data.items)) {
        return data.items.map((it: any) => ({
          id: it.id,
          url: it.url ?? it.image ?? '',
          image: it.image ?? it.url ?? '',
          description: it.description ?? undefined,
          uploadedAt: it.createdAt ?? it.uploadedAt ?? it.updatedAt ?? '',
          localId: it.localId,
        })) as LocalImage[];
      }

      return [];
    } catch (error) {
      console.error('Error fetching local images:', error);
      return [];
    }
  },

  uploadLocalImage: async (
    localId: string,
    imageData: ImageUploadRequest
  ): Promise<LocalImage | null> => {
    try {
      const formData = new FormData();
      const blob = dataUrlToBlob(imageData.uri);
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      formData.append('image', file);

      if (imageData.description) {
        formData.append('description', imageData.description);
      }

      const response = await apiService.post<LocalImage>(
        `/local/${localId}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  },

  deleteLocalImage: async (imageId: number): Promise<boolean> => {
    try {
      await apiService.delete(`/local/images/${imageId}`);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  },

  /**
   * Sube el logo/imagen de perfil del local.
   * Endpoint: `POST /local/:id/image` (singular, distinto al de galeria).
   * Ver `backend/src/local/local.controller.ts:115-145`.
   */
  uploadLocalLogo: async (
    localId: string,
    imageData: ImageUploadRequest,
  ): Promise<LocalImage | null> => {
    try {
      const formData = new FormData();
      const blob = dataUrlToBlob(imageData.uri);
      const file = new File([blob], 'logo.jpg', { type: 'image/jpeg' });
      formData.append('image', file);

      const response = await apiService.post<LocalImage>(
        `/local/${localId}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading local logo:', error);
      return null;
    }
  },
};