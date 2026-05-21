import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  roleName: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "user";

function safeParseUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (
      typeof parsed?.id === "number" &&
      typeof parsed?.name === "string" &&
      typeof parsed?.email === "string" &&
      typeof parsed?.roleName === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = safeParseUser(localStorage.getItem(USER_KEY));

    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const login = (token: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      login,
      logout,
    }),
    [user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}