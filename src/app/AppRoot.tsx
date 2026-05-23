
import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, createAuthenticationAdapter, RainbowKitAuthenticationProvider } from "@rainbow-me/rainbowkit";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { createSiweMessage } from "viem/siwe";
import { wagmiConfig as config } from "../lib/wagmi";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { SubmitProposal } from "./pages/SubmitProposal";
import { MilestoneTracker } from "./pages/MilestoneTracker";
import { ProposalsList } from "./pages/ProposalsList";
import { ProposalDetail } from "./pages/ProposalDetail";
import { AdminPanel } from "./pages/AdminPanel";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

const authenticationAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    try {
      console.log("[AuthenticationAdapter] Fetching nonce...");
      const response = await fetch("/api/auth/nonce");
      if (!response.ok) {
          throw new Error("Failed to fetch nonce. Status: " + response.status);
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (!data.nonce) throw new Error("Nonce missing from response JSON");
        console.log("[AuthenticationAdapter] GetNonce success:", data.nonce);
        return data.nonce;
      } catch (err) {
         console.error("[AuthenticationAdapter] Failed to parse nonce JSON. Response text:", text);
         throw new Error("Invalid nonce response format from server");
      }
    } catch (e) {
      console.error("[AuthenticationAdapter] error in getNonce:", e);
      throw e;
    }
  },
  createMessage: ({ nonce, address, chainId }) => {
    try {
      console.log("[AuthenticationAdapter] createMessage invoked with parameters:", { nonce, address, chainId });
      
      const domain = typeof window !== "undefined" ? window.location.host : "localhost";
      const uri = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      
      const message = createSiweMessage({
        domain,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri,
        version: "1",
        chainId: chainId || 5042002,
        nonce,
      });
      
      console.log("[AuthenticationAdapter] createMessage generated string successfully:", message);
      return message;
    } catch (err: any) {
      console.error("[AuthenticationAdapter] error in createMessage:", err);
      // Ensure the error is visible and propagated
      throw new Error("Error generating SIWE message: " + err.message);
    }
  },
  verify: async ({ message, signature }) => {
    try {
      console.log("[AuthenticationAdapter] verify invoked with message and signature:", { message, signature });
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      
      console.log("[AuthenticationAdapter] verification response status:", response.status);
      if (response.ok) {
         const { token } = await response.json();
         console.log("[AuthenticationAdapter] Verification successful. Token saved.");
         localStorage.setItem("supabase_token", token);
         window.dispatchEvent(new Event("auth_change"));
         return true;
      } else {
         const errText = await response.text();
         console.error("[AuthenticationAdapter] Verification failed:", errText);
         return false;
      }
    } catch (e) {
      console.error("[AuthenticationAdapter] Error in verify:", e);
      return false;
    }
  },
  signOut: async () => {
    try {
      console.log("[AuthenticationAdapter] signing out...");
      await fetch("/api/auth/logout");
      localStorage.removeItem("supabase_token");
      window.dispatchEvent(new Event("auth_change"));
    } catch (e) {
      console.error("[AuthenticationAdapter] Error in signOut:", e);
    }
  },
});

export default function AppRoot() {
  const [authStatus, setAuthStatus] = React.useState<"loading" | "unauthenticated" | "authenticated">(() => {
    const token = localStorage.getItem("supabase_token");
    return (token && token !== "undefined" && token !== "null" && token.startsWith("eyJ")) ? "authenticated" : "unauthenticated";
  });

  React.useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("supabase_token");
      setAuthStatus((token && token !== "undefined" && token !== "null" && token.startsWith("eyJ")) ? "authenticated" : "unauthenticated");
    };
    window.addEventListener("auth_change", checkAuth);
    return () => window.removeEventListener("auth_change", checkAuth);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider 
          adapter={authenticationAdapter} 
          status={authStatus}
        >
          <RainbowKitProvider theme={darkTheme({ accentColor: "#ffffff", accentColorForeground: "#000000" })}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="submit" element={<SubmitProposal />} />
                <Route path="milestones" element={<MilestoneTracker />} />
                <Route path="proposals" element={<ProposalsList />} />
                <Route path="proposals/:id" element={<ProposalDetail />} />
                <Route path="admin" element={<AdminPanel />} />
              </Route>
            </Routes>
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
