import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

export function SubmitProposal() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    requestedAmount: '',
    documentUrl: ''
  });
  const [milestones, setMilestones] = useState([{ title: '', amount: '', deadline: '' }]);

  if (!address) return <div className="text-center py-12">Please connect wallet to submit a proposal.</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const { data: proposal, error: propErr } = await supabase.from('proposals').insert({
        title: form.title,
        description: form.description,
        requested_amount: Number(form.requestedAmount),
        document_url: form.documentUrl,
        author_wallet: address.toLowerCase(),
        status: 'pending'
      }).select().single();

      if (propErr) throw propErr;

      const msData = milestones.map(m => ({
        proposal_id: proposal.id,
        title: m.title,
        amount: Number(m.amount),
        deadline: new Date(m.deadline).toISOString(),
        status: 'pending'
      }));

      const { error: msErr } = await supabase.from('milestones').insert(msData);
      if (msErr) throw msErr;

      navigate('/app');
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">Submit Proposal</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-dark-900 border border-dark-800 p-8 rounded-2xl">
        <div className="space-y-4">
          <h2 className="text-xl font-bold border-b border-dark-800 pb-2">Project Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Proposal Title</label>
            <input required type="text" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea required rows={5} value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Total Requested Amount (USDC)</label>
              <input required type="number" value={form.requestedAmount} onChange={e=>setForm({...form, requestedAmount: e.target.value})} className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Supporting Document URL</label>
              <input type="url" value={form.documentUrl} onChange={e=>setForm({...form, documentUrl: e.target.value})} className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500" placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-dark-800 pb-2">
            <h2 className="text-xl font-bold">Milestones</h2>
            <button type="button" onClick={() => setMilestones([...milestones, {title:'', amount:'', deadline:''}])} className="text-sm text-primary-400 flex items-center gap-1 hover:text-primary-300">
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          </div>
          
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-4 items-end bg-dark-950 p-4 rounded-lg border border-dark-800">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Milestone Title</label>
                <input required type="text" value={m.title} onChange={e=>{
                  const newMs = [...milestones]; newMs[i].title = e.target.value; setMilestones(newMs);
                }} className="w-full bg-dark-900 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-slate-400 mb-1">Amount</label>
                <input required type="number" value={m.amount} onChange={e=>{
                  const newMs = [...milestones]; newMs[i].amount = e.target.value; setMilestones(newMs);
                }} className="w-full bg-dark-900 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500" />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-slate-400 mb-1">Deadline</label>
                <input required type="date" value={m.deadline} onChange={e=>{
                  const newMs = [...milestones]; newMs[i].deadline = e.target.value; setMilestones(newMs);
                }} className="w-full bg-dark-900 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 [color-scheme:dark]" />
              </div>
              {milestones.length > 1 && (
                <button type="button" onClick={() => setMilestones(milestones.filter((_, idx)=>idx!==i))} className="pb-2 text-slate-500 hover:text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Proposal'}
        </button>
      </form>
    </div>
  );
}
