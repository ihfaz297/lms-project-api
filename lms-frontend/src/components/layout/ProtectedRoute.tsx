import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** If set, authenticated users are redirected to this path (used for Login/Register) */
    redirectIfAuth?: string;
}

/**
 * Route guard component (fixes G7 + G8).
 * - For protected pages (Dashboard, Bank): redirects to /login if not authenticated
 * - For guest pages (Login, Register): redirects away if already authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, redirectIfAuth }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Guest-only routes (Login, Register): redirect authenticated users away
    if (redirectIfAuth && user) {
        return <Navigate to={redirectIfAuth} replace />;
    }

    // Protected routes: redirect unauthenticated users to login
    if (!redirectIfAuth && !user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
