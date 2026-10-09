import { useCallback, useState } from 'react';

const AUTH_STORAGE_KEY = 'tripapp_authenticated';

export function useAuth() {
    const [auth, setAuth] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) === 'true');

    const login = useCallback(() => {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        setAuth(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuth(false);
    }, []);

    return { auth, login, logout };
}
