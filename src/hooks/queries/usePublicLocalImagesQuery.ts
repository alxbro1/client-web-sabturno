import { useQuery } from "@tanstack/react-query";
import { localService } from "@/services/local";
import { queryKeys } from "@/lib/queryKeys";
import type { PublicLocalImage } from "@/lib/types/local";

/**
 * Public gallery/logo/cover images for the local profile hero. Images rarely
 * change, so a longer `staleTime` avoids refetching on every step of the
 * booking flow.
 */
export function usePublicLocalImagesQuery(localId: string | null | undefined) {
  return useQuery<PublicLocalImage[], Error>({
    queryKey: queryKeys.publicLocalImages(localId ?? ""),
    queryFn: () => localService.getPublicImages(localId!),
    enabled: !!localId,
    staleTime: 5 * 60 * 1000,
  });
}
