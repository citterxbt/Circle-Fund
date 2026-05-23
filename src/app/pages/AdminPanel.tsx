import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from './Dashboard';
import { format } from 'date-fns';

export function AdminPanel() {
  const { address } = useAccount();
  const adminWallet = import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (address?.toLowerCase() === adminWallet) {
      loadAdminData();
    }
  }, [address, adminWallet]);

  async function loadAdminData() {
    const { data: p } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
    if (p) setProposals(p);

    const { data: r } = await supabase.from('milestone_reports').select(`*, milestones(*, proposals(title))`).eq('status', 'pending');
    if (r) setReports(r);
  }

  if (!address || address.toLowerCase() !== adminWallet) {
    return <Navigate to="/app/profile" replace />;
  }

  const updateProposal = async (id: string, status: string) => {
    await supabase.from('proposals').update({ status }).eq('id', id);
    loadAdminData();
  };

  const updateReport = async (report: any, status: string) => {
    await supabase.from('milestone_reports').update({ status }).eq('id', report.id);
    if (status === 'approved') {
      await supabase.from('milestones').update({ status: 'approved' }).eq('id', report.milestone_id);
    } else {
      await supabase.from('milestones').update({ status: 'rejected' }).eq('id', report.milestone_id);
    }
    loadAdminData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-display font-bold mb-8 text-white/80">Admin Control Panel</h1>
        
        <h2 className="text-xl font-bold mb-4">Pending Proposals</h2>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 border-b border-white/10 text-white/60">
              <tr>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Wallet</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {proposals.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.05]">
                  <td className="p-4 font-medium text-white/90">{p.title}</td>
                  <td className="p-4 font-mono text-white/60 text-xs">{p.author_wallet}</td>
                  <td className="p-4 text-slate-300">{p.requested_amount} USDC</td>
                  <td className="p-4"><StatusBadge status={p.status} /></td>
                  <td className="p-4 text-right">
                    {p.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => updateProposal(p.id, 'approved')} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded">Approve</button>
                        <button onClick={() => updateProposal(p.id, 'rejected')} className="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {proposals.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-[#A3A3A3]">No proposals found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Pending Milestone Reports</h2>
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors p-6 rounded-xl flex gap-6">
              <div className="flex-1">
                <div className="text-xs text-white/80 mb-1">{r.milestones.proposals.title}</div>
                <h3 className="text-lg font-semibold mb-2">{r.milestones.title}</h3>
                <div className="text-sm text-white/60 mb-4 whitespace-pre-wrap">{r.content}</div>
                <div className="text-xs text-[#A3A3A3]">Submitted: {format(new Date(r.created_at), 'MMM d, yyyy')}</div>
              </div>
              <div className="w-32 flex flex-col gap-2 justify-center">
                <button onClick={() => updateReport(r, 'approved')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm text-center">Approve</button>
                <button onClick={() => updateReport(r, 'rejected')} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm text-center">Reject</button>
              </div>
            </div>
          ))}
          {reports.length === 0 && <div className="p-8 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors rounded-xl text-center text-[#A3A3A3]">No pending reports.</div>}
        </div>
      </div>
    </div>
  );
}
