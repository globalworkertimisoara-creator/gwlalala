import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAgency?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireAgency = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isAgency, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Agency users should only access agency routes
  if (isAgency && !requireAgency && !location.pathname.startsWith('/agency')) {
    return <Navigate to="/agency" replace />;
  }

  // Non-agency users shouldn't access agency routes — EXCEPT admins (for preview mode)
  if (requireAgency && !isAgency && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
