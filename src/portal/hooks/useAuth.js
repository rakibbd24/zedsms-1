import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth";
import { useCallback } from "react";

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const userQuery = useQuery({
    queryKey: ["auth:user"],
    queryFn: async () => {
      const token = localStorage.getItem("zedsms-token");
      if (!token) return null;
      try {
        return await authApi.getMe();
      } catch (err) {
        localStorage.removeItem("zedsms-token");
        localStorage.removeItem("zedsms-user");
        throw err;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // a 2FA account gets no user/token here — it finishes through verifyMfa
      if (data?.user) queryClient.setQueryData(["auth:user"], data.user);
    },
  });

  // Sign up mutation
  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth:user"], data.user);
    },
  });

  // Social sign-in (Google / Apple / Telegram). Like password login, a 2FA
  // account returns a challenge instead of a user, so only set what we got.
  const socialLoginMutation = useMutation({
    mutationFn: ({ provider, ...payload }) =>
      provider === "apple" ? authApi.loginWithApple(payload)
        : provider === "telegram" ? authApi.loginWithTelegram(payload.data)
        : authApi.loginWithGoogle(payload),
    onSuccess: (data) => {
      if (data?.user) queryClient.setQueryData(["auth:user"], data.user);
    },
  });

  // OTP verification mutation
  const verifyMfaMutation = useMutation({
    mutationFn: authApi.verifyMfa,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth:user"], data.user);
    },
  });

  // Logout
  const logout = useCallback(() => {
    authApi.logout();
    queryClient.setQueryData(["auth:user"], null);
  }, [queryClient]);

  return {
    // State
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isLoggedIn: !!userQuery.data,

    // Login
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,

    // Sign up
    signup: signupMutation.mutate,
    signupAsync: signupMutation.mutateAsync,
    isSignupLoading: signupMutation.isPending,
    signupError: signupMutation.error,

    // Social login
    socialLogin: socialLoginMutation.mutate,
    socialLoginAsync: socialLoginMutation.mutateAsync,
    isSocialLoginLoading: socialLoginMutation.isPending,
    socialLoginError: socialLoginMutation.error,

    // OTP
    verifyMfa: verifyMfaMutation.mutate,
    verifyMfaAsync: verifyMfaMutation.mutateAsync,
    isVerifyMfaLoading: verifyMfaMutation.isPending,
    verifyMfaError: verifyMfaMutation.error,

    // Re-read the signed-in user from the API (after email verification, etc.)
    refreshUser: userQuery.refetch,

    // Logout
    logout,
  };
}
