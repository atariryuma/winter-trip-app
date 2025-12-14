import { useState, useEffect, useCallback } from 'react';

const SIDEBAR_STATE_KEY = 'sidebar_collapsed';

/**
 * Custom hook for sidebar collapse state management
 * Based on UX best practices:
 * - Persists state in localStorage
 * - Collapsed width: 64px (icons only)
 * - Expanded width: 256px (w-64)
 *
 * @see https://www.designmonks.co/blog/side-drawer-ui
 */
export function useSidebar() {
    // Initialize from localStorage, default to expanded
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
        return saved === 'true';
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed.toString());
    }, [isCollapsed]);

    const toggle = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const collapse = useCallback(() => {
        setIsCollapsed(true);
    }, []);

    const expand = useCallback(() => {
        setIsCollapsed(false);
    }, []);

    return {
        isCollapsed,
        toggle,
        collapse,
        expand,
        // CSS class helpers
        sidebarWidth: isCollapsed ? 'w-16' : 'w-64',
        contentPadding: isCollapsed ? 'md:pl-16' : 'md:pl-64',
    };
}

export default useSidebar;
