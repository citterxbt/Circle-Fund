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
    <section className="py-24 px-6 border-y border-dark-800">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Builders</h2>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Stop wasting time on bureaucratic grant processes. Circle Fund abstracts the complexity so you can focus on writing code and shipping products.
          </p>
          <ul className="space-y-4">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-primary-400 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-purple-600/20 blur-3xl -z-10 rounded-full" />
          <div className="bg-dark-800/50 border border-dark-700 p-8 rounded-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-dark-700">
              <div className="text-sm text-slate-400">Total Value Locked</div>
              <div className="text-primary-400 font-mono">Arc Testnet</div>
            </div>
            <div className="text-5xl font-display font-bold mb-2">250,000 USDC</div>
            <div className="text-slate-400 text-sm">Available for active ecosystem grants</div>
          </div>
        </div>
      </div>
    </section>
  );
}
