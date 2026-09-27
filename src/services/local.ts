import { apiService } from "@/lib/api";
import type { Local, PublicLocalImage } from "@/lib/types/local";

export interface LocalesPaginated {
  items: Local[];
  nextCursor?: string | null;
  prevCursor?: string | null;
}

export const localService = {
  async getLocales(params?: { cursor?: string; limit?: number }) {
    const query = new URLSearchParams();

    if (params?.cursor) {
      query.set("cursor", params.cursor);
    }

    if (params?.limit) {
      query.set("limit", String(params.limit));
    }

    const response = await apiService.get<LocalesPaginated>(
      `/local/available${query.toString() ? `?${query.toString()}` : ""}`,
    );

    return response.data;
  },
  /**
   * `GET /local/:id/public-images` — public (no auth), returns only active
   * LOGO/COVER_IMAGE/GALLERY_IMAGE rows, ordered. `[]` when the local has
   * none or does not exist (backend convention, see
   * `backend/src/local/local.repository.ts` → `findPublicImages`).
   */
  async getPublicImages(localId: string): Promise<PublicLocalImage[]> {
    const response = await apiService.get<PublicLocalImage[]>(
      `/local/${localId}/public-images`,
    );
    return response.data;
  },
};