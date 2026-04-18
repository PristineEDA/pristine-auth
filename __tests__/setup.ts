import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for jsdom (required by input-otp)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
