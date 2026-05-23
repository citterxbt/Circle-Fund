import React, { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';

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

const proposalSchema = z.object({
  title: z.string().min(1, 'Project name is required').max(80, 'Max 80 characters'),
  one_line_summary: z.string().min(1, 'Summary is required').max(140, 'Max 140 characters'),
  category: z.string().min(1, 'Category is required'),
  project_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  github_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  
  description: z.string().min(10, 'Required (minimum 10 characters)').max(10000),
  problem_statement: z.string().min(1, 'Problem statement is required'),
  proposed_solution: z.string().min(1, 'Proposed solution is required'),
  technical_architecture: z.string().optional(),
  
  team_members: z.array(
    z.object({
      name: z.string().min(1, 'Required'),
      role: z.string().min(1, 'Required'),
      wallet_address: z.string().optional(),
      linkedin_twitter: z.string().optional(),
      experience: z.string().min(1, 'Required'),
    })
  ).min(2, 'Minimum 2 team members required'),
  
  previous_work: z.string().optional(),
  relevant_experience: z.string().min(1, 'Relevant experience is required'),
  
  milestones: z.array(
    z.object({
      title: z.string().min(1, 'Required'),
      description: z.string().min(1, 'Required'),
      metrics: z.string().min(1, 'Required'),
      amount: z.coerce.number().min(1, 'Required'),
      deadline: z.string().min(1, 'Required'),
    })
  ).min(1, 'At least 1 milestone required'),
  
  requested_amount: z.coerce.number().min(1, 'Required'),
  budget_breakdown: z.string().min(1, 'Required'),
  budget_justification: z.string().min(1, 'Required'),
  
  timeline: z.string().min(1, 'Required'),
  risk_mitigation: z.string().min(1, 'Required'),
  
  expected_impact: z.string().min(1, 'Required'),
  success_metrics: z.array(
    z.object({
      metric: z.string().min(1, 'Required'),
      target: z.string().min(1, 'Required'),
    })
  ).min(1, 'Required'),
  long_term_vision: z.string().optional(),
  
  agree_truth: z.boolean().refine(v => v === true, 'You must agree to proceed'),
  agree_terms: z.boolean().refine(v => v === true, 'You must agree to proceed'),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

const steps = [
  {
    id: 'Step 1',
    name: 'General Information',
    description: 'Basic details about your project and where to find it.',
    fields: ['title', 'one_line_summary', 'category', 'project_url', 'twitter_url', 'github_url'] as const
  },
  {
    id: 'Step 2',
    name: 'Description & Value Prop',
    description: 'Explain what you are building, the problem it solves, and why it matters.',
    fields: ['description', 'problem_statement', 'proposed_solution', 'technical_architecture'] as const
  },
  {
    id: 'Step 3',
    name: 'Team & Credibility',
    description: 'Introduce the builders behind the project and their prior experience (min. 2 required).',
    fields: ['team_members', 'previous_work', 'relevant_experience'] as const
  },
  {
    id: 'Step 4',
    name: 'Milestones',
    description: 'Break down your project development into precise, measurable milestones.',
    fields: ['milestones'] as const
  },
  {
    id: 'Step 5',
    name: 'Budget',
    description: 'Specify the total funding you need and how it will be proportionally allocated.',
    fields: ['requested_amount', 'budget_breakdown', 'budget_justification'] as const
  },
  {
    id: 'Step 6',
    name: 'Timeline & Roadmap',
    description: 'Provide an estimated timeline mapping and how you plan to mitigate risks.',
    fields: ['timeline', 'risk_mitigation'] as const
  },
  {
    id: 'Step 7',
    name: 'Impact & Measurement',
    description: 'Define your success metrics and the long-term vision of this project.',
    fields: ['expected_impact', 'success_metrics', 'long_term_vision'] as const
  },
  {
    id: 'Step 8',
    name: 'Declaration',
    description: 'Final review and agreement to terms & conditions.',
    fields: ['agree_truth', 'agree_terms'] as const
  }
];

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={`flex h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:opacity-50 transition-colors ${className || ''}`} {...props} />
));

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={`flex min-h-[100px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:opacity-50 transition-colors ${className || ''}`} {...props} />
));

const Label = ({ children, required, subtitle }: { children: React.ReactNode, required?: boolean, subtitle?: string }) => (
  <div className="mb-2">
    <label className="block text-sm font-semibold tracking-wide text-white/80">
      {children} {required && <span className="text-emerald-400">*</span>}
    </label>
    {subtitle && <p className="text-xs text-white/40 mt-1">{subtitle}</p>}
  </div>
);

const ErrorMsg = ({ msg }: { msg?: string }) => msg ? <p className="text-rose-400 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{msg}</p> : null;

export function SubmitProposal() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      team_members: [
        {name:'', role:'', wallet_address:'', linkedin_twitter:'', experience:''},
        {name:'', role:'', wallet_address:'', linkedin_twitter:'', experience:''}
      ],
      milestones: [{title:'', description:'', metrics:'', amount:0, deadline:''}],
      success_metrics: [{metric:'', target:''}],
      category: 'Infrastructure',
    }
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({ control, name: "team_members" });
  const { fields: msFields, append: appendMs, remove: removeMs } = useFieldArray({ control, name: "milestones" });
  const { fields: metricFields, append: appendMetric, remove: removeMetric } = useFieldArray({ control, name: "success_metrics" });

  if (!address) return <div className="text-center py-12 text-white/60">Please connect your wallet to submit a proposal.</div>;

  const next = async () => {
    setGlobalError('');
    const fields = steps[currentStep].fields;
    const isStepValid = await trigger(fields as any, { shouldFocus: true });

    if (isStepValid) {
      setCompletedSteps(prev => Array.from(new Set([...prev, currentStep])));
      if (currentStep < steps.length - 1) {
        setCurrentStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setGlobalError('Please fix the errors in the current section before proceeding.');
    }
  };

  const prev = () => {
    setGlobalError('');
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToStep = async (stepIndex: number) => {
    if (stepIndex === currentStep) return;
    
    // Only allow navigation to completed steps or exactly one step forward if current is valid
    if (stepIndex < currentStep || completedSteps.includes(stepIndex) || (stepIndex === currentStep + 1 && await trigger(steps[currentStep].fields as any))) {
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: ProposalFormValues) => {
    try {
      setLoading(true);
      setGlobalError('');
      
      if (!address) {
        setGlobalError('Please connect your wallet first.');
        setLoading(false);
        return;
      }

      setSubmitStatus('awaiting-signature');
      console.log("[useWriteContract] Sending 0.01 USDC proposal submission fee to admin:", ADMIN_WALLET);
      
      const hash = await writeContractAsync({
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [ADMIN_WALLET, 10000n], // 0.01 USDC (6 decimals)
      } as any);

      setSubmitStatus('confirming-tx');
      if (publicClient) {
        console.log("[usePublicClient] Waiting for transaction receipt...", hash);
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

      setSubmitStatus('saving-proposal');

      const { data: proposal, error: propErr } = await supabase.from('proposals').insert({
        title: data.title,
        one_line_summary: data.one_line_summary,
        category: data.category,
        project_url: data.project_url || null,
        twitter_url: data.twitter_url || null,
        github_url: data.github_url || null,
        description: data.description,
        problem_statement: data.problem_statement,
        proposed_solution: data.proposed_solution,
        technical_architecture: data.technical_architecture || null,
        team_members: data.team_members,
        previous_work: data.previous_work || null,
        relevant_experience: data.relevant_experience,
        requested_amount: data.requested_amount,
        budget_breakdown: data.budget_breakdown,
        budget_justification: data.budget_justification,
        timeline: data.timeline,
        risk_mitigation: data.risk_mitigation,
        expected_impact: data.expected_impact,
        success_metrics: data.success_metrics,
        long_term_vision: data.long_term_vision || null,
        agree_to_terms: data.agree_terms,
        author_wallet: address.toLowerCase(),
        status: 'pending'
      }).select().single();

      if (propErr) throw propErr;

      const msData = data.milestones.map(m => ({
        proposal_id: proposal.id,
        title: m.title,
        description: m.description,
        metrics: m.metrics,
        amount: m.amount,
        deadline: new Date(m.deadline).toISOString(),
        status: 'pending'
      }));

      const { error: msErr } = await supabase.from('milestones').insert(msData);
      if (msErr) throw msErr;

      navigate('/app/proposals');
    } catch (err: any) {
      console.error("Error submitting proposal:", err);
      if (err.message?.includes('rejected') || err.message?.includes('User denied')) {
        setGlobalError('On-chain fee transaction signature rejected by user.');
      } else {
        setGlobalError(err.message || 'Failed to complete 0.01 USDC transaction fee. Ensure your wallet has sufficient USDC ARC and native ARC for gas.');
      }
    } finally {
      setLoading(false);
      setSubmitStatus('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-10 text-center relative z-20">
        <h1 className="text-4xl font-display font-bold mb-4 text-white drop-shadow-md tracking-tight">Submit Proposal</h1>
        <p className="text-white/60 max-w-2xl mx-auto leading-relaxed">
          Follow the steps below to submit your project for funding. Please ensure all details are as accurate and comprehensive as possible. Your submission will be reviewed by the community.
        </p>
      </div>
      
      {globalError && (
        <div className="max-w-4xl mx-auto p-4 mb-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-3 relative z-20 shadow-lg shadow-rose-500/5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{globalError}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start relative z-20">
        {/* Sidebar Steps Indicator */}
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-32 space-y-3">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = completedSteps.includes(idx);
            
            return (
              <div 
                key={step.id} 
                onClick={() => navigateToStep(idx)}
                className={`p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? 'bg-white/10 border-white/30 shadow-lg scale-100 ring-1 ring-white/10' 
                    : isCompleted || idx < currentStep
                      ? 'bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 hover:border-white/20' 
                      : 'bg-transparent border-transparent opacity-40 grayscale pointer-events-none'
                } border`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>}
                
                <div className="flex items-center justify-between mb-1 relative z-10">
                  <div className={`text-[10px] font-bold font-mono tracking-widest uppercase ${isActive ? 'text-emerald-400' : 'text-white/50'}`}>
                    {step.id}
                  </div>
                  {isCompleted && !isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <div className={`text-sm font-bold tracking-wide relative z-10 ${isActive ? 'text-white' : 'text-white/80'}`}>
                  {step.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Step Form Box */}
        <div className="flex-1 w-full bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl min-h-[600px] flex flex-col relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           
           <div className="relative z-10 mb-8 pb-6 border-b border-white/10">
             <h2 className="text-2xl font-bold mb-2 text-white">{steps[currentStep].name}</h2>
             <p className="text-white/60 text-sm leading-relaxed">{steps[currentStep].description}</p>
           </div>
           
           <div className="relative z-10 flex-1">
             {/* Not using native form sumbit on the container to avoid accidental enters, we handle it on the button */}
             <div className="h-full flex flex-col">
               <div className="flex-1">
                 <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="space-y-8"
                    >
                      {currentStep === 0 && (
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <Label required subtitle="Must be clear and concise. Max 80 characters.">Project Name</Label>
                            <Input {...register('title')} placeholder="e.g. Circle DEX Protocol" />
                            <ErrorMsg msg={errors.title?.message} />
                          </div>
                          <div className="md:col-span-2">
                            <Label required subtitle="A single sentence explaining exactly what you are building.">One-Line Summary</Label>
                            <Input {...register('one_line_summary')} placeholder="A decentralized exchange offering zero-slippage trades using shared liquidity pools." />
                            <ErrorMsg msg={errors.one_line_summary?.message} />
                          </div>
                          <div>
                            <Label required>Project Category</Label>
                            <select {...register('category')} className="flex h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30">
                              {['Infrastructure', 'DeFi', 'Gaming', 'SocialFi', 'Tooling', 'Education', 'Research', 'Other'].map(c => (
                                <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>
                              ))}
                            </select>
                            <ErrorMsg msg={errors.category?.message} />
                          </div>
                          <div>
                            <Label>Project Website / URL</Label>
                            <Input {...register('project_url')} placeholder="https://" />
                            <ErrorMsg msg={errors.project_url?.message} />
                          </div>
                          <div>
                            <Label>Twitter / X URL</Label>
                            <Input {...register('twitter_url')} placeholder="https://x.com/..." />
                            <ErrorMsg msg={errors.twitter_url?.message} />
                          </div>
                          <div>
                            <Label>GitHub Repository</Label>
                            <Input {...register('github_url')} placeholder="https://github.com/..." />
                            <ErrorMsg msg={errors.github_url?.message} />
                          </div>
                        </div>
                      )}

                      {currentStep === 1 && (
                        <div className="space-y-6">
                          <div>
                            <Label required subtitle="Provide a deep dive into the project. Use Markdown to structure your overview (headers, bullet points, etc). Minimum 500 words recommended.">Detailed Description</Label>
                            <Textarea {...register('description')} rows={8} placeholder="## Overview&#10;We are building...&#10;&#10;## Core Features&#10;- Feature 1..." />
                            <ErrorMsg msg={errors.description?.message} />
                          </div>
                          <div>
                            <Label required subtitle="What specific friction point or missing infrastructure are you addressing?">Problem Statement</Label>
                            <Textarea {...register('problem_statement')} rows={4} placeholder="Currently in the ecosystem, users face X when trying to do Y..." />
                            <ErrorMsg msg={errors.problem_statement?.message} />
                          </div>
                          <div>
                            <Label required subtitle="How does your project uniquely solve this problem over existing alternatives?">Proposed Solution</Label>
                            <Textarea {...register('proposed_solution')} rows={4} placeholder="We solve this by implementing Z which allows..." />
                            <ErrorMsg msg={errors.proposed_solution?.message} />
                          </div>
                          <div>
                            <Label subtitle="Optional. Provide a high-level overview of smart contracts, backend, and frontend logic.">Technical Architecture</Label>
                            <Textarea {...register('technical_architecture')} rows={4} placeholder="Built on React, Supabase, utilizing Solidity contracts deployed to..." />
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-8">
                          <div>
                            <Label required subtitle="Introduce the core contributors (Minimum 2 required for grant accountability).">Team Members</Label>
                            <ErrorMsg msg={errors.team_members?.message} />
                            <div className="space-y-4 mt-3">
                              {teamFields.map((field, index) => (
                                <div key={field.id} className="p-6 bg-black/20 border border-white/10 rounded-xl relative hover:border-white/30 transition-colors">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-white/90">Team Member {index + 1}</h4>
                                    {teamFields.length > 2 && (
                                      <button type="button" onClick={() => removeTeam(index)} className="text-white/40 hover:text-rose-400 transition-colors tooltip flex items-center p-2 rounded hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                  </div>
                                  <div className="grid md:grid-cols-2 gap-5">
                                    <div><Label required>Name / Pseudonym</Label><Input {...register(`team_members.${index}.name` as const)} placeholder="Alice Builder" /><ErrorMsg msg={errors.team_members?.[index]?.name?.message} /></div>
                                    <div><Label required>Role</Label><Input {...register(`team_members.${index}.role` as const)} placeholder="Lead Dev, Marketing, etc" /><ErrorMsg msg={errors.team_members?.[index]?.role?.message} /></div>
                                    <div><Label subtitle="Main web3 address">Wallet Address</Label><Input {...register(`team_members.${index}.wallet_address` as const)} placeholder="0x..." /></div>
                                    <div><Label subtitle="Or X/Twitter Profile">LinkedIn URL</Label><Input {...register(`team_members.${index}.linkedin_twitter` as const)} placeholder="https://..." /></div>
                                    <div className="md:col-span-2"><Label required subtitle="Highlight specific achievements relevant to this role.">Brief Experience</Label><Input {...register(`team_members.${index}.experience` as const)} placeholder="5+ yrs TS/Node, previously core dev at Protocol X..." /><ErrorMsg msg={errors.team_members?.[index]?.experience?.message} /></div>
                                  </div>
                                </div>
                              ))}
                              <button type="button" onClick={() => appendTeam({name:'', role:'', wallet_address:'', linkedin_twitter:'', experience:''})} className="inline-flex items-center gap-2 px-5 py-3 mt-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors">
                                <Plus className="w-4 h-4" /> Add Next Team Member
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label subtitle="Link out to repos, notion pages, live apps, or previous grant deliveries.">Previous Work / Portfolio</Label>
                            <Textarea {...register('previous_work')} rows={3} placeholder="1. Project X (https://...)&#10;2. Open source contribution Y (https://...)" />
                          </div>
                          <div>
                            <Label required subtitle="Why is your team specifically equipped to deliver this scope of work effectively?">Relevant Team Experience</Label>
                            <Textarea {...register('relevant_experience')} rows={3} placeholder="The team has worked together for 2 years on DeFi tooling and previously delivered..." />
                            <ErrorMsg msg={errors.relevant_experience?.message} />
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="space-y-6">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-emerald-200/80 leading-relaxed">
                              <strong className="text-emerald-400 font-semibold block mb-1">Critical Requirement</strong> 
                              Funds are disbursed based on milestone completion. Every milestone must represent a tangible deliverable that reviewers can verify objectively.
                            </div>
                          </div>
                          <ErrorMsg msg={errors.milestones?.message} />
                          <div className="space-y-6">
                            {msFields.map((field, index) => (
                              <div key={field.id} className="p-6 bg-black/20 border border-white/10 rounded-xl relative hover:border-emerald-500/30 transition-colors group">
                                <div className="absolute top-0 left-0 w-1 bottom-0 bg-white/10 rounded-l-xl group-hover:bg-emerald-500/50 transition-colors"></div>
                                <div className="flex justify-between items-center mb-5 pl-2">
                                  <h3 className="font-bold text-lg text-white">Milestone {index + 1}</h3>
                                  {msFields.length > 1 && (
                                    <button type="button" onClick={() => removeMs(index)} className="text-white/40 hover:text-rose-400 transition-colors p-2 rounded hover:bg-rose-500/10"><Trash2 className="w-5 h-5" /></button>
                                  )}
                                </div>
                                <div className="grid md:grid-cols-2 gap-5 pl-2">
                                  <div className="md:col-span-2"><Label required>Milestone Title</Label><Input {...register(`milestones.${index}.title` as const)} placeholder="E.g., V1 Smart Contracts Deployed to Testnet" />
                                  <ErrorMsg msg={errors.milestones?.[index]?.title?.message} /></div>
                                  <div className="md:col-span-2"><Label required subtitle="List exactly what will be completed. Be specific.">Description of Deliverables</Label><Textarea {...register(`milestones.${index}.description` as const)} rows={3} placeholder="- Core liquidity contract (repo link expected)&#10;- Initial frontend landing page..." />
                                  <ErrorMsg msg={errors.milestones?.[index]?.description?.message} /></div>
                                  <div className="md:col-span-2"><Label required subtitle="How will reviewers objectively know this is complete?">Success Metrics / Verification</Label><Textarea {...register(`milestones.${index}.metrics` as const)} rows={2} placeholder="Contracts must be verified on block explorer, and frontend deployed live at Vercel URL." />
                                  <ErrorMsg msg={errors.milestones?.[index]?.metrics?.message} /></div>
                                  <div><Label required subtitle="Estimated completion target.">Target Deadline</Label><Input type="date" {...register(`milestones.${index}.deadline` as const)} className="[color-scheme:dark]" />
                                  <ErrorMsg msg={errors.milestones?.[index]?.deadline?.message} /></div>
                                  <div><Label required subtitle="Keep proportional to work.">Requested Funding (USDC)</Label><Input type="number" {...register(`milestones.${index}.amount` as const)} placeholder="1000" />
                                  <ErrorMsg msg={errors.milestones?.[index]?.amount?.message} /></div>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => appendMs({title:'', description:'', metrics:'', amount:0, deadline:''})} className="inline-flex items-center w-full justify-center py-5 border-2 border-dashed border-white/10 hover:border-emerald-500/30 rounded-xl font-medium gap-2 text-white/60 hover:text-white hover:bg-emerald-500/5 transition-all">
                              <Plus className="w-5 h-5" /> Add Next Milestone
                            </button>
                          </div>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="grid gap-8">
                          <div>
                            <Label required subtitle="Must match the sum of all your milestones.">Total Requested Grant (USDC)</Label>
                            <Input type="number" {...register('requested_amount')} placeholder="e.g. 50000" className="text-2xl font-bold h-14" />
                            <ErrorMsg msg={errors.requested_amount?.message} />
                          </div>
                          <div>
                            <Label required subtitle="How are you spending the grant? List out specific categories.">Detailed Budget Breakdown</Label>
                            <Textarea {...register('budget_breakdown')} rows={6} placeholder="- Smart Contract Engineering (2 devs x 3 months): $20,000&#10;- External Security Audit: $15,000&#10;- Marketing/Community growth: $5,000..." />
                            <ErrorMsg msg={errors.budget_breakdown?.message} />
                          </div>
                          <div>
                            <Label required subtitle="Defend why this amount is appropriate for the scale of your project.">Justification of Budget</Label>
                            <Textarea {...register('budget_justification')} rows={5} placeholder="Average market rate for Solidity devs is $X, the project will require complex custom Math libraries necessitating a reputable $15k audit..." />
                            <ErrorMsg msg={errors.budget_justification?.message} />
                          </div>
                        </div>
                      )}

                      {currentStep === 5 && (
                        <div className="grid gap-8">
                          <div>
                            <Label required subtitle="Provide a realistic mapping of the project's macro life-cycle.">Overall Project Timeline & Roadmap</Label>
                            <Textarea {...register('timeline')} rows={7} placeholder="Month 1: Design & architecture finalized...&#10;Month 2: MVP Development...&#10;Month 3: Security Audits & Testnet..." />
                            <ErrorMsg msg={errors.timeline?.message} />
                          </div>
                          <div>
                            <Label required subtitle="Reflect on potential failures. Technical risks, market fit risks, regulatory, etc.">Key Risks & Mitigation Plan</Label>
                            <Textarea {...register('risk_mitigation')} rows={6} placeholder="Risk: Competitor launches similar AMM standard. Mitigation: Focused UI/UX differentiation and early community incentive program. Risk 2: Smart contract bugs..." />
                            <ErrorMsg msg={errors.risk_mitigation?.message} />
                          </div>
                        </div>
                      )}

                      {currentStep === 6 && (
                        <div className="grid gap-8">
                          <div>
                            <Label required subtitle="How will this natively benefit the underlying ecosystem and its users?">Expected Impact</Label>
                            <Textarea {...register('expected_impact')} rows={4} placeholder="We project this will increase network TVL by attracting traditional retail traders through a simplified UI." />
                            <ErrorMsg msg={errors.expected_impact?.message} />
                          </div>
                          <div>
                            <Label required subtitle="Establish rigorous quantitative targets post-launch.">Success Metrics & KPIs</Label>
                            <div className="space-y-4 mt-3">
                              {metricFields.map((field, index) => (
                                <div key={field.id} className="flex gap-4 items-start p-4 bg-black/20 rounded-xl border border-white/10">
                                  <div className="flex-1">
                                    <Label>Metric Name</Label>
                                    <Input placeholder="e.g. Daily Active Users, TVL" {...register(`success_metrics.${index}.metric` as const)} />
                                    <ErrorMsg msg={errors.success_metrics?.[index]?.metric?.message} />
                                  </div>
                                  <div className="flex-1">
                                    <Label>Target Value</Label>
                                    <Input placeholder="e.g. 10,000, $1M" {...register(`success_metrics.${index}.target` as const)} />
                                    <ErrorMsg msg={errors.success_metrics?.[index]?.target?.message} />
                                  </div>
                                  {metricFields.length > 1 && (
                                    <button type="button" onClick={() => removeMetric(index)} className="p-3 mt-7 text-white/40 hover:text-rose-400 bg-white/5 rounded-xl border border-white/10 hover:border-rose-500/30 transition-colors">
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <ErrorMsg msg={errors.success_metrics?.message} />
                              <button type="button" onClick={() => appendMetric({metric:'', target:''})} className="inline-flex items-center gap-2 px-5 py-2.5 mt-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors">
                                <Plus className="w-4 h-4" /> Add Metric
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label subtitle="Briefly detail what happens to this product 6-12 months post-grant completion.">Long-term Vision</Label>
                            <Textarea {...register('long_term_vision')} rows={4} placeholder="After completing this grant, we intend to raise seed funding and expand this protocol cross-chain..." />
                          </div>
                        </div>
                      )}

                      {currentStep === 7 && (
                        <div className="space-y-8">
                          <div className="p-8 bg-black/30 border border-white/10 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500/50 to-emerald-500/20"></div>
                            <h3 className="font-bold text-xl mb-6">Code of Conduct & Final Agreement</h3>
                            
                            <div className="space-y-6">
                              <label className="flex items-start gap-4 cursor-pointer group">
                                <input type="checkbox" {...register('agree_truth')} className="mt-1 flex-shrink-0 w-5 h-5 rounded border-white/30 bg-black/50 focus:ring-2 focus:ring-emerald-500 text-emerald-500 cursor-pointer transition-all" />
                                <div>
                                  <span className="text-base font-semibold text-white/90 group-hover:text-white transition-colors block mb-1">Information Accuracy</span>
                                  <span className="text-sm text-white/60 leading-relaxed block">I declare under penalty of perjury that all information provided in this comprehensive proposal is true, accurate, and completely verifiable. Intentionally misleading reviewers will result in immediate disqualification and a ban from future grants.</span>
                                  <ErrorMsg msg={errors.agree_truth?.message} />
                                </div>
                              </label>
                              
                              <div className="h-px bg-white/10 w-full"></div>

                              <label className="flex items-start gap-4 cursor-pointer group">
                                <input type="checkbox" {...register('agree_terms')} className="mt-1 flex-shrink-0 w-5 h-5 rounded border-white/30 bg-black/50 focus:ring-2 focus:ring-emerald-500 text-emerald-500 cursor-pointer transition-all" />
                                <div>
                                  <span className="text-base font-semibold text-white/90 group-hover:text-white transition-colors block mb-1">Terms & Conditions binding</span>
                                  <span className="text-sm text-white/60 leading-relaxed block">I have read, understood, and agree to abide by the official Circle Fund Terms & Conditions, Grant Agreements, Code of Conduct, and the rigid Milestone verification procedures.</span>
                                  <ErrorMsg msg={errors.agree_terms?.message} />
                                </div>
                              </label>
                            </div>
                          </div>

                          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between shadow-inner shadow-emerald-500/5">
                            <div>
                              <span className="text-emerald-400 text-xs font-bold block mb-1.5 uppercase tracking-widest">Authenticated Wallet Signature Required</span>
                              <span className="font-mono text-white text-sm bg-black/30 px-3 py-1.5 rounded-lg border border-emerald-500/20">{address}</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex flex-col items-center justify-center border border-emerald-500/30">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                 </AnimatePresence>
               </div>
               
               <div className="flex justify-between items-center mt-12 pt-6 border-t border-white/10">
                 {/* Back button */}
                 <button type="button" onClick={prev} className={`flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}>
                   <ArrowLeft className="w-4 h-4" /> Go Back
                 </button>
                 
                 {/* Next or Submit Button */}
                 {currentStep < steps.length - 1 ? (
                   <button type="button" onClick={next} className="flex items-center gap-2 px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-white/20 active:scale-95">
                      Save & Continue <ArrowRight className="w-4 h-4" />
                   </button>
                 ) : (
                   <button type="button" onClick={handleSubmit(onSubmit as any)} disabled={loading} className="flex items-center gap-2 px-10 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:pointer-events-none">
                      {loading ? (
                         <span>
                           {submitStatus === 'awaiting-signature' && 'Awaiting wallet signature...'}
                           {submitStatus === 'confirming-tx' && 'Confirming fee (0.01 USDC)...'}
                           {submitStatus === 'saving-proposal' && 'Saving proposal...'}
                           {!submitStatus && 'Processing...'}
                         </span>
                       ) : 'Sign & Submit Proposal'}
                   </button>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
