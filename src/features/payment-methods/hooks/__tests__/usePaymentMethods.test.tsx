import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState: { token: string | null } = { token: "jwt-123" };

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api", () => ({ API_BASE_URL: "https://api.test" }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "local-1" },
    token: authState.token,
    hasHydrated: true,
  }),
}));
vi.mock("@/hooks/queries/useLocalQuery", () => ({
  useLocalQuery: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("@/hooks/queries/useTaloStatusQuery", () => ({
  useTaloStatusQuery: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
}));
vi.mock("@/services/talo", () => ({
  taloService: { getStatus: vi.fn().mockResolvedValue({ connected: true, accountStatus: "ACTIVE" }) },
}));
vi.mock("@/hooks/mutations/useUpdatePaymentMethodsMutation", () => ({
  useUpdatePaymentMethodsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { usePaymentMethods } from "../usePaymentMethods";

describe("usePaymentMethods — Mercado Pago OAuth", () => {
  let hrefSetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    authState.token = "jwt-123";
    hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin: "https://web.test",
        set href(value: string) {
          hrefSetter(value);
        },
      },
    });
  });

  it("redirects to the backend mobile-start endpoint with the JWT", () => {
    const { result } = renderHook(() => usePaymentMethods());

    act(() => result.current.toggle("mercadoPagoLiveMode"));

    expect(hrefSetter).toHaveBeenCalledTimes(1);
    const url = new URL(hrefSetter.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(
      "https://api.test/mercadopago/oauth/mobile-start",
    );
    expect(url.searchParams.get("token")).toBe("jwt-123");
    expect(url.searchParams.get("app_redirect_uri")).toBe(
      "https://web.test/local/payment-methods/mp/callback",
    );
  });

  it("shows an error and does not redirect when there is no JWT", () => {
    authState.token = null;
    const { result } = renderHook(() => usePaymentMethods());

    act(() => result.current.toggle("mercadoPagoLiveMode"));

    expect(hrefSetter).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/sesión/i);
  });
});
