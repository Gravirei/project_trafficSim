'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ViewProvider } from '@/hooks/useViewController';
import { ThemeProvider } from '@/hooks/useTheme';

export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (pathname.startsWith('/desk')) {
      document.body.dataset.view = 'control';
    } else if (pathname.startsWith('/map')) {
      document.body.dataset.view = 'map';
    } else {
      document.body.dataset.view = 'landing';
    }
  }, [pathname]);

  return (
    <ThemeProvider>
      <ViewProvider>{children}</ViewProvider>
    </ThemeProvider>
  );
}
