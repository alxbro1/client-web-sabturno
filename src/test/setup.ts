import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver, which Radix primitives (Switch,
// Select, Tooltip, ...) rely on. Without this stub any test that renders a
// shadcn component built on Radix crashes with "ResizeObserver is not defined".
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom does not implement matchMedia either, and `gsap.matchMedia()` — used by
// `AnomalLogoIntro` to honour `prefers-reduced-motion` — calls it during setup.
// The stub models a viewer with no motion preference, which is the default
// everywhere, so `(prefers-reduced-motion: no-preference)` matches and
// `(prefers-reduced-motion: reduce)` does not. Answering `false` to both would
// leave `gsap.matchMedia()` with no branch to run at all. A test that needs the
// reduced-motion branch overrides `window.matchMedia` itself.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    media: query,
    matches: query.includes("no-preference"),
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
