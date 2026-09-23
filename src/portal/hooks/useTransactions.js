import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTransactions, transferBalance } from "../api/transactions";

export function useTransactions(page = 1) {
  return useQuery({
    queryKey: ["transactions", page],
    queryFn: () => getTransactions(page),
    // keep the current page on screen while the next one loads
    placeholderData: (prev) => prev,
  });
}

export function useTransferBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipient, amount }) => transferBalance({ recipient, amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
