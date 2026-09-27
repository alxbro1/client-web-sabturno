import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookingStore } from "@/stores/booking";
import { parseBookingQuery } from "@/lib/utils/bookingQuery";
import SelectServicePage from "../page";
import type { Local } from "@/lib/types/local";
import type { Service } from "@/lib/types/booking";

const {
  mockPush,
  mockReplace,
  mockUseSearchParams,
  mockUseServicesQuery,
  mockUseLocalsQuery,
  mockUsePublicLocalImagesQuery,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockUseSearchParams: vi.fn(),
  mockUseServicesQuery: vi.fn(),
  mockUseLocalsQuery: vi.fn(),
  mockUsePublicLocalImagesQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: mockUseSearchParams,
}));

vi.mock("@/hooks/queries/useServicesQuery", () => ({
  useServicesQuery: mockUseServicesQuery,
}));

vi.mock("@/hooks/queries/useLocalsQuery", () => ({
  useLocalsQuery: mockUseLocalsQuery,
}));

vi.mock("@/hooks/queries/usePublicLocalImagesQuery", () => ({
  usePublicLocalImagesQuery: mockUsePublicLocalImagesQuery,
}));

const LOCAL: Local = {
  id: "local-1",
  name: "Peluqueria Centro",
  email: "peluqueria.centro@dev.sabturno",
  province: "Buenos Aires",
  city: "CABA",
  address: "Av. Corrientes 1234",
  phone: "+5491122334455",
  isActive: true,
};

const SERVICE_1: Service = {
  id: 10,
  name: "Corte",
  description: "Corte clásico",
  cost: 5000,
  duration: 30,
  category: "Corte",
  isActive: true,
};
const SERVICE_2: Service = {
  id: 11,
  name: "Color",
  description: "Coloración",
  cost: 12000,
  duration: 90,
  category: "Corte", // same category as SERVICE_1: this test isn't about tab filtering
  isActive: true,
};

function emptySearchParams() {
  return new URLSearchParams();
}

beforeEach(() => {
  vi.clearAllMocks();
  useBookingStore.setState(useBookingStore.getInitialState());
  mockUseSearchParams.mockReturnValue(emptySearchParams());
  mockUseLocalsQuery.mockReturnValue({ locals: [], isLoading: false });
  mockUsePublicLocalImagesQuery.mockReturnValue({ data: [], isLoading: false, error: null });
  mockUseServicesQuery.mockReturnValue({
    data: [SERVICE_1, SERVICE_2],
    isLoading: false,
    error: null,
  });
});

describe("SelectServicePage: redirect guard", () => {
  it("redirects to select-local when there is no local id anywhere", () => {
    render(<SelectServicePage />);
    expect(mockReplace).toHaveBeenCalledWith("/booking/select-local");
  });
});

describe("SelectServicePage: renders the local profile and services", () => {
  beforeEach(() => {
    useBookingStore.setState({ local: LOCAL });
  });

  it("renders the local name and every service", () => {
    render(<SelectServicePage />);

    expect(screen.getByRole("heading", { name: "Peluqueria Centro" })).toBeInTheDocument();
    expect(screen.getByText("Corte clásico")).toBeInTheDocument();
    expect(screen.getByText("Coloración")).toBeInTheDocument();
  });

  it("renders the hero first, without a 'Cambiar local' button above it", () => {
    render(<SelectServicePage />);

    expect(screen.queryByRole("button", { name: /Cambiar local/ })).not.toBeInTheDocument();
  });

  it("does not offer a call button even when the local has a phone", () => {
    render(<SelectServicePage />);

    expect(screen.getByRole("link", { name: "WhatsApp" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /llamar/i })).not.toBeInTheDocument();
  });

  it("offers a shortcut down to the services list", () => {
    render(<SelectServicePage />);

    expect(screen.getByRole("button", { name: "Ir a los servicios" })).toBeInTheDocument();
  });

  it("pushes to select-professional with the local and service id when a service is picked", () => {
    render(<SelectServicePage />);

    fireEvent.click(screen.getByRole("button", { name: /Corte clásico/ }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    const [path, query] = mockPush.mock.calls[0][0].split("?");
    expect(path).toBe("/booking/select-professional");
    const parsed = parseBookingQuery(new URLSearchParams(query));
    expect(parsed.localId).toBe("local-1");
    expect(parsed.serviceId).toBe(10);
  });

  it("prefers the owner-uploaded profile image over a LOGO image as the logo", () => {
    useBookingStore.setState({
      local: { ...LOCAL, imageProfile: "https://s3/uploaded-logo.jpg" },
    });
    mockUsePublicLocalImagesQuery.mockReturnValue({
      data: [{ id: 1, url: "https://s3/seed-logo.png", type: "LOGO", order: 0 }],
      isLoading: false,
      error: null,
    });

    render(<SelectServicePage />);

    expect(screen.getByAltText("Logo de Peluqueria Centro")).toHaveAttribute(
      "src",
      "https://s3/uploaded-logo.jpg",
    );
  });
});
