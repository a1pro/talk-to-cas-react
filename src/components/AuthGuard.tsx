import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types";

export function AuthGuard({
  children,
  role,
}: {
  children: JSX.Element;
  role?: Role;
}) {
  const { user, loading, isRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="center-screen">Loading dashboard...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role && !isRole(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
