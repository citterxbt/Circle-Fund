import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Target, MessageSquare } from 'lucide-react';

export function KeyFeatures() {
  return (
    <section className="py-24 px-6 bg-dark-800/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Target className="text-primary-400 w-6 h-6" />}
            title="Milestone Tracker"
            desc="Granular tracking of deliverables ensuring funds are only released when value is created."
          />
          <FeatureCard 
            icon={<Activity className="text-primary-400 w-6 h-6" />}
            title="Builder Dashboard"
            desc="Manage active proposals, upcoming deadlines, and claimable funds from a single command center."
          />
          <FeatureCard 
            icon={<MessageSquare className="text-primary-400 w-6 h-6" />}
            title="On-Chain Governance"
            desc="Community members can upvote, downvote, and discuss proposals directly using their wallet."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-8 bg-dark-900 border border-dark-800 rounded-2xl hover:border-primary-500/30 transition-colors"
    >
      <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
