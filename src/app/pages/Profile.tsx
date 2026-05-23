import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from './Dashboard';
import { Link } from 'react-router-dom';
import { Edit2, Github, Twitter, Send, UserCircle2, Upload } from 'lucide-react';

export function Profile() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'proposals' | 'votes'>('proposals');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    bio: '',
    avatar_url: '',
    twitter_url: '',
    telegram_url: '',
    github_url: ''
  });
  const [error, setError] = useState('');

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
        setForm({
          username: prof.username || '',
          bio: prof.bio || '',
          avatar_url: prof.avatar_url || '',
          twitter_url: prof.twitter_url || '',
          telegram_url: prof.telegram_url || '',
          github_url: prof.github_url || ''
        });
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

      // Load all votes by user
      const { data: userVotes } = await supabase
        .from('votes')
        .select('*, proposals(*)')
        .eq('voter_wallet', address?.toLowerCase())
        .order('created_at', { ascending: false });
        
      if (userVotes) setVotes(userVotes);
    }
    
    loadData();
  }, [address]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only alphanumeric, max 12 chars
    if (/^[a-zA-Z0-9]*$/.test(val) && val.length <= 12) {
      setForm(prev => ({ ...prev, username: val }));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !address) return;
    const file = e.target.files[0];
    setUploading(true);
    setError('');
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${address.toLowerCase()}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, avatar_url: publicUrlData.publicUrl }));
    } catch (err: any) {
      setError(err.message || 'Error uploading file. Are you sure you have configured Supabase credentials securely?');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: form.username,
          bio: form.bio,
          avatar_url: form.avatar_url,
          twitter_url: form.twitter_url,
          telegram_url: form.telegram_url,
          github_url: form.github_url,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', address?.toLowerCase());

      if (updateError) throw updateError;
      
      setProfile({ ...profile, ...form });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (!address) return <div className="text-center py-12">Please connect wallet.</div>;

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4"></div>
          
          <form onSubmit={saveProfile} className="relative z-10 space-y-6">
            <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-4">Edit Profile</h2>
            
            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">{error}</div>}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Username (Max 12 chars)</label>
                  <input 
                    type="text" 
                    value={form.username} 
                    onChange={handleUsernameChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Avatar Source</label>
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <button type="button" className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white text-sm transition-colors disabled:opacity-50">
                        {uploading ? 'Uploading...' : <><Upload className="w-4 h-4" /> Upload Custom Image</>}
                      </button>
                    </div>
                    <div className="text-center text-xs text-white/40">OR URL</div>
                    <input 
                      type="url" 
                      value={form.avatar_url} 
                      onChange={e => setForm({...form, avatar_url: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30 text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Bio</label>
                  <textarea 
                    rows={4}
                    value={form.bio} 
                    onChange={e => setForm({...form, bio: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">X (Twitter) URL</label>
                  <input 
                    type="url" 
                    value={form.twitter_url} 
                    onChange={e => setForm({...form, twitter_url: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                    placeholder="https://x.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Telegram URL</label>
                  <input 
                    type="url" 
                    value={form.telegram_url} 
                    onChange={e => setForm({...form, telegram_url: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                    placeholder="https://t.me/..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">GitHub URL</label>
                  <input 
                    type="url" 
                    value={form.github_url} 
                    onChange={e => setForm({...form, github_url: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-white/10 pt-6">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || uploading}
                className="px-6 py-2.5 bg-white text-black hover:bg-gray-200 rounded-full font-medium transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Split Sections: Profile and Claimed Funding */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Profile Details Block */}
        <div className="md:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-12 h-12 text-white/40" />
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-display font-bold mb-1">
                  {profile?.username ? `@${profile.username}` : 'Builder Profile'}
                </h1>
                <div className="text-white/60 font-mono text-xs md:text-sm mb-3 break-all">{address}</div>
                {profile?.bio && (
                  <p className="text-white/80 text-sm max-w-md leading-relaxed">{profile.bio}</p>
                )}
                
                {/* Social Links */}
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                  {profile?.twitter_url && (
                    <a href={profile.twitter_url} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profile?.telegram_url && (
                    <a href={profile.telegram_url} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">
                      <Send className="w-5 h-5" />
                    </a>
                  )}
                  {profile?.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center shrink-0 mt-4 md:mt-0 justify-center">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm font-medium transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>
        </div>

        {/* Claimed Funding Block */}
        <div className="md:col-span-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
          <div className="text-sm text-white/60 mb-4 tracking-wide uppercase font-semibold">Total Claimed Funding</div>
          <div className="text-5xl font-display font-medium text-white drop-shadow-md">
            {profile?.total_claimed || 0} <span className="text-2xl text-white/40">USDC</span>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 mb-6 flex gap-8">
        <button 
          onClick={() => setActiveTab('proposals')}
          className={`pb-3 text-lg font-bold transition-colors border-b-2 ${activeTab === 'proposals' ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          Proposal History
        </button>
        <button 
          onClick={() => setActiveTab('votes')}
          className={`pb-3 text-lg font-bold transition-colors border-b-2 ${activeTab === 'votes' ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          Voting History
        </button>
      </div>

      {activeTab === 'proposals' && (
        <>
          {proposals.length === 0 ? (
            <div className="text-center text-[#A3A3A3] py-12 border border-white/10 rounded-xl bg-white/5">
              No proposals submitted.
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map(p => (
                <Link to={`/app/proposals/${p.id}`} key={p.id} className="block bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 p-6 rounded-xl hover:border-white/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white/90 mb-1">{p.title}</h3>
                      <div className="text-sm text-white/60 max-w-2xl truncate">{p.description}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm text-[#A3A3A3] flex gap-6">
                    <span>Requested: {p.requested_amount} USDC</span>
                    <span>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'votes' && (
        <>
          {votes.length === 0 ? (
            <div className="text-center text-[#A3A3A3] py-12 border border-white/10 rounded-xl bg-white/5">
              No voting history found.
            </div>
          ) : (
            <div className="space-y-4">
              {votes.map(v => (
                <Link to={`/app/proposals/${v.proposal_id}`} key={v.id} className="block bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 p-6 rounded-xl hover:border-white/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white/90 truncate mr-4">
                      {v.proposals?.title || 'Unknown Proposal'}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${v.vote_type === 'upvote' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {v.vote_type}
                    </div>
                  </div>
                  <div className="text-sm text-[#A3A3A3]">
                    Voted on: {new Date(v.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

