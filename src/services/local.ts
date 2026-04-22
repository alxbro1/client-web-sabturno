import { apiService } from "@/lib/api";
import type { Local } from "@/lib/types/local";

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
};