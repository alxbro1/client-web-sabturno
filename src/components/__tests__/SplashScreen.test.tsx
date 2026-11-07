import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SPLASH_FADE_START_MS,
  SPLASH_TOTAL_MS,
  SplashScreen,
} from "@/components/SplashScreen";
import {
  ANOMAL_INTRO_DURATION_MS,
  ANOMAL_INTRO_MIN_DEADLINE_MS,
} from "@/components/AnomalLogoIntro";

describe("SplashScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // El requisito es que el splash aparezca antes que cualquier otro contenido,
  // incluido el "Cargando...". Eso solo se cumple si viene en el HTML del
  // servidor: si el overlay se decidiera en un efecto, el primer paint seria la
  // app. Este test es el guard de esa propiedad.
  it("viene en el HTML del servidor, no despues de hidratar", () => {
    const html = renderToStaticMarkup(<SplashScreen />);

    expect(html).toContain("POWERED BY");
    expect(html).toContain("SOFTWARE A MEDIDA");
    // The logo is an inline SVG, not an <img>: GSAP has to reach its inner
    // nodes. It still ships revealed, so no-JS viewers see the whole mark.
    expect(html).toContain('viewBox="0 0 1440 483.08"');
    expect(html).not.toContain('r="0"');
  });

  // La salida la maneja CSS porque arranca en el primer paint, antes de que
  // React hidrate: si dependiera del JS, un fallo de hidratacion dejaria el
  // overlay tapando la app.
  it("delega la salida a la animacion CSS", () => {
    const html = renderToStaticMarkup(<SplashScreen />);

    expect(html).toContain("animate-splash-out");
  });

  it("muestra la atribucion de marca con el logo y el claim en mayusculas", () => {
    render(<SplashScreen />);

    expect(screen.getByText("POWERED BY")).toBeInTheDocument();
    expect(screen.getByText("SOFTWARE A MEDIDA")).toBeInTheDocument();

    expect(
      document.querySelector('[role="img"][aria-label="ANØMAL"]'),
    ).toBeInTheDocument();
  });

  it("se desmonta cuando termina la animacion", () => {
    render(<SplashScreen />);

    fireEvent.animationEnd(screen.getByTestId("splash-screen"));

    expect(screen.queryByTestId("splash-screen")).not.toBeInTheDocument();
  });

  it("se desmonta por backstop si nadie escucho el animationend", () => {
    render(<SplashScreen />);

    act(() => {
      vi.advanceTimersByTime(SPLASH_TOTAL_MS - 1);
    });
    expect(screen.getByTestId("splash-screen")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("splash-screen")).not.toBeInTheDocument();
  });

  it("se puede descartar con un click sin esperar la animacion", () => {
    render(<SplashScreen />);

    fireEvent.click(screen.getByTestId("splash-screen"));

    expect(screen.queryByTestId("splash-screen")).not.toBeInTheDocument();
  });

  // The GSAP intro has to be over before the overlay starts fading, or the logo
  // animates while it is already disappearing. Asserted on the constants so a
  // retime of either side cannot silently break the other.
  it("termina la animacion del logo antes de que arranque el fade", () => {
    expect(ANOMAL_INTRO_DURATION_MS).toBeLessThanOrEqual(SPLASH_FADE_START_MS);
    expect(SPLASH_FADE_START_MS).toBeLessThan(SPLASH_TOTAL_MS);
  });

  // Si el fade arrancara demasiado pronto habria una franja de hidrataciones
  // que llegan antes del fallback CSS pero sin tiempo suficiente para animar:
  // el intro no se veria nunca y nadie se enteraria.
  it("deja margen para que una hidratacion tardia igual alcance a animar", () => {
    expect(SPLASH_FADE_START_MS).toBeGreaterThanOrEqual(
      ANOMAL_INTRO_MIN_DEADLINE_MS,
    );
  });

  it("no atrapa al lector de pantalla", () => {
    render(<SplashScreen />);

    expect(screen.getByTestId("splash-screen")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
