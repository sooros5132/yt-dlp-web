import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SiteSettingState {
  hydrated: boolean;
}

const defaultState: SiteSettingState = {
  hydrated: false
};

interface SiteSettingStore extends SiteSettingState {
  setHydrated: () => void;
}

export const useSiteSettingStore = create(
  persist<SiteSettingStore>(
    (set, get) => ({
      ...defaultState,
      setHydrated() {
        set({
          hydrated: true
        });
      }
    }),
    {
      name: 'siteSetting',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['hydrated'].includes(key))
        ) as SiteSettingStore,
      storage: createJSONStorage(() => localStorage),
      version: 0.1
    }
  )
);
