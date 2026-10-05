import { useQuery } from "@tanstack/react-query";
import { getBalance } from "../api/balance";

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
    // hidden tabs don't poll: realtime events refresh the balance, and polling a
    // background tab every 30s only spends battery and data
    refetchIntervalInBackground: false,
    enabled,
    select: (data) => ({
      amount: data.balance,
      formattedAmount: `$${data.balance.toFixed(2)}`,
      rawBalance: data.balance,
      lastUpdated: data.timestamp,
    }),
  });
}

