import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { FullPageLoadingSpinner } from './LoadingSpinner';

interface InstructorRouteProps {
    children: React.ReactNode;
}

export const InstructorRoute = ({ children }: InstructorRouteProps) => {
    const { isAuthenticated, profile, loading } = useAuth();

    if (loading) {
        return <FullPageLoadingSpinner size="lg" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (profile?.role !== 'instructor') {
        return <Navigate to="/userhome" replace />;
    }

    return <>{children}</>;
};
