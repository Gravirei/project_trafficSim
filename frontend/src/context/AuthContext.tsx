'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export interface User {
    id: number;
    username: string;
    role: 'ADMIN' | 'VIEWER';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    isAdmin: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken) {
            setToken(storedToken);
            api.setToken(storedToken);

            // Restore user from localStorage immediately so session persists on refresh
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    // corrupted stored user, will be fixed by getMe() below
                }
            }

            // Verify token is still valid with the server (background)
            api.getMe()
                .then(res => {
                    setUser(res.user);
                    localStorage.setItem('auth_user', JSON.stringify(res.user));
                })
                .catch((err) => {
                    // Only clear session if server explicitly rejects the token (401)
                    // For network errors or other failures, keep the cached session
                    if (err?.status === 401) {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_user');
                        setToken(null);
                        setUser(null);
                        api.setToken(null);
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (newToken: string, user: User) => {
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(user));
        setToken(newToken);
        setUser(user);
        api.setToken(newToken);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
        api.setToken(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAdmin: user?.role === 'ADMIN',
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
