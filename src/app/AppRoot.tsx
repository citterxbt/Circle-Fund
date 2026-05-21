import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, createAuthenticationAdapter, RainbowKitAuthenticationProvider } from '@rainbow-me/rainbowkit';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SiweMessage } from 'siwe';
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
    const response = await fetch('/api/auth/nonce');
    const { nonce } = await response.json();
    return nonce;
  },
  createMessage: ({ nonce, address, chainId }) => {
    return new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in with Ethereum to the app.',
      uri: window.location.origin,
      version: '1',
      chainId,
      nonce,
    }).prepareMessage();
  },
  getMessageBody: ({ message }) => message,
  verify: async ({ message, signature }) => {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    });
    
    if (response.ok) {
       const { token } = await response.json();
       localStorage.setItem('supabase_token', token);
       window.dispatchEvent(new Event('auth_change'));
       return true;
    }
    return false;
  },
  signOut: async () => {
    await fetch('/api/auth/logout');
    localStorage.removeItem('supabase_token');
    window.dispatchEvent(new Event('auth_change'));
  },
});

export default function AppRoot() {
  const [authStatus, setAuthStatus] = React.useState<'loading' | 'unauthenticated' | 'authenticated'>('unauthenticated');

  React.useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('supabase_token');
      setAuthStatus(token ? 'authenticated' : 'unauthenticated');
    };
    checkAuth();
    window.addEventListener('auth_change', checkAuth);
    return () => window.removeEventListener('auth_change', checkAuth);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider 
          adapter={authenticationAdapter} 
          status={authStatus}
        >
          <RainbowKitProvider theme={darkTheme({ accentColor: '#2563eb' })}>
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
