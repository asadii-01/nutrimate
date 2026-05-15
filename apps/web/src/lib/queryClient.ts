import { QueryClient } from "@tanstack/react-query";
import { ApiClientError } from "./api";

/**
 * Shared TanStack Query client.
 *
 * Auth failures (401/403) are not retried — the axios layer already handles
 * token refresh, so a surviving 401 means the session is genuinely gone.
 */
export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
