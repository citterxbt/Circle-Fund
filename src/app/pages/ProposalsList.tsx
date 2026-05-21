import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { StatusBadge } from './Dashboard';
import { format } from 'date-fns';

export function ProposalsList() {
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDocs() {
      const { data } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
      if (data) setProposals(data);
    }
    fetchDocs();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">Explore Proposals</h1>
      <div className="space-y-4">
        {proposals.map(p => (
          <Link to={`/app/proposals/${p.id}`} key={p.id} className="block bg-dark-900 border border-dark-800 p-6 rounded-xl hover:border-primary-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">{p.title}</h3>
                <div className="text-sm text-slate-400 max-w-2xl truncate">{p.description}</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="flex items-center gap-6 border-t border-dark-800 pt-4 mt-2">
              <div className="text-sm text-slate-400">
                <span className="text-slate-500 mr-2">Requested:</span>
                <span className="text-slate-200 font-medium">{p.requested_amount} USDC</span>
              </div>
              <div className="text-sm text-slate-400">
                <span className="text-slate-500 mr-2">Submitted:</span>
                <span className="text-slate-200 font-medium">{format(new Date(p.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
