import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from './Dashboard';
import { Link } from 'react-router-dom';

export function Profile() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    if (!address) return;

    async function loadData() {
      // Upsert profile for claimed amount simulation
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address?.toLowerCase())
        .single();
        
      if (prof) {
        setProfile(prof);
      } else {
        const { data: newProf } = await supabase
          .from('profiles')
          .insert({ wallet_address: address?.toLowerCase() })
          .select()
          .single();
        setProfile(newProf);
      }

      // Load all proposals by user
      const { data: props } = await supabase
        .from('proposals')
        .select('*')
        .eq('author_wallet', address?.toLowerCase())
        .order('created_at', { ascending: false });
      
      if (props) setProposals(props);
    }
    
    loadData();
  }, [address]);

  if (!address) return <div className="text-center py-12">Please connect wallet.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Builder Profile</h1>
          <div className="text-slate-400 font-mono text-sm">{address}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400 mb-1">Total Claimed Funding</div>
          <div className="text-4xl font-display font-medium text-emerald-400">
            {profile?.total_claimed || 0} <span className="text-xl text-slate-500">USDC</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6">Proposal History</h2>
      {proposals.length === 0 ? (
        <div className="text-center text-slate-500 py-12 border border-dark-800 rounded-xl bg-dark-900">
          No proposals submitted.
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(p => (
            <Link to={`/app/proposals/${p.id}`} key={p.id} className="block bg-dark-900 border border-dark-800 p-6 rounded-xl hover:border-primary-500/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-1">{p.title}</h3>
                  <div className="text-sm text-slate-400 max-w-2xl truncate">{p.description}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-sm text-slate-500 flex gap-6">
                <span>Requested: {p.requested_amount} USDC</span>
                <span>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
