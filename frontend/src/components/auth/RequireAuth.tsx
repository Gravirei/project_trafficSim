'use client';

/**
 * Route gate. Redirects unauthenticated users to /login.
 * Renders nothing while auth state is still loading.
 */
import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === 'idle' || status === 'loading') {
    return null;
  }
  if (status === 'unauthenticated') {
    return null;
  }
  return <>{children}</>;
}
