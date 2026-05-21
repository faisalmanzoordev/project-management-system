import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  // If the user is completely unauthenticated, bounce them back to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific access controls are requested and the user doesn't hold that clearance level
  if (allowedRoles && (!user || !allowedRoles.includes(user.roleName))) {
    return <Navigate to="/workspaces" replace />;
  }

  // Using <Outlet /> tells React Router to render whatever nested child route is currently active!
  return <Outlet />;
};

export default ProtectedRoute;