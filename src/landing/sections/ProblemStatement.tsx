import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingDown, Users } from 'lucide-react';

export function ProblemStatement() {
  const problems = [
    {
      icon: <ShieldAlert className="w-8 h-8 text-white/70" />,
      title: "Lack of Accountability",
      description: "Traditional upfront grants often lead to abandoned projects once funding is secured, eroding ecosystem trust."
    },
    {
      icon: <TrendingDown className="w-8 h-8 text-white/70" />,
      title: "Opaque Processes",
      description: "Builders wait months in the dark, unsure why proposals are rejected or how funds are allocated."
    },
    {
      icon: <Users className="w-8 h-8 text-white/70" />,
      title: "Community Disconnect",
      description: "The community that uses the products has no voice in which initiatives receive ecosystem treasury funds."
    }
  ];

  return (
    <section className="py-32 px-[4vw] bg-transparent border-y border-white/[0.02]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-[2.5rem] md:text-[4rem] font-bold mb-6 tracking-tight leading-[1.1]">The Broken Model.</h2>
          <p className="text-xl text-[#A3A3A3] max-w-2xl mx-auto font-light">
            Web3 thrives on execution, but current funding models prioritize promises over delivery.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
              className="p-10 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-white/20 transition-colors"
            >
              <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl inline-block shadow-inner">
                {problem.icon}
              </div>
              <h3 className="text-[22px] font-semibold mb-4 text-white/90 tracking-tight">{problem.title}</h3>
              <p className="text-[#A3A3A3] leading-relaxed text-[15px]">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
