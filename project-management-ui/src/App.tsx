import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js"; // 1. Import the provider
import ProtectedRoute from "./components/ProtectedRoute.js";
import MainLayout from "./components/MainLayout.js";

import Login from "./pages/Login.js";
import Dashboard from "./pages/Dashboard.js";
import Workspaces from "./pages/Workspaces.js";

const App: React.FC = () => {
  return (
    // 2. Place AuthProvider at the very top level
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Secure Protected Routes layout block */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workspaces" element={<Workspaces />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;