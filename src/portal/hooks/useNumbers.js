import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNumbers, getNumberExtensionPlans, releaseNumber, renameNumber, extendNumber, getRestoreNumberPrice, restoreNumber, transferNumber, updateAutoRenew, sendSmsFromNumber } from "../api/numbers";

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

export function useExtendNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, plan, typeId }) => extendNumber(numberId, { plan, typeId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useRestoreNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (numberId) => restoreNumber(numberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["numbers"] });
      // the reactivation fee comes out of the wallet, so the balance is stale too
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useReleaseNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, typeId }) => releaseNumber(numberId, typeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useRenameNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, label, typeId }) => renameNumber(numberId, label, typeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useTransferNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, toZedId, typeId }) => transferNumber(numberId, toZedId, typeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["numbers"] }),
  });
}

export function useUpdateAutoRenew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, enabled, typeId }) => updateAutoRenew(numberId, enabled, typeId),
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

export function useNumberExtensionPlans(numberId, typeId) {
  return useQuery({
    queryKey: ["extension-plans", numberId, typeId],
    queryFn: () => getNumberExtensionPlans(numberId, typeId),
    enabled: !!numberId,
    select: (data) => {
      if (Array.isArray(data)) return data;
      return [];
    }
  });
}

export function useRestoreNumberPrice(numberId) {
  return useQuery({
    queryKey: ["restore-price", numberId],
    queryFn: () => getRestoreNumberPrice(numberId),
    enabled: !!numberId,
    // errors here are eligibility answers ("window expired" etc.), not flaky network
    retry: false,
    // always quote the live price when the modal opens
    staleTime: 0,
  });
}
