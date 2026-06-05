import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { IconChart, IconX } from "../components/ui/icons";

type LoginApiResponse = {
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        roleId?: number;
    };
};

function getRedirectPath(locationState: unknown): string {
    const state = locationState as { from?: { pathname?: string } } | null;
    const path = state?.from?.pathname;
    return typeof path === "string" && path.length > 0 ? path : "/dashboard";
}

const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const redirectTo = useMemo(() => getRedirectPath(location.state), [location.state]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const res = await axiosInstance.post<LoginApiResponse>("users/login", {
                email,
                password,
            });

            const token = res.data.token;

            login(token, {
                id: res.data.user.id,
                name: res.data.user.name,
                email: res.data.user.email,
                roleName: res.data.user.role,
            });

            navigate(redirectTo, { replace: true });
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Login failed. Please check your credentials.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
            <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    <div className="mb-6 text-center">
                        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                            <IconChart />
                        </div>
                        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
                            Sign in
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Access your workspace and manage projects and tasks.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        {error ? (
                            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div>{error}</div>
                                    <button
                                        type="button"
                                        onClick={() => setError(null)}
                                        className="rounded-lg p-1 text-rose-700 hover:bg-rose-100"
                                        aria-label="Dismiss error"
                                    >
                                        <IconX />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        <form onSubmit={onSubmit} className="space-y-4">
                            <TextField
                                label="Email"
                                type="email"
                                value={email}
                                autoComplete="email"
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                            />

                            <TextField
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                autoComplete="current-password"
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Your password"
                                required
                                rightAdornment={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                }
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Signing in..." : "Sign in"}
                            </Button>
                        </form>
                    </div>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        Protected by JWT authentication • Premium UX
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;