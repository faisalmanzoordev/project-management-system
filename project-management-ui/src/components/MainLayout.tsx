import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  to: string;
  label: string;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/workspaces", label: "Workspaces" },
];

function navLinkClassName(isActive: boolean): string {
  return [
    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = useMemo(() => user?.name ?? "User", [user?.name]);
  const displayEmail = useMemo(() => user?.email ?? "", [user?.email]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          onClick={() => setSidebarOpen(true)}
        >
          Menu
        </button>

        <div className="text-sm font-semibold text-slate-900">
          Project Management
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-base font-semibold text-slate-900">
              Project Management
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Secure Workspace
            </div>
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => navLinkClassName(isActive)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </nav>

          <div className="border-t border-slate-200 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">
              {displayName}
            </div>
            <div className="mt-1 break-all text-xs text-slate-600">
              {displayEmail}
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    Project Management
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Secure Workspace
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setSidebarOpen(false)}
                >
                  Close
                </button>
              </div>

              <nav className="px-3 py-4">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => navLinkClassName(isActive)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Logout
                  </button>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4">
                  <div className="text-sm font-semibold text-slate-900">
                    {displayName}
                  </div>
                  <div className="mt-1 break-all text-xs text-slate-600">
                    {displayEmail}
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="min-h-screen flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;