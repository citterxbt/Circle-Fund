import React from 'react';
import { motion } from 'framer-motion';

export function HowItWorks() {
  const steps = [
    { num: '01', title: 'Submit Proposal', desc: 'Builders define clear milestones, requested amounts, and deadlines.' },
    { num: '02', title: 'Community Review', desc: 'Proposals undergo public scrutiny, voting, and admin approval.' },
    { num: '03', title: 'Execute & Report', desc: 'Builders work on their projects and submit progress reports for each milestone.' },
    { num: '04', title: 'Claim Funds', desc: 'Upon milestone verification, USDC is released directly to the builder.' }
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">How It Works</h2>
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-dark-800 -translate-y-1/2 hidden md:block" />
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-dark-900 border border-dark-800 p-8 rounded-2xl z-10"
              >
                <div className="text-4xl font-display font-bold text-primary-500/20 mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
