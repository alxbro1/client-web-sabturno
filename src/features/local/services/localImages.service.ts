import { apiService } from '@/lib/api';
import { LocalImage, ImageUploadRequest } from '../types/local.types';

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
      formData.append('image', {
        uri: imageData.uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

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
};