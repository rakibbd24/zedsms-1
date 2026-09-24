import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getBalance, getTransactions, transferBalance } from "../api/balance";

/**
 * Industry-standard balance hook with:
 * - Automatic polling for real-time updates
 * - Stale-while-revalidate pattern
 * - Smart invalidation on mutations
 * - Typed error handling
 */
export function useBalance(options = {}) {
  const {
    pollingInterval = 30000, // 30 seconds - industry standard for financial apps
    staleTime = 10000, // 10 seconds before showing stale UI
    gcTime = 5 * 60 * 1000, // Keep cached for 5 minutes
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ["balance"],
    queryFn: getBalance,
    staleTime,
    gcTime,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true, // Keep polling even when tab is hidden
    enabled,
    select: (data) => ({
      amount: data.balance,
      formattedAmount: `$${data.balance.toFixed(2)}`,
      rawBalance: data.balance,
      lastUpdated: data.timestamp,
    }),
  });
}

/**
 * Fetch transactions with pagination
 * Useful for transaction history page
 */
export function useTransactions(page = 1) {
  return useQuery({
    queryKey: ["transactions", page],
    queryFn: () => getTransactions(page),
    staleTime: 30000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Mutation for balance transfer
 * Automatically invalidates balance query on success
 */
export function useBalanceTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, recipient }) =>
      transferBalance(amount, recipient),
    onSuccess: () => {
      // Immediately refetch balance after transfer
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
    },
    onError: (error) => {
      // Error is automatically passed to error boundary
      console.error("Balance transfer failed:", error.message);
    },
  });
}

/**
 * Manually trigger balance refresh
 * Used when balance changes happen via payment or other operations
 */
export function useRefreshBalance() {
  const queryClient = useQueryClient();

  return {
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["balance"] }),
    prefetch: () =>
      queryClient.prefetchQuery({
        queryKey: ["balance"],
        queryFn: getBalance,
        staleTime: 10000,
      }),
  };
}

/**
 * Get balance from cache without refetching
 * Useful for showing current cached balance in multiple components
 */
export function useCachedBalance() {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData(["balance"]);

  return {
    amount: data?.balance || 0,
    formatted: data ? `$${data.balance.toFixed(2)}` : "$0.00",
    isStale: data ? queryClient.isFetching({ queryKey: ["balance"] }) > 0 : false,
  };
}
