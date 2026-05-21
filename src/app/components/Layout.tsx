import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LayoutDashboard, FileText, CheckSquare, UserCircle, Settings, Home } from 'lucide-react';
import { useAccount } from 'wagmi';

export function Layout() {
  const { address } = useAccount();
  const location = useLocation();
  const adminWallet = import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();
  const isAdmin = address && adminWallet && address.toLowerCase() === adminWallet;

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
    { label: 'Explore Proposals', path: '/app/proposals', icon: <Home className="w-5 h-5" /> },
    { label: 'Submit Proposal', path: '/app/submit', icon: <FileText className="w-5 h-5" /> },
    { label: 'Milestone Tracker', path: '/app/milestones', icon: <CheckSquare className="w-5 h-5" /> },
    { label: 'My Profile', path: '/app/profile', icon: <UserCircle className="w-5 h-5" /> },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Panel', path: '/app/admin', icon: <Settings className="w-5 h-5" /> });
  }

  return (
    <div className="min-h-screen bg-dark-900 flex text-slate-100 font-sans selection:bg-primary-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-dark-800 bg-dark-950 flex flex-col fixed inset-y-0 text-sm">
        <div className="p-6">
          <Link to="/" className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">C</span>
            Circle Fund
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-500/10 text-primary-400 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-dark-800">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
