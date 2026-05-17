/** Health-risk API calls + query hook. Mirrors `GET /health-risk` (SVM model). */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { HealthRisk } from "@nutrimate/shared-types";
import { ApiClientError, apiGet } from "../../lib/api";

export const healthRiskKeys = {
  current: ["health-risk"] as const,
};

export function getHealthRisk(): Promise<HealthRisk> {
  return apiGet<HealthRisk>("/health-risk");
}

/** Multi-factor health-risk grade. A 404 means no profile yet. */
export function useHealthRisk(): UseQueryResult<HealthRisk, ApiClientError> {
  return useQuery<HealthRisk, ApiClientError>({
    queryKey: healthRiskKeys.current,
    queryFn: getHealthRisk,
    retry: (count, error) =>
      !(error instanceof ApiClientError && error.status === 404) && count < 2,
  });
}
