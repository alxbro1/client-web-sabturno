import { describe, expect, it } from "vitest";
import { serviceCategoryLabel } from "./serviceCategory";

describe("serviceCategoryLabel", () => {
  it("translates the English slugs the mobile app stores", () => {
    expect(serviceCategoryLabel("haircuts")).toBe("Cortes de cabello");
    expect(serviceCategoryLabel("coloring")).toBe("Coloración");
    expect(serviceCategoryLabel("treatments")).toBe("Tratamientos");
    expect(serviceCategoryLabel("nails")).toBe("Manicura/Pedicura");
    expect(serviceCategoryLabel("massage")).toBe("Masajes");
    expect(serviceCategoryLabel("waxing")).toBe("Depilación");
    expect(serviceCategoryLabel("other")).toBe("Otros");
  });

  it("adds the missing accents to the values the web form stores", () => {
    expect(serviceCategoryLabel("Peluqueria")).toBe("Peluquería");
    expect(serviceCategoryLabel("Barberia")).toBe("Barbería");
    expect(serviceCategoryLabel("Estetica")).toBe("Estética");
    expect(serviceCategoryLabel("Depilacion")).toBe("Depilación");
    expect(serviceCategoryLabel("Cejas y pestanas")).toBe("Cejas y pestañas");
  });

  it("is case- and whitespace-insensitive for known values", () => {
    expect(serviceCategoryLabel("  HAIRCUTS ")).toBe("Cortes de cabello");
  });

  it("returns free-text categories unchanged (trimmed)", () => {
    expect(serviceCategoryLabel(" Corte ")).toBe("Corte");
  });

  it("returns an empty string for a missing category", () => {
    expect(serviceCategoryLabel(undefined)).toBe("");
    expect(serviceCategoryLabel(null)).toBe("");
  });
});
