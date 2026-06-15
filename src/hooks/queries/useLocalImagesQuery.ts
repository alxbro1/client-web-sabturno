"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { localImagesService } from "@/features/local/services/localImages.service";
import type {
  LocalImage,
  ImageUploadRequest,
} from "@/features/local/types/local.types";

async function fetchLocalImages(localId: string): Promise<LocalImage[]> {
  return localImagesService.getLocalImages(localId);
}

export function useLocalImagesQuery(localId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.localImages(localId),
    queryFn: () => fetchLocalImages(localId),
    enabled: !!localId,
    staleTime: 60_000,
  });

  const uploadMutation = useMutation({
    mutationFn: (imageData: ImageUploadRequest) =>
      localImagesService.uploadLocalImage(localId, imageData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.localImages(localId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) =>
      localImagesService.deleteLocalImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.localImages(localId),
      });
    },
  });

  return {
    images: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    uploadImage: (imageData: ImageUploadRequest) =>
      uploadMutation.mutateAsync(imageData),
    deleteImage: (imageId: number) => deleteMutation.mutateAsync(imageId),
    refreshImages: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.localImages(localId),
      }),
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
