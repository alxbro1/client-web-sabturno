import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ServiceEditPage from "../EditServiceClient";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "local-1" } }),
}));

vi.mock("@/hooks/queries/useLocalServicesQuery", () => ({
  useLocalServicesQuery: () => ({
    services: [
      { id: 7, name: "Corte", description: "", cost: 5000, duration: 30, category: "haircuts" },
    ],
    isLoading: false,
    createService: vi.fn(),
    updateService: vi.fn(),
  }),
}));

describe("ServiceEditPage: category select", () => {
  it("keeps a category saved by the mobile app selected, shown in Spanish", () => {
    render(<ServiceEditPage />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("haircuts");
    expect(select.selectedOptions[0]).toHaveTextContent("Cortes de cabello");
  });
});
