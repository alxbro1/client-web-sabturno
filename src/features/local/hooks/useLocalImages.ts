import { useCallback, useEffect, useRef, useState } from 'react';
import { localImagesService } from '../services/localImages.service';
import { ImageUploadRequest, LocalImage } from '../types/local.types';

export interface UseLocalImagesResult {
  images: LocalImage[];
  isLoading: boolean;
  error: string | null;
  uploadImage: (localId: string, imageData: ImageUploadRequest) => void;
  deleteImage: (imageId: number) => void;
  refreshImages: () => void;
}

export const useLocalImages = (localId: string): UseLocalImagesResult => {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [currentOperation, setCurrentOperation] = useState<{
    type: 'fetch' | 'upload' | 'delete';
    params?: any;
  } | null>(null);
  const hasLoadedRef = useRef(false);

  const operation = useCallback(async () => {
    if (!currentOperation) return null;

    switch (currentOperation.type) {
      case 'fetch':
        return await localImagesService.getLocalImages(localId);

      case 'upload':
        const { uploadLocalId, imageData } = currentOperation.params;
        return await localImagesService.uploadLocalImage(uploadLocalId, imageData);

      case 'delete':
        const { imageId: deleteImageId } = currentOperation.params;
        return await localImagesService.deleteLocalImage(deleteImageId);

      default:
        return null;
    }
  }, [currentOperation, localId]);

  const executeOperation = useCallback(async () => {
    if (!currentOperation) return;

    setImages(prev => prev);

    try {
      const result = await operation();
      if (!result) return;

      switch (currentOperation.type) {
        case 'fetch':
          if (Array.isArray(result)) setImages(result as LocalImage[]);
          break;
        case 'upload':
        case 'delete':
          setCurrentOperation({ type: 'fetch' });
          break;
      }
    } catch (err) {
      console.error('Error in useLocalImages:', err);
    }
  }, [currentOperation, operation]);

  useEffect(() => {
    if (!currentOperation) return;
    executeOperation();
  }, [currentOperation, executeOperation]);

  useEffect(() => {
    if (localId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setCurrentOperation({ type: 'fetch' });
    }
  }, [localId]);

  const refreshImages = useCallback(() => {
    setCurrentOperation({ type: 'fetch' });
  }, []);

  const uploadImage = useCallback((uploadLocalId: string, imageData: ImageUploadRequest) => {
    setCurrentOperation({ type: 'upload', params: { uploadLocalId, imageData } });
  }, []);

  const deleteImage = useCallback((imageId: number) => {
    setCurrentOperation({ type: 'delete', params: { imageId } });
  }, []);

  return {
    images,
    isLoading: !!currentOperation,
    error: null,
    uploadImage,
    deleteImage,
    refreshImages,
  };
};