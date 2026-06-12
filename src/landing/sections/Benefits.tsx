import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export function Benefits() {
  const benefits = [
    { title: "Predictable Funding", desc: "Predictable funding paired with clear expectations" },
    { title: "Direct Feedback", desc: "Direct feedback from the community and committee" },
    { title: "On-Chain Verification", desc: "Verified on-chain reputation for successful deliverables" },
    { title: "Streamlined Experience", desc: "Streamlined application and reporting UI" }
  ];

  return (
    <section id="benefits" className="py-32 px-[4vw] border-b border-white/[0.02] bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-[2.5rem] md:text-[4rem] font-bold tracking-tight mb-6 leading-[1.1] text-white">Built for Builders</h2>
          <p className="text-xl text-[#A3A3A3] font-light leading-relaxed max-w-2xl mx-auto">
            Stop wasting time on bureaucratic grant processes. Circle Fund abstracts the complexity so you can focus on writing code and shipping products
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
               className="group p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors relative overflow-hidden"
             >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-6 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-white/10 relative z-10">
                  <CheckCircle2 className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white/90 tracking-tight relative z-10">{b.title}</h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm relative z-10">{b.desc}</p>
             </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
