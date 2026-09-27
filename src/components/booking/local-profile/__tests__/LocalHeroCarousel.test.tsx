import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalHeroCarousel } from "../LocalHeroCarousel";

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

const BASE_PROPS = {
  logoUrl: null,
  localName: "Peluqueria Centro",
  city: "CABA",
  province: "Buenos Aires",
};

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMatchMedia(false);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LocalHeroCarousel: gallery", () => {
  const images = ["a.jpg", "b.jpg", "c.jpg"];

  it("renders every gallery photo and a 1-based counter", () => {
    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={images} coverImageUrl={null} />,
    );

    expect(screen.getAllByRole("img", { name: /Foto \d de Peluqueria Centro/ })).toHaveLength(3);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver foto 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver foto 3" })).toBeInTheDocument();
  });

  it("auto-advances every 4s", () => {
    vi.useFakeTimers();
    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={images} coverImageUrl={null} />,
    );

    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("clicking a dot switches the photo and pauses auto-advance", () => {
    vi.useFakeTimers();
    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={images} coverImageUrl={null} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver foto 3" }));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("does not auto-advance under prefers-reduced-motion", () => {
    mockMatchMedia(true);
    vi.useFakeTimers();
    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={images} coverImageUrl={null} />,
    );

    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });
});

describe("LocalHeroCarousel: fallbacks", () => {
  it("shows the static cover image with no dots/counter when there is no gallery", () => {
    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={[]} coverImageUrl="cover.jpg" />,
    );

    const images = screen.getAllByRole("img", { name: /Foto \d/ });
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("src", "cover.jpg");
    expect(screen.queryByText(/\d \/ \d/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver foto/ })).not.toBeInTheDocument();
  });

  it("shows the neutral pattern with no photo when there is neither gallery nor cover", () => {
    render(<LocalHeroCarousel {...BASE_PROPS} galleryImages={[]} coverImageUrl={null} />);

    expect(screen.queryByRole("img", { name: /Foto \d/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-empty-pattern")).toBeInTheDocument();
  });

  it("shows a single gallery photo as static with no dots/counter", () => {
    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={["only.jpg"]} coverImageUrl={null} />,
    );

    expect(screen.getAllByRole("img", { name: /Foto \d/ })).toHaveLength(1);
    expect(screen.queryByText(/\d \/ \d/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver foto/ })).not.toBeInTheDocument();
  });
});

describe("LocalHeroCarousel: share button", () => {
  it("uses the Web Share API when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });

    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={["a.jpg"]} coverImageUrl={null} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir local" }));
    });

    expect(share).toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();

    delete (navigator as { share?: unknown }).share;
  });

  it("falls back to copying the link and shows a toast when Web Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={["a.jpg"]} coverImageUrl={null} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir local" }));
    });

    expect(writeText).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalled();
  });
});

describe("LocalHeroCarousel: logo overlay", () => {
  it("renders initials when there is no logo image", () => {
    render(
      <LocalHeroCarousel {...BASE_PROPS} galleryImages={[]} coverImageUrl={null} />,
    );

    expect(screen.getByText("PC")).toBeInTheDocument();
  });

  it("renders the logo image when given", () => {
    render(
      <LocalHeroCarousel
        {...BASE_PROPS}
        logoUrl="logo.jpg"
        galleryImages={[]}
        coverImageUrl={null}
      />,
    );

    expect(screen.getByAltText("Logo de Peluqueria Centro")).toHaveAttribute(
      "src",
      "logo.jpg",
    );
  });
});
