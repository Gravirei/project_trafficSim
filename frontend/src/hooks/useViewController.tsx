'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createViewManager, View, ViewManager } from '@/lib/sim/router';

interface ViewCtx {
  vm: ViewManager | null;
  view: View;
  currentJunc: string | null;
  showLanding: () => void;
  showMap: () => void;
  showDashboard: () => void;
  enterJunction: (id: string) => void;
}

const Ctx = createContext<ViewCtx | null>(null);

const noop = () => {};

export function ViewProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [vm, setVm] = useState<ViewManager | null>(null);
  const [view, setView] = useState<View>('landing');
  const [currentJunc, setCurrentJunc] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const instance = createViewManager();
    instance.setNavigator({ push: (path) => router.push(path) });
    setVm(instance);
    setView(instance.getView());
    setCurrentJunc(instance.getJunction());
    const offV = instance.onViewChange((v) => setView(v));
    const offJ = instance.onJunctionChange((id) => setCurrentJunc(id));
    return () => {
      offV();
      offJ();
    };
  }, [router]);

  const value = useMemo<ViewCtx>(
    () => ({
      vm,
      view,
      currentJunc,
      showLanding: vm ? () => vm.showLanding() : noop,
      showMap: vm ? () => vm.showMap() : noop,
      showDashboard: vm ? () => vm.showDashboard() : noop,
      enterJunction: vm ? (id: string) => vm.enterJunction(id) : noop,
    }),
    [vm, view, currentJunc],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViewController(): ViewCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      vm: null,
      view: 'landing',
      currentJunc: null,
      showLanding: noop,
      showMap: noop,
      showDashboard: noop,
      enterJunction: noop,
    };
  }
  return ctx;
}
