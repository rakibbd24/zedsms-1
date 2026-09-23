import React, { createContext, useContext } from "react";
import { useAuth as useAuthHook } from "../hooks/useAuth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const auth = useAuthHook();

  // Auth state conditions
  const isLoggedIn = !!auth.user;
  const isEmailVerified = !!auth.user && auth.user.email_verified_at !== null;
  // Whether 2FA is switched on for the account (shown in Settings). It is NOT a
  // gate on the dashboard: the token only exists once the code has been accepted
  // at sign-in, so a logged-in 2FA user has already passed that step.
  const has2FA = auth.user?.login_security?.google2fa_enable === 1;
  const isDisabled = auth.user?.status === 0;

  // Current auth state
  const authState = {
    isLoggedIn,
    isEmailVerified,
    has2FA,
    isDisabled,
    needsEmailVerification: isLoggedIn && !isEmailVerified,
    canAccessDashboard: isLoggedIn && isEmailVerified && !isDisabled,
  };

  return (
    <AuthContext.Provider value={{ ...auth, ...authState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
