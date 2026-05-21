import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingDown, Users } from 'lucide-react';

export function ProblemStatement() {
  const problems = [
    {
      icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
      title: "Lack of Accountability",
      description: "Traditional upfront grants often lead to abandoned projects once funding is secured, eroding ecosystem trust."
    },
    {
      icon: <TrendingDown className="w-8 h-8 text-amber-400" />,
      title: "Opaque Review Processes",
      description: "Builders wait months in the dark, unsure why proposals are rejected or how funds are allocated."
    },
    {
      icon: <Users className="w-8 h-8 text-primary-400" />,
      title: "Community Disconnect",
      description: "The community that uses the products has no voice in which initiatives receive ecosystem treasury funds."
    }
  ];

  return (
    <section className="py-24 px-6 bg-dark-800/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">The Broken Grant Model</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Web3 thrives on execution, but current funding models incentivize proposals over delivery.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-dark-900 border border-dark-800"
            >
              <div className="mb-6 p-4 bg-dark-800/50 rounded-xl inline-block">
                {problem.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{problem.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
