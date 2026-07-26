import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import LocalLoyaltyPage from "../page";

const {
  mockDevelopmentMutate,
  mockInvalidateQueries,
  mockUseMutation,
  mockUseQuery,
} = vi.hoisted(() => ({
  mockDevelopmentMutate: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockUseMutation: vi.fn(),
  mockUseQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: mockUseMutation,
  useQuery: mockUseQuery,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "local-1",
      isLocal: true,
      timezone: "America/Argentina/Buenos_Aires",
    },
  }),
}));

vi.mock("@/hooks/queries/usePremiumStatusQuery", () => ({
  usePremiumStatusQuery: () => ({ data: { tier: "enterprise" } }),
}));

vi.mock("@/hooks/queries/useServicesQuery", () => ({
  useServicesQuery: () => ({
    data: [{ id: 1, name: "Corte" }],
  }),
}));

vi.mock("@/services/loyalty", () => ({
  loyaltyService: {
    completeAppointmentForDevelopment: vi.fn(),
  },
}));

vi.mock("@/services/timeline", () => ({
  timelineService: {
    getAppointmentsByEntity: vi.fn(),
  },
}));

function mutationResult(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    reset: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "development");

  mockUseQuery.mockImplementation(
    ({ queryKey }: { queryKey: readonly string[] }) => {
      if (queryKey[1] === "owner") {
        return {
          data: {
            program: null,
            metrics: { cardsCount: 0, availableRewards: 0 },
          },
          isLoading: false,
        };
      }
      if (queryKey[1] === "development-appointments") {
        return {
          data: {
            items: [
              {
                id: 42,
                state: "CONFIRMED",
                startDateTime: "2026-07-27T13:00:00.000Z",
                user: { name: "Ana" },
                service: { name: "Corte" },
              },
            ],
          },
        };
      }
      return { data: [] };
    },
  );

  mockUseMutation.mockReturnValue(
    mutationResult({ mutate: mockDevelopmentMutate }),
  );
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("LocalLoyaltyPage development tools", () => {
  it("requires explicit confirmation before completing the selected appointment", () => {
    render(<LocalLoyaltyPage />);

    expect(screen.getByText("Herramientas de prueba")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Turno confirmado"), {
      target: { value: "42" },
    });

    const action = screen.getByRole("button", {
      name: "Completar para prueba",
    });
    expect(action).toBeDisabled();

    fireEvent.click(
      screen.getByLabelText(
        /Confirmo que quiero marcar este turno como completado/,
      ),
    );
    expect(action).not.toBeDisabled();

    fireEvent.click(action);
    expect(mockDevelopmentMutate).toHaveBeenCalledWith(42);
  });
});
