import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSharedCountries, getSharedServices, getSharedNumbers, getSharedRentTimes,
  getPrivateCountries, getPrivateAvailableNumbers, getPrivatePlans, purchaseNumber,
} from "../api/buy";

const CATALOG = 5 * 60 * 1000;

export function useSharedCountries(enabled = true) {
  return useQuery({ queryKey: ["buy", "shared-countries"], queryFn: getSharedCountries, staleTime: CATALOG, enabled });
}

export function useSharedServices(countryId) {
  return useQuery({ queryKey: ["buy", "shared-services", countryId], queryFn: () => getSharedServices(countryId), enabled: !!countryId, staleTime: CATALOG });
}

// free-number pools change as people buy, so never serve these from cache
export function useSharedNumbers(countryId, serviceId) {
  return useQuery({
    queryKey: ["buy", "shared-numbers", countryId, serviceId],
    queryFn: () => getSharedNumbers({ countryId, serviceId }),
    enabled: !!countryId && !!serviceId,
    staleTime: 0,
  });
}

export function useSharedRentTimes(enabled = true) {
  return useQuery({ queryKey: ["buy", "rent-times"], queryFn: getSharedRentTimes, staleTime: CATALOG, enabled });
}

export function usePrivateCountries(enabled = true) {
  return useQuery({ queryKey: ["buy", "private-countries"], queryFn: getPrivateCountries, staleTime: CATALOG, enabled });
}

export function usePrivateAvailableNumbers({ iso, state, page }) {
  return useQuery({
    queryKey: ["buy", "private-numbers", iso, state || null, page || 0],
    queryFn: () => getPrivateAvailableNumbers({ iso, state, page }),
    enabled: !!iso,
    staleTime: 0,
    retry: false,
  });
}

export function usePrivatePlans(countryId) {
  return useQuery({ queryKey: ["buy", "private-plans", countryId], queryFn: () => getPrivatePlans(countryId), enabled: !!countryId, staleTime: CATALOG });
}

export function usePurchaseNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: purchaseNumber,
    onSuccess: () => {
      // Invalidate balance first (most important for user awareness)
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["numbers"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["recent-activity"] });
      qc.invalidateQueries({ queryKey: ["buy", "shared-numbers"] });
    },
  });
}
