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
    
    const userVote = votes.find(v => v.voter_wallet === address?.toLowerCase())?.vote_type;
    const token = localStorage.getItem('supabase_token');

    try {
      if (userVote) {
        if (userVote === type) {
          // Cancel vote
          const response = await fetch(`/api/proposals/${id}/vote`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Failed to cancel vote");
          }
          alert(`Your ${type} has been successfully canceled.`);
        } else {
          // Warning
          alert(`You have already cast an ${userVote === 'upvote' ? 'upvote' : 'downvote'} on this proposal. Please click the ${userVote === 'upvote' ? 'Thumbs Up' : 'Thumbs Down'} button first to cancel your vote before changing it.`);
          return;
        }
      } else {
        // Cast vote
        const response = await fetch(`/api/proposals/${id}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ vote_type: type })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to cast vote");
        }
      }
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

  if (!proposal) return <div className="p-12 text-center text-[#A3A3A3]">Loading...</div>;

  const upvotes = votes.filter(v => v.vote_type === 'upvote').length;
  const downvotes = votes.filter(v => v.vote_type === 'downvote').length;
  const userVote = votes.find(v => v.voter_wallet === address?.toLowerCase())?.vote_type;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors p-8 rounded-2xl">
        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold mb-3">{proposal.title}</h1>
            <div className="text-sm text-white/60 font-mono">By: {proposal.author_wallet}</div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
        
        <div className="mb-8">
          <h3 className="text-sm font-medium text-[#A3A3A3] mb-2">Description</h3>
          <p className="text-white/90 whitespace-pre-wrap">{proposal.description}</p>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <div className="text-sm">
            <span className="text-[#A3A3A3] mr-2">Requested:</span>
            <span className="text-2xl font-bold text-white/80">{proposal.requested_amount} USDC</span>
          </div>
          {proposal.document_url && (
            <a href={proposal.document_url} target="_blank" rel="noreferrer" className="text-white/80 hover:text-white text-sm">
              View Attached Document
            </a>
          )}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6">Milestones</h2>
        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
              <div className="mb-2 md:mb-0">
                <div className="text-xs text-white/80 mb-1">Milestone {i + 1}</div>
                <div className="font-semibold text-white/90">{m.title}</div>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/60">
                <span>{m.amount} USDC</span>
                <span>{format(new Date(m.deadline), 'MMM d, yyyy')}</span>
                <StatusBadge status={m.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold">Community Governance</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => castVote('upvote')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${userVote === 'upvote' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'}`}>
              <ThumbsUp className="w-4 h-4" /> {upvotes}
            </button>
            <button onClick={() => castVote('downvote')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${userVote === 'downvote' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'}`}>
              <ThumbsDown className="w-4 h-4" /> {downvotes}
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-bold flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
            <MessageSquare className="w-4 h-4 text-white/60" />
            Comments ({comments.length})
          </h3>
          
          <form onSubmit={submitComment} className="mb-8">
            <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Add a comment..." required rows={3} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 mb-3" />
            <div className="flex justify-end">
              <button disabled={!address} type="submit" className="px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50">Post Comment</button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="p-4 bg-black/20 border border-white/10 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-mono text-white/80">{c.author_wallet}</div>
                  <div className="text-xs text-[#A3A3A3]">{format(new Date(c.created_at), 'MMM d, yyyy h:mm a')}</div>
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
