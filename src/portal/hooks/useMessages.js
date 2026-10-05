import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages, getSent, sendSms, getRecentMessages } from "../api/messages";

export function useRecentMessages() {
  return useQuery({
    queryKey: ["recentMessages"],
    queryFn: getRecentMessages,
    select: (data) => {
      // Ensure data is always an array
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (data?.messages && Array.isArray(data.messages)) return data.messages;
      return [];
    }
  });
}

// One page of a number's messages: { rows, page, lastPage, total, perPage }
export function useMessages(numberId, page = 1) {
  return useQuery({
    queryKey: ["messages", numberId ?? "all", page],
    queryFn: () => getMessages(numberId, page),
    enabled: !!numberId,
    // keep the current page on screen while the next loads — but not across numbers
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[1] === (numberId ?? "all") ? prev : undefined),
  });
}

export function useSent(numberId) {
  return useQuery({ queryKey: ["sent", numberId ?? "all"], queryFn: () => getSent(numberId), enabled: !!numberId });
}

export function useSendSms(numberId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ to, body }) => sendSms(numberId, { to, body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sent", numberId ?? "all"] }),
  });
}
