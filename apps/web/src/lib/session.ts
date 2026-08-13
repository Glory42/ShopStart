import { useQuery } from "@tanstack/react-query";
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
