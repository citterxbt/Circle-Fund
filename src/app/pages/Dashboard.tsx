import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const { address } = useAccount();
  const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0 });
  const [recentProposals, setRecentProposals] = useState<any[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<any[]>([]);

  useEffect(() => {
    if (!address) return;
    
    async function loadDash() {
      // Load proposals
      const { data: proposals } = await supabase
        .from('proposals')
        .select('*')
        .eq('author_wallet', address?.toLowerCase())
        .order('created_at', { ascending: false });

      if (proposals) {
        setRecentProposals(proposals.slice(0, 3));
        setStats({
          active: proposals.filter(p => p.status === 'approved').length,
          pending: proposals.filter(p => p.status === 'pending').length,
          completed: proposals.filter(p => p.status === 'completed').length,
        });

        // Load milestones for active proposals
        const activeIds = proposals.filter(p => p.status === 'approved').map(p => p.id);
        if (activeIds.length > 0) {
          const { data: milestones } = await supabase
            .from('milestones')
            .select(`*, proposals(title)`)
            .in('proposal_id', activeIds)
            .eq('status', 'pending')
            .order('deadline', { ascending: true })
            .limit(3);
          if (milestones) setUpcomingMilestones(milestones);
        }
      }
    }
    loadDash();
  }, [address]);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h1 className="text-3xl font-display font-bold mb-4">Welcome to Circle Fund</h1>
        <p className="text-white/60 mb-8 max-w-md">Connect your wallet to manage your proposals, track milestones, and claim funding.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-8">Builder Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-6 mb-12">
        <StatCard title="Active Proposals" value={stats.active} />
        <StatCard title="Pending Review" value={stats.pending} />
        <StatCard title="Completed" value={stats.completed} />
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-white/80" />
              Recent Proposals
            </h2>
          </div>
          {recentProposals.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors rounded-xl p-8 text-center text-[#A3A3A3]">
              No proposals submitted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentProposals.map(p => (
                <Link to={`/app/proposals/${p.id}`} key={p.id} className="block bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 p-5 rounded-xl hover:border-white/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white/90">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm text-white/60">
                    Requested: {p.requested_amount} USDC
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Upcoming Milestones
            </h2>
            <Link to="/app/milestones" className="text-sm text-white/80 hover:text-white flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {upcomingMilestones.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors rounded-xl p-8 text-center text-[#A3A3A3]">
              No upcoming milestones.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMilestones.map(m => (
                <div key={m.id} className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors p-5 rounded-xl">
                  <div className="text-xs text-white/80 mb-1">{m.proposals?.title}</div>
                  <h3 className="font-semibold text-white/90 mb-2">{m.title}</h3>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>{m.amount} USDC</span>
                    <span>Due: {format(new Date(m.deadline), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: number | string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors p-6 rounded-2xl">
      <div className="text-sm text-white/60 mb-2">{title}</div>
      <div className="text-4xl font-display font-medium text-white">{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    report_submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    claimed: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };
  const c = colors[status.toLowerCase()] || colors.pending;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${c} capitalize`}>
      {status.replace('_', ' ')}
    </span>
  );
}
