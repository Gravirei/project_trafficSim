'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'ADMIN' | 'VIEWER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (!loading && user && requiredRole === 'ADMIN' && !isAdmin) {
            router.push('/');
        }
    }, [user, loading, router, requiredRole, isAdmin]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
                Verifying authorization...
            </div>
        );
    }

    if (!user || (requiredRole === 'ADMIN' && !isAdmin)) {
        return null; // Will redirect in useEffect
    }

    return <>{children}</>;
}
