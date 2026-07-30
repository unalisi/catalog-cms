import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AdminChromeContextValue = {
  hideBottomBar: boolean;
  setHideBottomBar: (hide: boolean) => void;
};

const AdminChromeContext = createContext<AdminChromeContextValue | null>(null);

export function AdminChromeProvider({ children }: { children: ReactNode }) {
  const [hideBottomBar, setHideBottomBar] = useState(false);
  const value = useMemo(
    () => ({ hideBottomBar, setHideBottomBar }),
    [hideBottomBar],
  );
  return <AdminChromeContext.Provider value={value}>{children}</AdminChromeContext.Provider>;
}

export function useAdminChrome() {
  const ctx = useContext(AdminChromeContext);
  if (!ctx) {
    return {
      hideBottomBar: false,
      setHideBottomBar: (_hide: boolean) => undefined,
    };
  }
  return ctx;
}
