import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

/**
 * ProtectedRoute Component
 * Redirects to login if user is not authenticated.
 * Can also filter by role if passed.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A96E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role?.toUpperCase())) {
    // If user is logged in but doesn't have permissions, send to their default home
    const redirectPath = {
      ADMIN: "/admin",
      STAFF: "/vendor",
      VENDOR: "/vendor",
      ARTISAN: "/vendor",
    }[user.role?.toUpperCase()] || "/user";
    
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
