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
