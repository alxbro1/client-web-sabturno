import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ServiceCategoryTabs } from "../ServiceCategoryTabs";

describe("ServiceCategoryTabs", () => {
  it("renders nothing with 0 or 1 category", () => {
    const { container: withNone } = render(
      <ServiceCategoryTabs categories={[]} active="" onChange={vi.fn()} />,
    );
    expect(withNone).toBeEmptyDOMElement();

    const { container: withOne } = render(
      <ServiceCategoryTabs categories={["Corte"]} active="Corte" onChange={vi.fn()} />,
    );
    expect(withOne).toBeEmptyDOMElement();
  });

  it("renders a tab per category with the active one marked selected", () => {
    render(
      <ServiceCategoryTabs
        categories={["Corte", "Color", "Otros"]}
        active="Color"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Corte", "Color", "Otros"]);
    expect(screen.getByRole("tab", { name: "Color" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Corte" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("calls onChange with the clicked category", () => {
    const onChange = vi.fn();
    render(
      <ServiceCategoryTabs
        categories={["Corte", "Color"]}
        active="Corte"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Color" }));
    expect(onChange).toHaveBeenCalledWith("Color");
  });
});
