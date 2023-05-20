import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SiteSettingState {
  hydrated: boolean;
  openCookiesEditor: boolean;
}

const defaultState: SiteSettingState = {
  hydrated: false,
  openCookiesEditor: false
};

interface SiteSettingStore extends SiteSettingState {
  setHydrated: () => void;
  setOpenCookiesEditor: (openCookiesEditor: boolean) => void;
}

export const useSiteSettingStore = create(
  persist<SiteSettingStore>(
    (set, get) => ({
      ...defaultState,
      setHydrated() {
        set({
          hydrated: true
        });
      },
      setOpenCookiesEditor(openCookiesEditor) {
        set({ openCookiesEditor });
      }
    }),
    {
      name: 'siteSetting',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['hydrated', 'openCookiesEditor'].includes(key))
        ) as SiteSettingStore,
      storage: createJSONStorage(() => localStorage),
      version: 0.1
    }
  )
);
