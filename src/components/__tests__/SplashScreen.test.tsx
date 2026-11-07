import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { SplashScreen } from "@/components/SplashScreen";

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
    expect(html).toContain("/anomal-logo-white.svg");
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

    const logo = screen.getByAltText("ANØMAL");
    expect(logo).toHaveAttribute("src", "/anomal-logo-white.svg");
  });

  it("se desmonta cuando termina la animacion", () => {
    render(<SplashScreen />);

    fireEvent.animationEnd(screen.getByTestId("splash-screen"));

    expect(screen.queryByTestId("splash-screen")).not.toBeInTheDocument();
  });

  it("se desmonta por backstop si nadie escucho el animationend", () => {
    render(<SplashScreen />);

    act(() => {
      vi.advanceTimersByTime(1899);
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

  it("no atrapa al lector de pantalla", () => {
    render(<SplashScreen />);

    expect(screen.getByTestId("splash-screen")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
