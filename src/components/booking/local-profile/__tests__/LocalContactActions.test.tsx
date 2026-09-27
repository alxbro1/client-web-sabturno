import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocalContactActions } from "../LocalContactActions";

describe("LocalContactActions", () => {
  it("renders nothing when there is no contact data", () => {
    const { container } = render(
      <LocalContactActions
        whatsappUrl={null}
        instagramUrl={null}
        mapsUrl={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the actions with data, in WhatsApp/Instagram/Cómo llegar order", () => {
    render(
      <LocalContactActions
        whatsappUrl="https://wa.me/541122334455"
        instagramUrl="https://instagram.com/peluqueria.centro"
        mapsUrl={null}
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName(/whatsapp/i);
    expect(links[1]).toHaveAccessibleName(/instagram/i);
    expect(screen.queryByRole("link", { name: /llamar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /llegar/i })).not.toBeInTheDocument();
  });

  it("renders WhatsApp/Instagram/Cómo llegar, all opening in a new tab, and never a call button", () => {
    render(
      <LocalContactActions
        whatsappUrl="https://wa.me/541122334455"
        instagramUrl="https://instagram.com/peluqueria.centro"
        mapsUrl="https://www.google.com/maps/search/?api=1&query=x"
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
      "WhatsApp",
      "Instagram",
      "Cómo llegar",
    ]);
    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });
    expect(screen.queryByRole("link", { name: /llamar/i })).not.toBeInTheDocument();
  });

  it("centers the actions instead of pinning them to a fixed 4-column grid", () => {
    const { container } = render(
      <LocalContactActions whatsappUrl="https://wa.me/1" instagramUrl={null} mapsUrl="https://maps/x" />,
    );

    expect(container.firstElementChild).toHaveClass("justify-center");
  });
});
