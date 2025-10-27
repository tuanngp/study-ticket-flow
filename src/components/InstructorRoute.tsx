import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface InstructorRouteProps {
    children: React.ReactNode;
}

export const InstructorRoute = ({ children }: InstructorRouteProps) => {
    const { isAuthenticated, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (profile?.role !== 'instructor') {
        return <Navigate to="/userhome" replace />;
    }

    return <>{children}</>;
};
