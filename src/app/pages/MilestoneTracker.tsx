import React, { useEffect, useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { StatusBadge } from './Dashboard';
import { Filter } from 'lucide-react';

const USDC_CONTRACT = '0x3600000000000000000000000000000000000000';
const ADMIN_WALLET = '0x27545eB2be12eAF146CaAB5f2436FC933AfA57a5';

const erc20Abi = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export function MilestoneTracker() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [filter, setFilter] = useState('all'); // all, pending, report_submitted, approved, claimed
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [reportContent, setReportContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!address) return;
    loadMilestones();
  }, [address, filter]);

  async function loadMilestones() {
    const { data: props } = await supabase.from('proposals').select('id').eq('author_wallet', address?.toLowerCase());
    if (props && props.length > 0) {
      const pids = props.map(p => p.id);
      let query = supabase
        .from('milestones')
        .select(`*, proposals(title)`)
        .in('proposal_id', pids)
        .order('deadline', { ascending: true });
        
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
        
      const { data: ms } = await query;
      if (ms) setMilestones(ms);
    } else {
      setMilestones([]);
    }
  }

  const submitReport = async () => {
    try {
      setLoading(true);
      await supabase.from('milestone_reports').insert({
        milestone_id: selectedMilestone.id,
        content: reportContent
      });
      await supabase.from('milestones').update({ status: 'report_submitted' }).eq('id', selectedMilestone.id);
      setSelectedMilestone(null);
      setReportContent('');
      loadMilestones();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const claimFunds = async (ms: any) => {
    try {
      setClaimStatus(prev => ({ ...prev, [ms.id]: 'awaiting-signature' }));
      
      console.log("[useWriteContract] Sending 0.01 USDC product usage fee to admin on claim:", ADMIN_WALLET);
      const hash = await writeContractAsync({
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [ADMIN_WALLET, 10000n], // 0.01 USDC (6 decimals)
      } as any);

      setClaimStatus(prev => ({ ...prev, [ms.id]: 'confirming-tx' }));
      
      if (publicClient) {
        console.log("[usePublicClient] Waiting for transaction receipt...", hash);
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

      setClaimStatus(prev => ({ ...prev, [ms.id]: 'completing-claim' }));
      
      const token = localStorage.getItem('supabase_token');
      const response = await fetch(`/api/milestones/${ms.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to finalize claim");
      }

      setClaimStatus(prev => ({ ...prev, [ms.id]: 'success' }));
      loadMilestones();
      
      window.dispatchEvent(new Event("profile_claimed_update"));
      alert(`Success! 0.01 USDC usage fee paid. Your ${ms.amount} USDC claim has been submitted and Total Claimed Funding updated!`);
    } catch (e: any) {
      console.error("Error claiming funds:", e);
      if (e.message?.includes('rejected') || e.message?.includes('User denied')) {
        alert('Transaction signature rejected by user.');
      } else {
        alert(e.message || 'Payment or claim processing failed. Ensure your wallet has sufficient USDC ARC and native ARC for gas.');
      }
    } finally {
      setClaimStatus(prev => {
        const updated = { ...prev };
        delete updated[ms.id];
        return updated;
      });
    }
  };

  if (!address) return <div className="text-center py-12">Please connect wallet.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Milestone Tracker</h1>
          <p className="text-white/60">Track your project milestones and request payouts.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-lg">
          <Filter className="w-4 h-4 text-white/40" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent text-sm text-white/90 outline-none border-none cursor-pointer"
          >
            <option value="all" className="bg-[#0A0A0A]">All Milestones</option>
            <option value="pending" className="bg-[#0A0A0A]">Pending</option>
            <option value="report_submitted" className="bg-[#0A0A0A]">Under Review</option>
            <option value="approved" className="bg-[#0A0A0A]">Approved for Claim</option>
            <option value="claimed" className="bg-[#0A0A0A]">Claimed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="p-8 text-center text-[#A3A3A3] bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors rounded-xl">
            No milestones found for your active proposals.
          </div>
        ) : (
          milestones.map(ms => (
            <div key={ms.id} className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors p-6 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm text-white/80 mb-1">{ms.proposals.title}</div>
                <h3 className="text-lg font-semibold text-white/90 mb-2">{ms.title}</h3>
                <div className="flex items-center gap-6 text-sm text-white/60">
                  <span>Amount: {ms.amount} USDC</span>
                  <span>Deadline: {format(new Date(ms.deadline), 'MMM d, yyyy')}</span>
                  <StatusBadge status={ms.status} />
                </div>
              </div>
              <div>
                {ms.status === 'pending' && (
                  <button onClick={() => setSelectedMilestone(ms)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors border border-white/20">
                    Submit Report
                  </button>
                )}
                {ms.status === 'approved' && (
                  <button 
                    disabled={!!claimStatus[ms.id]}
                    onClick={() => claimFunds(ms)} 
                    className="px-4 py-2 bg-white text-black hover:bg-white/80 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50 text-xs font-semibold shrink-0"
                  >
                    {claimStatus[ms.id] === 'awaiting-signature' && 'Awaiting Sign...'}
                    {claimStatus[ms.id] === 'confirming-tx' && 'Confirming (0.01)...'}
                    {claimStatus[ms.id] === 'completing-claim' && 'Finalizing...'}
                    {!claimStatus[ms.id] && 'Claim Funds (0.01 USDC)'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMilestone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors p-6 rounded-2xl max-w-lg w-full">
            <h2 className="text-xl font-bold mb-2">Submit Progress Report</h2>
            <p className="text-sm text-white/60 mb-6">For: {selectedMilestone.title}</p>
            
            <textarea 
              rows={5} 
              value={reportContent} 
              onChange={e => setReportContent(e.target.value)} 
              placeholder="Detail your progress, include links to commits, docs, etc."
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 mb-6"
            />
            
            <div className="flex justify-end gap-3">
              <button disabled={loading} onClick={() => setSelectedMilestone(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm">Cancel</button>
              <button disabled={loading || !reportContent.trim()} onClick={submitReport} className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors text-sm disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
