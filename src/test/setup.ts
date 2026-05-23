import "@testing-library/jest-dom/vitest";

export const testMediaQueryState = {
  mobile: false,
};

const mediaQueryListeners = new Map<string, Set<() => void>>();

function notifyMediaQueryListeners(query: string) {
  mediaQueryListeners.get(query)?.forEach((listener) => listener());
}

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: (query: string) => ({
    matches:
      testMediaQueryState.mobile && query.includes("max-width: 900px"),
    media: query,
    onchange: null,
    addEventListener: (_event: string, listener: () => void) => {
      const listeners = mediaQueryListeners.get(query) ?? new Set();
      listeners.add(listener);
      mediaQueryListeners.set(query, listeners);
    },
    removeEventListener: (_event: string, listener: () => void) => {
      mediaQueryListeners.get(query)?.delete(listener);
    },
    dispatchEvent: () => true,
  }),
});

export function setTestMobileLayout(enabled: boolean) {
  testMediaQueryState.mobile = enabled;
  notifyMediaQueryListeners("(max-width: 900px)");
}

export function resetTestMediaQueryState() {
  testMediaQueryState.mobile = false;
  notifyMediaQueryListeners("(max-width: 900px)");
}
