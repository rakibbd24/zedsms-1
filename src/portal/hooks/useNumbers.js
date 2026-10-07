import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expectOwnEvent } from "../lib/ownActions";
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

// Server-side search over my-numbers. Resolves to the set of uids ("shared:7" / "private:3")
// that match, so the screen can combine it with its own label filter. Off for an empty query.
export function useNumberSearch(query) {
  const term = (query || "").trim();
  return useQuery({
    queryKey: ["numbers", "search", term],
    queryFn: () => getNumbers({ search: term }),
    enabled: term.length > 0,
    staleTime: 30 * 1000,
    select: (rows) => new Set(rows.map((n) => `${String(n.type).toLowerCase() === "private" ? "private" : "shared"}:${n.id}`)),
  });
}

export function useExtendNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, plan, typeId }) => extendNumber(numberId, { plan, typeId }),
    onMutate: () => expectOwnEvent("NumberExtendNotification"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["numbers"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["recent-activity"] });
    },
  });
}

export function useRestoreNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (numberId) => restoreNumber(numberId),
    onSuccess: () => {
      // the reactivation fee comes out of the wallet, so the balance is stale too
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["numbers"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["recent-activity"] });
    },
  });
}

export function useReleaseNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numberId, typeId }) => releaseNumber(numberId, typeId),
    onMutate: () => expectOwnEvent("NumberCancelNotification"),
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
    onMutate: () => expectOwnEvent("NumberTransferNotification"),
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
      // sent and held messages both take the cost out of the balance
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
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
