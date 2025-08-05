import { create } from "zustand";
const useHeaderStore = create((set) => ({
  profileDropdown: false,
  profileIsActive: (val) => {
    set((state) => ({ profileDropdown: val}));
  },
}));

export default useHeaderStore;
