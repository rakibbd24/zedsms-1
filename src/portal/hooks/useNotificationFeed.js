import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications";

const KEY = ["notifications"];

// Paged feed for the bell menu; pages accumulate as the user loads more.
export function useNotificationFeed(enabled = true) {
  return useInfiniteQuery({
    queryKey: KEY,
    queryFn: ({ pageParam = 1 }) => getNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.lastPage ? last.page + 1 : undefined),
    enabled,
    // the bell should not sit on a stale list
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    // flip it locally first — the row is already open in front of the user
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData(KEY);
      qc.setQueryData(KEY, (old) => old && {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          items: p.items.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
        })),
      });
      return { previous };
    },
    onError: (_err, _id, ctx) => { if (ctx?.previous) qc.setQueryData(KEY, ctx.previous); },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
