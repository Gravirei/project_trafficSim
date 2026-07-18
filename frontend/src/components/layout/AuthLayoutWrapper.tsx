'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

export default function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login';

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            <main style={{ padding: "2rem", paddingTop: "5rem", maxWidth: "1440px", margin: "0 auto" }}>
                {children}
            </main>
        </>
    );
}
