import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePublicLocalImagesQuery } from "@/hooks/queries/usePublicLocalImagesQuery";
import type { PublicLocalImage } from "@/lib/types/local";

const mockLocalService = vi.hoisted(() => ({
  getPublicImages: vi.fn(),
}));

vi.mock("@/services/local", () => ({
  localService: mockLocalService,
}));

const LOCAL_ID = "local-1";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePublicLocalImagesQuery", () => {
  it("returns the public images for the local", async () => {
    const images: PublicLocalImage[] = [
      { id: 1, url: "https://cdn/logo.jpg", type: "LOGO", order: 0 },
    ];
    mockLocalService.getPublicImages.mockResolvedValue(images);

    const { result } = renderHook(() => usePublicLocalImagesQuery(LOCAL_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(images);
    expect(mockLocalService.getPublicImages).toHaveBeenCalledWith(LOCAL_ID);
  });

  it("is disabled when localId is missing", () => {
    renderHook(() => usePublicLocalImagesQuery(null), {
      wrapper: createWrapper(),
    });

    expect(mockLocalService.getPublicImages).not.toHaveBeenCalled();
  });
});
