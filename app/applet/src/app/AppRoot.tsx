import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, createAuthenticationAdapter, RainbowKitAuthenticationProvider } from '@rainbow-me/rainbowkit';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { createSiweMessage } from 'viem/siwe';
import { wagmiConfig as config } from '../lib/wagmi';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { SubmitProposal } from './pages/SubmitProposal';
import { MilestoneTracker } from './pages/MilestoneTracker';
import { ProposalsList } from './pages/ProposalsList';
import { ProposalDetail } from './pages/ProposalDetail';
import { AdminPanel } from './pages/AdminPanel';
import { Layout } from './components/Layout';

const queryClient = new QueryClient();

const authenticationAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    try {
      const response = await fetch('/api/auth/nonce', { credentials: 'login' === 'login' ? 'same-origin' : 'include' });
      if (!response.ok) {
          throw new Error('Failed to fetch nonce. Status: ' + response.status);
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (!data.nonce) throw new Error("Nonce missing");
        return data.nonce;
      } catch (err) {
         console.error('Failed to parse nonce JSON. Response text:', text);
         throw new Error("Invalid nonce response format from server");
      }
    } catch (e) {
      console.error("error in getNonce:", e);
      throw e;
    }
  },
  createMessage: ({ nonce, address, chainId }) => {
    try {
      return createSiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });
    } catch (e) {
      console.error('Error creating SIWE message:', e);
      throw e;
    }
  },
  getMessageBody: ({ message }) => message,
  verify: async ({ message, signature }) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
        credentials: 'login' === 'login' ? 'same-origin' : 'include',
      });
      
      if (response.ok) {
         const { token } = await response.json();
         localStorage.setItem('supabase_token', token);
         window.dispatchEvent(new Event('auth_change'));
         return true;
      } else {
         const err = await response.json().catch(() => ({}));
         console.error('Verify error:', err);
      }
      return false;
    } catch (e) {
      console.error('Error verifying:', e);
      return false;
    }
  },
  signOut: async () => {
    try {
      await fetch('/api/auth/logout', { credentials: 'login' === 'login' ? 'same-origin' : 'include' });
      localStorage.removeItem('supabase_token');
      window.dispatchEvent(new Event('auth_change'));
    } catch (e) {
      console.error('Error signing out:', e);
    }
  },
});

export default function AppRoot() {
  const [mounted, setMounted] = React.useState(false);
  const [authStatus, setAuthStatus] = React.useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');

  React.useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('supabase_token');
    setAuthStatus(token ? 'authenticated' : 'unauthenticated');
    
    const checkAuth = () => {
      const currentToken = localStorage.getItem('supabase_token');
      setAuthStatus(currentToken ? 'authenticated' : 'unauthenticated');
    };
    window.addEventListener('auth_change', checkAuth);
    return () => window.removeEventListener('auth_change', checkAuth);
  }, []);

  if (!mounted) {
    return null; // Prevents generic React 18/19 Hydration mismatch and StrictMode bugs
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider 
          adapter={authenticationAdapter} 
          status={authStatus}
        >
          <RainbowKitProvider theme={darkTheme({ accentColor: '#ffffff', accentColorForeground: '#000000' })}>
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
