import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

// Inverse of ProtectedRoute, for the sign-in / sign-up pages: someone who
// already holds a session is sent on instead of being asked to log in again.
export const GuestRoute = ({ children }) => {
  const { isLoggedIn, isEmailVerified, isLoading } = useAuthContext();

  // the stored session is read synchronously, so this is only a brief flash
  if (isLoading) return null;

  if (isLoggedIn) {
    return <Navigate to={isEmailVerified ? "/app/home" : "/auth/verify-email"} replace />;
  }

  return children;
};
