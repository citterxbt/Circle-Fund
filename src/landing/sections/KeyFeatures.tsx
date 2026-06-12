import React from 'react';
import { motion } from 'motion/react';
import { Activity, Target, MessageSquare } from 'lucide-react';

export function KeyFeatures() {
  return (
    <section id="features" className="py-32 px-[4vw] bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-[2.5rem] md:text-[4rem] font-bold tracking-tight mb-20 text-center text-white leading-[1.1]">
          Core Intelligence
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Target className="text-white/80 w-6 h-6" />}
            title="Milestone Tracker"
            desc="Granular tracking of deliverables ensuring funds are only released when value is created"
          />
          <FeatureCard 
            icon={<Activity className="text-white/80 w-6 h-6" />}
            title="Builder Dashboard"
            desc="Manage active proposals, upcoming deadlines, and claimable funds from a single command center"
          />
          <FeatureCard 
            icon={<MessageSquare className="text-white/80 w-6 h-6" />}
            title="On-Chain Governance"
            desc="Community members can upvote, downvote, and discuss proposals directly using their wallet"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="group p-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl hover:bg-white/10 transition-colors relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-[14px] flex items-center justify-center mb-8 relative z-10 transition-colors group-hover:bg-white/10">
        {icon}
      </div>
      <h3 className="text-[22px] font-semibold mb-4 text-white/90 tracking-tight relative z-10">{title}</h3>
      <p className="text-[#A3A3A3] leading-relaxed text-[15px] relative z-10">{desc}</p>
    </motion.div>
  );
}
