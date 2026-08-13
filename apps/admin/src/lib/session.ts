import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "@shopstart/types";
import { api, ApiError } from "./api-client";

export function useSession() {
  return useQuery<User | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api.get<User>("/auth/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
  });
}

/** Redirects to /login unless the session is an authenticated ADMIN. */
export function useRequireAdmin() {
  const { data: user, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      navigate({ to: "/login" });
    }
  }, [isLoading, user, navigate]);

  return { user, isLoading };
}
