import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buyNumber, getNumbers, getNumberExtensionPlans, releaseNumber, renameNumber, extendNumber, transferNumber, updateAutoRenew, sendSmsFromNumber } from "../api/numbers";

export function useNumbers() {
  return useQuery({
    queryKey: ["numbers"],
    queryFn: getNumbers,
    select: (data) => {
      // Ensure data is always an array
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (data?.numbers && Array.isArray(data.numbers)) return data.numbers;
      return [];
    }
  });
}

export function useBuyNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: buyNumber,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useExtendNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, plan }) => extendNumber(numberId, { plan }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useReleaseNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: releaseNumber,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useRenameNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, label }) => renameNumber(numberId, label),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useTransferNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, toZedId }) => transferNumber(numberId, toZedId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useUpdateAutoRenew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, enabled }) => updateAutoRenew(numberId, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useSendSmsFromNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, to, body }) => sendSmsFromNumber(numberId, { to, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["sent"] });
    },
  });
}

export function useNumberExtensionPlans(numberId) {
  return useQuery({
    queryKey: ["extension-plans", numberId],
    queryFn: () => getNumberExtensionPlans(numberId),
    enabled: !!numberId,
    select: (data) => {
      if (Array.isArray(data)) return data;
      return [];
    }
  });
}
