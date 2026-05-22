import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export function Benefits() {
  const benefits = [
    "Predictable funding paired with clear expectations",
    "Direct feedback from the community and committee",
    "Verified on-chain reputation for successful deliverables",
    "Streamlined application and reporting UI"
  ];

  return (
    <section className="py-32 px-[4vw] border-b border-white/[0.02] bg-transparent">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-20 items-center">
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-[2.5rem] md:text-[4rem] font-bold tracking-tight mb-8 leading-[1.1] text-white">Built for Builders.</h2>
          <p className="text-xl text-[#A3A3A3] mb-12 font-light leading-relaxed max-w-[500px]">
            Stop wasting time on bureaucratic grant processes. Circle Fund abstracts the complexity so you can focus on writing code and shipping products.
          </p>
          <ul className="space-y-6">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-4 text-white/80 font-medium">
                <CheckCircle2 className="w-5 h-5 text-white/50 shrink-0" />
                <span className="text-[15px]">{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        
        <motion.div 
           initial={{ opacity: 0, x: 30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent blur-[80px] -z-10 rounded-full" />
          <div className="bg-white/[0.02] border border-white/5 p-12 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-300">
             <div className="absolute inset-0 bg-gradient-radial from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/10 relative z-10">
              <div className="text-sm font-medium text-white/50 tracking-wide uppercase">Total Value Locked</div>
              <div className="text-white/80 font-mono text-sm tracking-wide">Arc Testnet</div>
            </div>
            <div className="text-[4rem] font-bold tracking-tight mb-4 text-white relative z-10">250,000 <span className="text-[2rem] text-white/50 align-top">USDC</span></div>
            <div className="text-[#A3A3A3] font-medium relative z-10">Available for active ecosystem grants</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
