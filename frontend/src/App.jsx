import ToastProvider from './ui/ToastProvider';
import ConfirmProvider from './ui/ConfirmProvider';
import TripProvider from './store/TripProvider';
import AppShell from './AppShell';
import LoginView from './features/auth/LoginView';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

function Root() {
    const { auth, login, logout } = useAuth();
    const [theme, setTheme] = useTheme();

    if (!auth) return <LoginView onLogin={login} />;

    return (
        <TripProvider>
            <AppShell theme={theme} setTheme={setTheme} onLogout={logout} />
        </TripProvider>
    );
}

export default function App() {
    return (
        <ToastProvider>
            <ConfirmProvider>
                <Root />
            </ConfirmProvider>
        </ToastProvider>
    );
}
