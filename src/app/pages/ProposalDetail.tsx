import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from './Dashboard';
import { format } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

export function ProposalDetail() {
  const { id } = useParams();
  const { address } = useAccount();
  const [proposal, setProposal] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    if (!id) return;
    const [{data:p}, {data:m}, {data:c}, {data:v}] = await Promise.all([
      supabase.from('proposals').select('*').eq('id', id).single(),
      supabase.from('milestones').select('*').eq('proposal_id', id).order('deadline', {ascending: true}),
      supabase.from('comments').select('*').eq('proposal_id', id).order('created_at', {ascending: false}),
      supabase.from('votes').select('*').eq('proposal_id', id)
    ]);
    if (p) setProposal(p);
    if (m) setMilestones(m);
    if (c) setComments(c);
    if (v) setVotes(v);
  }

  const castVote = async (type: 'upvote' | 'downvote') => {
    if (!address) return alert("Connect wallet to vote");
    try {
      await supabase.from('votes').upsert(
        { proposal_id: id, voter_wallet: address.toLowerCase(), vote_type: type },
        { onConflict: 'proposal_id,voter_wallet' }
      );
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert("Connect wallet to comment");
    try {
      await supabase.from('comments').insert({
        proposal_id: id, author_wallet: address.toLowerCase(), content: newComment
      });
      setNewComment('');
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!proposal) return <div className="p-12 text-center text-slate-500">Loading...</div>;

  const upvotes = votes.filter(v => v.vote_type === 'upvote').length;
  const downvotes = votes.filter(v => v.vote_type === 'downvote').length;
  const userVote = votes.find(v => v.voter_wallet === address?.toLowerCase())?.vote_type;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-dark-900 border border-dark-800 p-8 rounded-2xl">
        <div className="flex justify-between items-start mb-6 border-b border-dark-800 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold mb-3">{proposal.title}</h1>
            <div className="text-sm text-slate-400 font-mono">By: {proposal.author_wallet}</div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
        
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
          <p className="text-slate-200 whitespace-pre-wrap">{proposal.description}</p>
        </div>

        <div className="flex items-center justify-between border-t border-dark-800 pt-6">
          <div className="text-sm">
            <span className="text-slate-500 mr-2">Requested:</span>
            <span className="text-2xl font-bold text-primary-400">{proposal.requested_amount} USDC</span>
          </div>
          {proposal.document_url && (
            <a href={proposal.document_url} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300 text-sm">
              View Attached Document
            </a>
          )}
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6">Milestones</h2>
        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-dark-950 border border-dark-800 rounded-lg">
              <div className="mb-2 md:mb-0">
                <div className="text-xs text-primary-400 mb-1">Milestone {i + 1}</div>
                <div className="font-semibold text-slate-200">{m.title}</div>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <span>{m.amount} USDC</span>
                <span>{format(new Date(m.deadline), 'MMM d, yyyy')}</span>
                <StatusBadge status={m.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-8 border-b border-dark-800 pb-4">
          <h2 className="text-xl font-bold">Community Governance</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => castVote('upvote')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${userVote === 'upvote' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-dark-800 border-dark-700 text-slate-400 hover:bg-dark-700'}`}>
              <ThumbsUp className="w-4 h-4" /> {upvotes}
            </button>
            <button onClick={() => castVote('downvote')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${userVote === 'downvote' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-dark-800 border-dark-700 text-slate-400 hover:bg-dark-700'}`}>
              <ThumbsDown className="w-4 h-4" /> {downvotes}
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-bold flex items-center gap-2 mb-4 border-b border-dark-800 pb-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            Comments ({comments.length})
          </h3>
          
          <form onSubmit={submitComment} className="mb-8">
            <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Add a comment..." required rows={3} className="w-full bg-dark-950 border border-dark-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 mb-3" />
            <div className="flex justify-end">
              <button disabled={!address} type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50">Post Comment</button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="p-4 bg-dark-950 border border-dark-800 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-mono text-primary-400">{c.author_wallet}</div>
                  <div className="text-xs text-slate-500">{format(new Date(c.created_at), 'MMM d, yyyy h:mm a')}</div>
                </div>
                <div className="text-sm text-slate-300">{c.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
