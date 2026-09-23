import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const {
    isLoggedIn,
    isEmailVerified,
    isDisabled,
    isLoading,
  } = useAuthContext();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e0e0e0", borderTopColor: "#2155f5", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#666" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to signin
  if (!isLoggedIn) {
    return <Navigate to="/auth/signin" replace />;
  }

  // User is disabled
  if (isDisabled) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#f9f9fa" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Account Disabled</h1>
          <p style={{ color: "#666", fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
            Your account has been disabled. Please contact support for more information.
          </p>
          <button
            onClick={() => (window.location.href = "mailto:support@zedsms.com")}
            style={{ padding: "10px 20px", borderRadius: 8, background: "#2155f5", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  // Email not verified - redirect to verification page
  if (!isEmailVerified) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  // All checks passed - render dashboard
  return children;
};
