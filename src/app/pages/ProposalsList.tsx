import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { StatusBadge } from './Dashboard';
import { format } from 'date-fns';
import { Filter } from 'lucide-react';

export function ProposalsList() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [filter, setFilter] = useState('newest'); // newest, oldest, pending, approved, rejected

  useEffect(() => {
    async function fetchDocs() {
      let query = supabase.from('proposals').select('*');
      
      if (filter === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (filter === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.eq('status', filter).order('created_at', { ascending: false });
      }

      const { data } = await query;
      if (data) setProposals(data);
    }
    fetchDocs();
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Explore Proposals</h1>
          <p className="text-white/60">Discover and review community submitted projects.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-lg">
          <Filter className="w-4 h-4 text-white/40" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent text-sm text-white/90 outline-none border-none cursor-pointer"
          >
            <option value="newest" className="bg-[#0A0A0A]">Newest First</option>
            <option value="oldest" className="bg-[#0A0A0A]">Oldest First</option>
            <option value="pending" className="bg-[#0A0A0A]">Status: Pending</option>
            <option value="approved" className="bg-[#0A0A0A]">Status: Approved</option>
            <option value="rejected" className="bg-[#0A0A0A]">Status: Rejected</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="p-8 text-center text-white/40 bg-white/5 border border-white/10 rounded-xl">
            No proposals found for the selected filter.
          </div>
        ) : (
          proposals.map(p => (
          <Link to={`/app/proposals/${p.id}`} key={p.id} className="block bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 p-6 rounded-xl hover:border-white/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white/90 mb-2">{p.title}</h3>
                <div className="text-sm text-white/60 max-w-2xl truncate">{p.description}</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="flex items-center gap-6 border-t border-white/10 pt-4 mt-2">
              <div className="text-sm text-white/60">
                <span className="text-[#A3A3A3] mr-2">Requested:</span>
                <span className="text-white/90 font-medium">{p.requested_amount} USDC</span>
              </div>
              <div className="text-sm text-white/60">
                <span className="text-[#A3A3A3] mr-2">Submitted:</span>
                <span className="text-white/90 font-medium">{format(new Date(p.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </Link>
          ))
        )}
      </div>
    </div>
  );
}
