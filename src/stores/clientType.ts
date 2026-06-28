import { create } from "zustand";

/**
 * Estado efimero que decide si el usuario esta registrando un cliente o un local.
 *
 * - NO se persiste (es UI state, no de negocio).
 * - Solo se usa durante el flujo de /register. Se resetea en cada nuevo submit
 *   o al desmontar la pantalla.
 *
 * El flag real (`isLocal`) vive en el User/Local devuelto por el backend.
 */
interface ClientTypeState {
  isBusiness: boolean;
  setIsBusiness: (value: boolean) => void;
  toggle: () => void;
  reset: () => void;
}

export const useClientTypeStore = create<ClientTypeState>((set) => ({
  isBusiness: false,
  setIsBusiness: (value) => set({ isBusiness: value }),
  toggle: () => set((state) => ({ isBusiness: !state.isBusiness })),
  reset: () => set({ isBusiness: false }),
}));
