import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'tripapp_authenticated';

/**
 * Custom hook for authentication state management
 */
export function useAuth() {
    const [auth, setAuth] = useState(false);

    // Check persistent auth on mount
    useEffect(() => {
        const isAuthenticated = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
        if (isAuthenticated) {
            setAuth(true);
        }
    }, []);

    const login = useCallback(() => {
        setAuth(true);
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }, []);

    const logout = useCallback(() => {
        setAuth(false);
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }, []);

    return {
        auth,
        login,
        logout,
    };
}

export default useAuth;
