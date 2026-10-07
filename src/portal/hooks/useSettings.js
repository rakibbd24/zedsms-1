import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfile, changePassword, requestEmailChange, verifyEmailChange,
  getSessions, revokeSession, revokeOtherSessions,
  get2fa, generate2faSecret, enable2fa, disable2fa, regenerateRecoveryCodes, deleteAccount,
} from "../api/settings";
import { updateStoredUser } from "../api/auth";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: getProfile });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}

export function useRequestEmailChange() {
  return useMutation({ mutationFn: requestEmailChange });
}

// Called with { otp, email } — the API answers with a message only, so the address that
// was confirmed is written into the stored session here (sidebar, nav, transfer self-check).
export function useVerifyEmailChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ otp }) => verifyEmailChange(otp),
    onSuccess: (_msg, { email }) => {
      const user = email ? updateStoredUser({ email, email_verified_at: new Date().toISOString() }) : null;
      if (user) qc.setQueryData(["auth:user"], user);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useSessions(enabled = true) {
  return useQuery({ queryKey: ["sessions"], queryFn: getSessions, enabled });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// Only fetched while the 2FA dialog is open — it returns the current secret.
export function use2fa(enabled) {
  return useQuery({ queryKey: ["2fa"], queryFn: get2fa, enabled, staleTime: 0, gcTime: 0 });
}

export function useGenerate2faSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generate2faSecret,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["2fa"] }),
  });
}

export function useEnable2fa() {
  return useMutation({ mutationFn: enable2fa });
}

export function useRegenerateRecoveryCodes() {
  return useMutation({ mutationFn: regenerateRecoveryCodes });
}

export function useDisable2fa() {
  return useMutation({ mutationFn: disable2fa });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: deleteAccount });
}
