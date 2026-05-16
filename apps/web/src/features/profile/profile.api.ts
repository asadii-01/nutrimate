/** Profile API calls + query hooks. Mirrors TRD §4.2. */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { Profile, ProfileInput, ProfilePatch } from "@nutrimate/shared-types";
import { ApiClientError, apiGet, apiPatch, apiPost } from "../../lib/api";

export const profileKeys = {
  detail: ["profile"] as const,
};

export function getProfile(): Promise<Profile> {
  return apiGet<Profile>("/profile");
}

export function createProfile(input: ProfileInput): Promise<Profile> {
  return apiPost<Profile>("/profile", input);
}

export function updateProfile(patch: ProfilePatch): Promise<Profile> {
  return apiPatch<Profile>("/profile", patch);
}

/** Loads the current user's profile. A 404 means setup is not done yet. */
export function useProfile(): UseQueryResult<Profile, ApiClientError> {
  return useQuery<Profile, ApiClientError>({
    queryKey: profileKeys.detail,
    queryFn: getProfile,
    retry: (count, error) => !(error instanceof ApiClientError && error.status === 404) && count < 2,
  });
}

/** PATCH /profile — recompute happens server-side; predictions are invalidated. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail, profile);
      void queryClient.invalidateQueries({ queryKey: ["prediction"] });
      void queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      void queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}
