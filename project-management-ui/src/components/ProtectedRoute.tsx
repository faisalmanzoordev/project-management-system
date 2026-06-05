import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export type ProtectedRouteProps = {
    allowedRoles?: string[];
    redirectTo?: string;
    unauthorizedTo?: string;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    redirectTo = "/login",
    unauthorizedTo = "/unauthorized",
}) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated || !user) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const isAllowed = allowedRoles.includes(user.roleName);
        if (!isAllowed) {
            return (
                <Navigate
                    to={unauthorizedTo}
                    replace
                    state={{
                        requiredRoles: allowedRoles,
                        from: location.pathname,
                    }}
                />
            );
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;