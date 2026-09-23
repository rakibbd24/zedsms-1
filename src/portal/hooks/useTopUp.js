import { useMutation, useQuery } from "@tanstack/react-query";
import { getPaymentGateways, startTopUp } from "../api/topup";

export function usePaymentGateways() {
  return useQuery({ queryKey: ["payment-gateways"], queryFn: getPaymentGateways, staleTime: 5 * 60 * 1000 });
}

// On success the browser is already navigating to the gateway, so there's nothing to invalidate here —
// the return page refreshes balance and transactions once the order settles.
export function useStartTopUp() {
  return useMutation({ mutationFn: ({ gateway, amount }) => startTopUp(gateway, amount) });
}
