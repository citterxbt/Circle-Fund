import React from 'react';
import { motion } from 'motion/react';

export function HowItWorks() {
  const steps = [
    { num: '01', title: 'Submit Proposal', desc: 'Builders define clear milestones, requested amounts, and deadlines' },
    { num: '02', title: 'Community Review', desc: 'Proposals undergo public scrutiny, voting, and admin approval' },
    { num: '03', title: 'Execute & Report', desc: 'Builders work on their projects and submit progress reports for each milestone' },
    { num: '04', title: 'Claim Funds', desc: 'Upon milestone verification, USDC is released directly to the builder' }
  ];

  return (
    <section id="how" className="py-32 px-[4vw] relative overflow-hidden bg-transparent text-white">
      <div className="absolute top-0 right-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-900/10 to-transparent blur-[120px] -z-10" />
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-[2.5rem] md:text-[4rem] font-bold tracking-tight mb-20 text-center leading-[1.1]">
          Seamless Operations<br />
          <span className="text-white/40">Zero Intermediaries</span>
        </h2>
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 hidden md:block" />
          <div className="grid md:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                className="group relative bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="text-[3rem] font-bold text-white/40 mb-6 group-hover:text-white transition-colors relative z-10">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white/90 relative z-10">{step.title}</h3>
                <p className="text-[#A3A3A3] text-sm leading-loose relative z-10">
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
