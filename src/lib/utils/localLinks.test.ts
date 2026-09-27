import { describe, expect, it } from "vitest";
import {
  buildWhatsappUrl,
  buildMapsUrl,
  buildInstagramUrl,
  buildTelUrl,
} from "./localLinks";

describe("buildWhatsappUrl", () => {
  it("returns null when there is no phone", () => {
    expect(buildWhatsappUrl(null)).toBeNull();
    expect(buildWhatsappUrl(undefined)).toBeNull();
    expect(buildWhatsappUrl("")).toBeNull();
  });

  it("strips formatting characters", () => {
    expect(buildWhatsappUrl("+54 11 2233-4455")).toBe(
      "https://wa.me/541122334455",
    );
  });

  it("prefixes the country code digits when the number does not already carry them", () => {
    expect(buildWhatsappUrl("1122334455", "+54")).toBe(
      "https://wa.me/541122334455",
    );
  });

  it("does not double the country code when it is already present", () => {
    expect(buildWhatsappUrl("541122334455", "+54")).toBe(
      "https://wa.me/541122334455",
    );
  });
});

describe("buildTelUrl", () => {
  it("returns null when there is no phone", () => {
    expect(buildTelUrl(null)).toBeNull();
    expect(buildTelUrl("  ")).toBeNull();
  });

  it("keeps a leading + and strips other formatting", () => {
    expect(buildTelUrl("+54 11 2233-4455")).toBe("tel:+541122334455");
  });
});

describe("buildMapsUrl", () => {
  it("builds a Google Maps search URL with the joined, encoded address", () => {
    expect(buildMapsUrl("Av. Siempre Viva 742", "CABA", "Buenos Aires")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Av.%20Siempre%20Viva%20742%2C%20CABA%2C%20Buenos%20Aires",
    );
  });

  it("returns null when address is missing", () => {
    expect(buildMapsUrl("", "CABA", "Buenos Aires")).toBeNull();
  });

  it("omits empty parts", () => {
    expect(buildMapsUrl("Av. Siempre Viva 742", "", "")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Av.%20Siempre%20Viva%20742",
    );
  });
});

describe("buildInstagramUrl", () => {
  it("returns null for an empty/missing handle", () => {
    expect(buildInstagramUrl(null)).toBeNull();
    expect(buildInstagramUrl(undefined)).toBeNull();
    expect(buildInstagramUrl("")).toBeNull();
  });

  it("builds the profile URL from a bare handle", () => {
    expect(buildInstagramUrl("peluqueria.centro")).toBe(
      "https://instagram.com/peluqueria.centro",
    );
  });
});
