import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocalContactActions } from "../LocalContactActions";

describe("LocalContactActions", () => {
  it("renders nothing when there is no contact data", () => {
    const { container } = render(
      <LocalContactActions
        whatsappUrl={null}
        telUrl={null}
        instagramUrl={null}
        mapsUrl={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the actions with data, in WhatsApp/Instagram/Llamar/Cómo llegar order", () => {
    render(
      <LocalContactActions
        whatsappUrl="https://wa.me/541122334455"
        telUrl={null}
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

  it("renders all four when all data is present, opening external links in a new tab except tel:", () => {
    render(
      <LocalContactActions
        whatsappUrl="https://wa.me/541122334455"
        telUrl="tel:+541122334455"
        instagramUrl="https://instagram.com/peluqueria.centro"
        mapsUrl="https://www.google.com/maps/search/?api=1&query=x"
      />,
    );

    const whatsapp = screen.getByRole("link", { name: /whatsapp/i });
    const call = screen.getByRole("link", { name: /llamar/i });
    const maps = screen.getByRole("link", { name: /llegar/i });

    expect(whatsapp).toHaveAttribute("href", "https://wa.me/541122334455");
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", expect.stringContaining("noopener"));

    expect(call).toHaveAttribute("href", "tel:+541122334455");
    expect(call).not.toHaveAttribute("target");

    expect(maps).toHaveAttribute("target", "_blank");
  });
});
