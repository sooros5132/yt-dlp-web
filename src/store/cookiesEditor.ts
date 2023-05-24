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

export const useCookiesEditorStore = create<Store>((set, get) => ({
  ...initialState,
  setSecretKey(secretKey) {
    set({ secretKey });
  }
}));
