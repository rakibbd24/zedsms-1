import { useQuery } from "@tanstack/react-query";
import { getMessages, getRecentMessages } from "../api/messages";

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

// One page of a number's messages: { rows, page, lastPage, total, perPage }.
// Keyed by type as well as id — a shared and a private number can have the same id,
// and keying by id alone showed one number's messages under the other.
export function useMessages(numberId, page = 1, typeId) {
  return useQuery({
    queryKey: ["messages", numberId ?? "all", page, typeId ?? null],
    queryFn: () => getMessages(numberId, page, typeId),
    enabled: !!numberId,
    // keep the current page on screen while the next loads — but not across numbers
    placeholderData: (prev, prevQuery) =>
      (prevQuery?.queryKey[1] === (numberId ?? "all") && prevQuery?.queryKey[3] === (typeId ?? null) ? prev : undefined),
  });
}

