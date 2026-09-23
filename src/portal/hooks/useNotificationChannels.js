import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getChannels, addChannel, verifyEmailChannel, checkTelegramConnected, removeChannel, updateChannelNumbers, updateChannelEvents } from "../api/notifications";

const KEY = ["notification-channels"];

export function useNotificationChannels() {
  return useQuery({ queryKey: KEY, queryFn: getChannels });
}

function useChannelMutation(fn) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export const useAddChannel = () => useChannelMutation(addChannel);
export const useVerifyEmailChannel = () => useChannelMutation(verifyEmailChannel);
export const useCheckTelegram = () => useChannelMutation(checkTelegramConnected);
export const useRemoveChannel = () => useChannelMutation(removeChannel);
export const useUpdateChannelNumbers = () => useChannelMutation(updateChannelNumbers);
export const useUpdateChannelEvents = () => useChannelMutation(updateChannelEvents);
