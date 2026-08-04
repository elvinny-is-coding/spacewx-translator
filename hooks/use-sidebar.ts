// hooks/use-sidebar.ts
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  createElement,
} from "react";

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  open: true,
  toggle: () => {},
  setOpen: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const setOpenValue = useCallback((val: boolean) => setOpen(val), []);

  return createElement(
    SidebarContext.Provider,
    { value: { open, toggle, setOpen: setOpenValue } },
    children,
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
