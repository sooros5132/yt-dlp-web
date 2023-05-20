import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface State {
  secretKey: string;
}

interface Store extends State {
  setSecretKey: (url: string) => void;
}

const initialState: State = {
  secretKey: ''
};

export const useCookiesEditorStore = create(
  persist<Store>(
    (set, get) => ({
      ...initialState,
      setSecretKey(secretKey) {
        set({ secretKey });
      }
    }),
    {
      name: 'cookiesEditor',
      storage: createJSONStorage(() => localStorage),
      version: 0.1,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ['secretKey'].includes(key))
        ) as Store
    }
  )
);
