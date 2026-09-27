import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollToServicesButton } from "../ScrollToServicesButton";

type ObserverCallback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

let observerCallback: ObserverCallback | null = null;

beforeEach(() => {
  observerCallback = null;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: ObserverCallback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

function renderWithTarget() {
  const target = document.createElement("div");
  target.id = "services";
  target.scrollIntoView = vi.fn();
  document.body.appendChild(target);
  render(<ScrollToServicesButton targetId="services" />);
  return target;
}

describe("ScrollToServicesButton", () => {
  it("scrolls the services section into view when pressed", () => {
    const target = renderWithTarget();

    fireEvent.click(screen.getByRole("button", { name: "Ir a los servicios" }));

    expect(target.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "start" }),
    );
  });

  it("hides once the services section reaches the viewport", () => {
    renderWithTarget();
    expect(screen.getByRole("button", { name: "Ir a los servicios" })).toBeInTheDocument();

    act(() => {
      observerCallback?.([
        { isIntersecting: true, boundingClientRect: { top: 200 } as DOMRectReadOnly },
      ]);
    });

    expect(screen.queryByRole("button", { name: "Ir a los servicios" })).not.toBeInTheDocument();
  });

  it("stays hidden after the user scrolled past the services section", () => {
    renderWithTarget();

    act(() => {
      observerCallback?.([
        { isIntersecting: false, boundingClientRect: { top: -500 } as DOMRectReadOnly },
      ]);
    });

    expect(screen.queryByRole("button", { name: "Ir a los servicios" })).not.toBeInTheDocument();
  });
});
