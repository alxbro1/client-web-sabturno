import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { AnomalLogoIntro } from "@/components/AnomalLogoIntro";
import {
  ANOMAL_LEAF_LEFT_D,
  ANOMAL_LEAF_RIGHT_D,
  ANOMAL_WORDMARK_D,
} from "@/components/anomal-logo-paths";

/**
 * Replaces `window.matchMedia` with one that answers a fixed set of queries.
 * The shared stub in `src/test/setup.ts` models a user with no motion
 * preference; a test that needs the opposite swaps it here.
 */
function stubMatchMedia(reduce: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    media: query,
    // Discriminate on "no-preference", never on "reduce": the string "reduce"
    // is a substring of "reduced-motion", so it matches BOTH queries.
    matches: query.includes("no-preference") ? !reduce : reduce,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

const restores: Array<() => void> = [];

afterEach(() => {
  while (restores.length) restores.pop()?.();
  vi.restoreAllMocks();
});

describe("AnomalLogoIntro", () => {
  // The asset is the source of truth. If a refactor ever redraws, simplifies or
  // re-orders the vector, this is the test that catches it.
  it("renders the three original paths of the asset unchanged", () => {
    const { container } = render(<AnomalLogoIntro />);

    const leaves = container.querySelectorAll<SVGPathElement>(
      'path[data-part="leaf"]',
    );
    expect(leaves).toHaveLength(2);
    expect(leaves[0].getAttribute("d")).toBe(ANOMAL_LEAF_LEFT_D);
    expect(leaves[1].getAttribute("d")).toBe(ANOMAL_LEAF_RIGHT_D);

    // The white compound path is rendered twice: once clipped to the emblem,
    // once clipped to the lettering. Both copies carry identical data.
    const white = container.querySelectorAll<SVGPathElement>(
      'path[data-part="emblem"], path[data-part="word"]',
    );
    expect(white).toHaveLength(2);
    for (const path of white) {
      expect(path.getAttribute("d")).toBe(ANOMAL_WORDMARK_D);
    }

    expect(container.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 1440 483.08",
    );
  });

  // Nothing about the logo may depend on hydration. The overlay that hosts it
  // is server-rendered and its exit is a CSS animation precisely so a failed or
  // slow hydration cannot leave the app covered; the logo inside it has to
  // degrade the same way.
  it("ships the fully revealed logo in the server HTML", () => {
    const html = renderToStaticMarkup(<AnomalLogoIntro />);

    // The emblem mask circle and the wordmark wipe rect are at full size in the
    // markup. GSAP zeroes them at runtime; without GSAP the logo is complete.
    expect(html).not.toContain('r="0"');
    expect(html).not.toContain('width="0"');
    expect(html).toContain('r="235"');
    expect(html).toContain('width="1440"');
  });

  it("gives each instance its own mask ids", () => {
    const { container } = render(
      <>
        <AnomalLogoIntro />
        <AnomalLogoIntro />
      </>,
    );

    const ids = [...container.querySelectorAll("mask[id], clipPath[id]")].map(
      (node) => node.id,
    );

    expect(ids.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      // React's `useId` emits characters that are invalid in an SVG id.
      expect(id).toMatch(/^[A-Za-z][A-Za-z0-9_-]*$/);
    }
  });

  it("hides the geometry and animates when motion is allowed", () => {
    restores.push(stubMatchMedia(false));

    const { container } = render(<AnomalLogoIntro />);

    // `gsap.set` runs synchronously inside `useGSAP`, so the starting state is
    // observable right after mount.
    expect(
      container.querySelector('[data-part="emblem-reveal"]'),
    ).toHaveAttribute("r", "0");
    expect(container.querySelector('[data-part="word-reveal"]')).toHaveAttribute(
      "width",
      "0",
    );
  });

  it("shows the complete logo at once with prefers-reduced-motion", () => {
    restores.push(stubMatchMedia(true));
    const onComplete = vi.fn();

    const { container } = render(<AnomalLogoIntro onComplete={onComplete} />);

    expect(
      container.querySelector('[data-part="emblem-reveal"]'),
    ).toHaveAttribute("r", "235");
    expect(container.querySelector('[data-part="word-reveal"]')).toHaveAttribute(
      "width",
      "1440",
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  // The CSS fallback reveals the logo at 750ms for viewers whose JS never
  // arrives. If hydration lands after that the logo is already on screen, so
  // starting the timeline then would blank it and replay it: a visible glitch.
  // GSAP has to stand down instead.
  it("does not animate when hydration lands after the CSS fallback revealed it", () => {
    restores.push(stubMatchMedia(false));
    const onComplete = vi.fn();
    // jsdom implements no Web Animations API at all, so this is an assignment
    // rather than a spy.
    const proto = SVGElement.prototype as unknown as {
      getAnimations?: () => Animation[];
    };
    const original = proto.getAnimations;
    proto.getAnimations = () => [{ currentTime: 900 } as unknown as Animation];
    restores.push(() => {
      if (original) proto.getAnimations = original;
      else delete proto.getAnimations;
    });

    const { container } = render(<AnomalLogoIntro onComplete={onComplete} />);

    expect(
      container.querySelector('[data-part="emblem-reveal"]'),
    ).toHaveAttribute("r", "235");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not trap the screen reader and exposes the brand name", () => {
    const { container } = render(<AnomalLogoIntro />);

    const root = container.querySelector('[role="img"]');
    expect(root).toHaveAttribute("aria-label", "ANØMAL");
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
