import { createWithEqualityFn } from 'zustand/traditional';
import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

interface SiteSettingState {
  hydrated: boolean;
}

const defaultState: SiteSettingState = {
  hydrated: false
};

interface SiteSettingStore extends SiteSettingState {
  setHydrated: () => void;
}

export const useSiteSettingStore = createWithEqualityFn(
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
          Object.entries(state).filter(([key]) => !['hydrated', 'openCookiesEditor'].includes(key))
        ) as SiteSettingStore,
      storage: createJSONStorage(() => localStorage),
      version: 0.1,
      skipHydration: true,
      onRehydrateStorage() {
        return (state, error) => {
          if (!error && typeof state?.hydrated !== 'undefined' && !state?.hydrated) {
            state?.setHydrated?.();
          }
        };
      }
    }
  ),
  shallow
);
