'use client';

/**
 * Route gate. Redirects unauthenticated users to /login.
 * Renders nothing while the persisted session is still hydrating.
 */
import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { hasStoredSession } from '@/lib/auth/session';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // Wait for session restore — do not bounce a refresh that still has a token.
  if (status === 'idle') {
    return null;
  }
  if (status === 'loading') {
    return null;
  }
  if (status === 'unauthenticated') {
    // Brief window before provider hydrates: avoid a premature redirect.
    if (typeof window !== 'undefined' && hasStoredSession()) return null;
    return null;
  }
  return <>{children}</>;
}
