import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SplashScreen } from "@/components/SplashScreen";

describe("SplashScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom no garantiza matchMedia; se fija en "sin reduced-motion" para que
    // el fade (y por lo tanto los tiempos del test) sea deterministico.
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("muestra la atribucion de marca con el logo y el claim en mayusculas", () => {
    render(<SplashScreen />);

    expect(screen.getByText("POWERED BY")).toBeInTheDocument();
    expect(screen.getByText("SOFTWARE A MEDIDA")).toBeInTheDocument();

    const logo = screen.getByAltText("ANØMAL");
    expect(logo).toHaveAttribute("src", "/anomal-logo-white.svg");
  });

  it("se desmonta solo cuando termina la permanencia mas el fade", () => {
    render(<SplashScreen />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    // Durante el fade sigue montado: desmontarlo antes cortaria la transicion.
    expect(screen.getByTestId("splash-screen")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByTestId("splash-screen")).not.toBeInTheDocument();
  });

  it("se puede descartar con un click sin esperar el timeout", () => {
    render(<SplashScreen />);

    fireEvent.click(screen.getByTestId("splash-screen"));

    expect(screen.queryByTestId("splash-screen")).not.toBeInTheDocument();
  });

  it("no atrapa al lector de pantalla", () => {
    render(<SplashScreen />);

    expect(screen.getByTestId("splash-screen")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
