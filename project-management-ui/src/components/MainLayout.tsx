import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { IconChart, IconGrid, IconLogout, IconMenu, IconX } from "./ui/icons";

type NavItem = {
    to: string;
    label: string;
    icon: React.ReactNode;
};

const navItems: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: <IconChart className="text-slate-600" /> },
    { to: "/workspaces", label: "Workspaces", icon: <IconGrid className="text-slate-600" /> },
];

function navLinkClassName(isActive: boolean): string {
    return [
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
        isActive
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100",
    ].join(" ");
}

const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const displayName = useMemo(() => user?.name ?? "User", [user?.name]);
    const displayEmail = useMemo(() => user?.email ?? "", [user?.email]);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Top bar (mobile/tablet) */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/70 backdrop-blur-xl lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <IconButton
                            ariaLabel="Open menu"
                            icon={<IconMenu />}
                            onClick={() => setMobileSidebarOpen(true)}
                        />
                        <div>
                            <div className="text-sm font-extrabold tracking-tight text-slate-900">
                                Project Management
                            </div>
                            <div className="text-[11px] text-slate-500">Premium workspace</div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<IconLogout />}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen ? (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <div className="text-sm font-extrabold text-slate-900">Project Management</div>
                                <div className="mt-0.5 text-[11px] text-slate-500">Navigation</div>
                            </div>
                            <IconButton
                                ariaLabel="Close menu"
                                icon={<IconX />}
                                onClick={() => setMobileSidebarOpen(false)}
                            />
                        </div>

                        <nav className="px-4 py-4">
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setMobileSidebarOpen(false)}
                                        className={({ isActive }) => navLinkClassName(isActive)}
                                    >
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-inset ring-slate-200 group-[.bg-slate-900]:bg-white/10 group-[.bg-slate-900]:ring-white/20">
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>

                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                                <div className="mt-1 break-all text-xs text-slate-600">{displayEmail}</div>

                                <div className="mt-4">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        leftIcon={<IconLogout />}
                                        className="w-full"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </Button>
                                </div>
                            </div>
                        </nav>
                    </aside>
                </div>
            ) : null}

            <div className="mx-auto flex max-w-7xl">
                {/* Desktop Sidebar */}
                <aside className="hidden w-80 border-r border-slate-200 bg-white/60 backdrop-blur-xl lg:block">
                    <div className="px-6 py-6">
                        <div className="text-base font-extrabold tracking-tight text-slate-900">
                            Project Management
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Premium workspace</div>
                    </div>

                    <nav className="px-4">
                        <div className="space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => navLinkClassName(isActive)}
                                >
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-inset ring-slate-200 group-[.bg-slate-900]:bg-white/10 group-[.bg-slate-900]:ring-white/20">
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </nav>

                    <div className="mt-8 px-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                            <div className="mt-1 break-all text-xs text-slate-600">{displayEmail}</div>

                            <div className="mt-4">
                                <Button
                                    variant="soft"
                                    size="sm"
                                    leftIcon={<IconLogout />}
                                    className="w-full"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main content */}
                <main className="min-h-screen flex-1 px-4 py-6 sm:px-6 lg:px-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;