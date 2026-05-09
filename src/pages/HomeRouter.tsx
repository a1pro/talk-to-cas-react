import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";

export default function HomeRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-screen">Loading...</div>;
  }

  if (!user) {
    return <LandingPage />;
  }

  if (user.primary_role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user.primary_role === "merchant") {
    return <Navigate to="/merchant" replace />;
  }

  return <Navigate to="/user" replace />;
}
