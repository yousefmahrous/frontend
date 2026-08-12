import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";

import { getMe, type AppUser } from "@/api/auth.api";
import { authEvents } from "@/api/client";

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  setUser: (user: AppUser | null) => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const authQueryKey = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: authQueryKey,
    queryFn: async () => {
      try {
        return await getMe();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  const setUser = useCallback(
    (user: AppUser | null) => {
      queryClient.setQueryData(authQueryKey, user);
    },
    [queryClient],
  );

  useEffect(() => {
    authEvents.onUnauthorized = () => {
      queryClient.setQueryData(authQueryKey, null);
      void navigate({ to: "/login" });
    };
    return () => {
      authEvents.onUnauthorized = null;
    };
  }, [navigate, queryClient]);

  const user = data ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === "admin",
        setUser,
        refresh: () => void queryClient.invalidateQueries({ queryKey: authQueryKey }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}