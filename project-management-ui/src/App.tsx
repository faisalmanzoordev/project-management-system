import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workspaces from "./pages/Workspaces";

import { AppProvider } from "./context/AppContext";

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* Protected zone */}
                <Route element={<ProtectedRoute />}>
                    {/* IMPORTANT: AppProvider must wrap all components using useApp() */}
                    <Route
                        element={
                            <AppProvider>
                                <MainLayout />
                            </AppProvider>
                        }
                    >
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/workspaces" element={<Workspaces />} />
                        <Route path="/unauthorized" element={<Unauthorized />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;