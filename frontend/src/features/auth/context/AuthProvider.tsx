"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type { AuthUser, LoginPayload } from "../types/auth.types";
import { getMeApi, loginApi } from "@/api/auth.api";
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from "@/utils/token-storage";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(true);

  const refreshMe = async (): Promise<void> => {
    const currentUser = await getMeApi();

    setUser(currentUser);
  };

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      const token = getAccessToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshMe();
      } catch {
        removeAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const login = async (payload: LoginPayload): Promise<void> => {
    const result = await loginApi(payload);

    setAccessToken(result.accessToken);

    setUser(result.user);
  };

  const logout = (): void => {
    removeAccessToken();
    setUser(null);
    router.replace("/login");
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshMe,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }

  return context;
}
