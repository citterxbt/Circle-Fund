import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FileText, CheckSquare, UserCircle, Settings, Home } from 'lucide-react';
import { useAccount } from 'wagmi';

export function Layout() {
  const { address } = useAccount();
  const location = useLocation();
  const adminWallet = import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();
  const isAdmin = address && adminWallet && address.toLowerCase() === adminWallet;

  const navItems = [
    { label: 'Explore Proposals', path: '/app/proposals', icon: <Home className="w-4 h-4" /> },
    { label: 'Submit Proposal', path: '/app/submit', icon: <FileText className="w-4 h-4" /> },
    { label: 'Milestone Tracker', path: '/app/milestones', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'My Profile', path: '/app/profile', icon: <UserCircle className="w-4 h-4" /> },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Panel', path: '/app/admin', icon: <Settings className="w-4 h-4" /> });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col text-white font-sans selection:bg-white/20">
      <header className="fixed top-0 inset-x-0 h-24 z-50 flex items-center justify-between px-[5%] md:px-[8%]">
        <Link to="/" className="flex items-center shrink-0">
          <div className="w-8 h-8 rounded-full border-[3px] border-white flex items-center justify-center p-[2px]">
            <div className="w-full h-full rounded-full bg-white"></div>
          </div>
        </Link>
        <nav className="hidden lg:flex items-center gap-3 text-[11px] font-semibold tracking-[0.1em] uppercase font-sans">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors backdrop-blur-md border ${
                  isActive ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center shrink-0">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </header>

      <main className="flex-1 mt-24 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
