import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

export type LayoutMode = 'table' | 'grid';
interface VideoListState {
  isSelectMode: boolean;
  selectedUuids: Set<string>;
  layoutMode: LayoutMode;
}

const initialState: VideoListState = {
  isSelectMode: false,
  selectedUuids: new Set(),
  layoutMode: 'grid'
};

interface VideoListStore extends VideoListState {
  setSelectMode: (isSelectMode: boolean) => void;
  addUuid: (uuid: string) => void;
  addUuids: (uuid: Array<string>) => void;
  deleteUuid: (uuid: string) => void;
  clearUuids: () => void;
  setLayoutMode: (layoutMode: LayoutMode) => void;
}

export const useVideoListStore = createWithEqualityFn<VideoListStore>(
  (set, get) => ({
    ...initialState,
    setSelectMode(isSelectMode) {
      set({
        isSelectMode
      });
    },
    addUuid(uuids) {
      const { selectedUuids } = get();
      const newUuids = new Set(selectedUuids);
      newUuids.add(uuids);
      set({
        selectedUuids: newUuids
      });
    },
    addUuids(uuids) {
      const { selectedUuids } = get();
      const newUuids = new Set(selectedUuids);
      uuids.forEach((uuid) => newUuids.add(uuid));
      set({
        selectedUuids: newUuids
      });
    },
    deleteUuid(uuid) {
      const { selectedUuids } = get();
      const newUuids = new Set(selectedUuids);
      newUuids.delete(uuid);
      set({
        selectedUuids: newUuids
      });
    },
    clearUuids() {
      set({
        selectedUuids: new Set()
      });
    },
    setLayoutMode(layoutMode: LayoutMode) {
      set({ layoutMode });
    }
  }),
  shallow
);
