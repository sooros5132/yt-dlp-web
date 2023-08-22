import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

interface State {
  secretKey: string;
}

interface Store extends State {
  setSecretKey: (url: string) => void;
}

const initialState: State = {
  secretKey: ''
};

export const useCookiesEditorStore = createWithEqualityFn<Store>(
  (set, get) => ({
    ...initialState,
    setSecretKey(secretKey) {
      set({ secretKey });
    }
  }),
  shallow
);
