import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { IconLogout } from "../components/ui/icons";
import { useAuth } from "../context/AuthContext";

type UnauthorizedState = {
    requiredRoles?: string[];
    from?: string;
};

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();

    const state = (location.state as UnauthorizedState | null) ?? null;

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Access denied
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Your account does not have permission to access this area.
                </p>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="font-semibold text-slate-900">Signed in as</div>
                    <div className="mt-1 text-slate-700">
                        {user?.name} | {user?.email}
                    </div>
                    <div className="mt-1 text-slate-600">
                        Role:{" "}
                        <span className="font-semibold text-slate-900">
                            {user?.roleName ?? "-"}
                        </span>
                    </div>

                    {state?.requiredRoles?.length ? (
                        <div className="mt-2 text-slate-600">
                            Required role(s):{" "}
                            <span className="font-semibold text-slate-900">
                                {state.requiredRoles.join(", ")}
                            </span>
                        </div>
                    ) : null}

                    {state?.from ? (
                        <div className="mt-2 text-xs text-slate-500">
                            Attempted: {state.from}
                        </div>
                    ) : null}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                        variant="secondary"
                        onClick={() => navigate("/dashboard", { replace: true })}
                    >
                        Go to Dashboard
                    </Button>

                    <Button
                        variant="soft"
                        leftIcon={<IconLogout />}
                        onClick={() => {
                            logout();
                            navigate("/login", { replace: true });
                        }}
                    >
                        Sign in with a different account
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;