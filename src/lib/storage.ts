type StorageShape = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const noopStorage: StorageShape = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const browserStorage: StorageShape =
  typeof window === "undefined" ? noopStorage : window.localStorage;