import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "../api/auth";

/**
 * Hook to get current user data from localStorage cache
 * For fresh balance, use useBalance hook instead
 */
export function useUser() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: Infinity, // User data is fetched only on login, never stale during session
    gcTime: Infinity,
    // Whenever user changes, also refetch balance
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}
