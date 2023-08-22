import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

interface VideoListState {
  isSelectMode: boolean;
  selectedUuids: Set<string>;
}

interface VideoListStore extends VideoListState {
  setSelectMode: (isSelectMode: boolean) => void;
  addUuid: (uuid: string) => void;
  addUuids: (uuid: Array<string>) => void;
  deleteUuid: (uuid: string) => void;
  clearUuids: () => void;
}

const initialState: VideoListState = {
  isSelectMode: false,
  selectedUuids: new Set()
};

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
    }
  }),
  shallow
);
