import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { StatusBadge } from './Dashboard';

export function MilestoneTracker() {
  const { address } = useAccount();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [reportContent, setReportContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    loadMilestones();
  }, [address]);

  async function loadMilestones() {
    const { data: props } = await supabase.from('proposals').select('id').eq('author_wallet', address?.toLowerCase());
    if (props && props.length > 0) {
      const pids = props.map(p => p.id);
      const { data: ms } = await supabase
        .from('milestones')
        .select(`*, proposals(title)`)
        .in('proposal_id', pids)
        .order('deadline', { ascending: true });
      if (ms) setMilestones(ms);
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
      await supabase.from('milestones').update({ status: 'claimed' }).eq('id', ms.id);
      loadMilestones();
      alert(`Successfully simulated claim of ${ms.amount} USDC!`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!address) return <div className="text-center py-12">Please connect wallet.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">Milestone Tracker</h1>

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-dark-900 border border-dark-800 rounded-xl">
            No milestones found for your active proposals.
          </div>
        ) : (
          milestones.map(ms => (
            <div key={ms.id} className="bg-dark-900 border border-dark-800 p-6 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm text-primary-400 mb-1">{ms.proposals.title}</div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">{ms.title}</h3>
                <div className="flex items-center gap-6 text-sm text-slate-400">
                  <span>Amount: {ms.amount} USDC</span>
                  <span>Deadline: {format(new Date(ms.deadline), 'MMM d, yyyy')}</span>
                  <StatusBadge status={ms.status} />
                </div>
              </div>
              <div>
                {ms.status === 'pending' && (
                  <button onClick={() => setSelectedMilestone(ms)} className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm transition-colors border border-dark-700">
                    Submit Report
                  </button>
                )}
                {ms.status === 'approved' && (
                  <button onClick={() => claimFunds(ms)} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm transition-colors border border-primary-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                    Claim Funds
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMilestone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-dark-900 border border-dark-800 p-6 rounded-2xl max-w-lg w-full">
            <h2 className="text-xl font-bold mb-2">Submit Progress Report</h2>
            <p className="text-sm text-slate-400 mb-6">For: {selectedMilestone.title}</p>
            
            <textarea 
              rows={5} 
              value={reportContent} 
              onChange={e => setReportContent(e.target.value)} 
              placeholder="Detail your progress, include links to commits, docs, etc."
              className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 mb-6"
            />
            
            <div className="flex justify-end gap-3">
              <button disabled={loading} onClick={() => setSelectedMilestone(null)} className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors text-sm">Cancel</button>
              <button disabled={loading || !reportContent.trim()} onClick={submitReport} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
