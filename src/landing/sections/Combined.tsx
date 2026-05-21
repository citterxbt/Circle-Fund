import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Transparency() {
  return (
    <section className="py-24 px-6 bg-dark-800/20">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Uncompromising Transparency</h2>
        <p className="text-lg text-slate-400 mb-12">
          Every decision, from initial review to milestone verification, is recorded. 
          The community has full visibility into who gets funded and whether they deliver.
        </p>
      </div>
    </section>
  );
}

export function FAQ() {
  const faqs = [
    { q: "What is Circle Fund?", a: "Circle Fund is a decentralized platform for distributing ecosystem grants based on verifiable milestones rather than upfront payments." },
    { q: "Which network does it use?", a: "The prototype currently operates exclusively on the Arc Testnet using USDC as the standard accounting asset." },
    { q: "Who can submit a proposal?", a: "Any Web3 builder with a connected wallet can submit a proposal. Active contributions open to the Arc ecosystem are prioritized." },
    { q: "How are milestones verified?", a: "Builders submit progress reports with supporting evidence (e.g., GitHub commits). Admins review and approve these reports before funds become claimable." },
    { q: "Is voting on-chain?", a: "For this prototype, voting is recorded via standard database transactions authenticated by wallet signatures to ensure fast, gasless community signaling." }
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-dark-800 rounded-xl overflow-hidden bg-dark-900 border-l border-r border-t border-b">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-dark-800/50 transition-colors"
      >
        <span className="font-medium text-lg">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-slate-400 leading-relaxed border-t border-dark-800 mt-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CTASection() {
  const appUrl = import.meta.env.VITE_APP_ENTRY_URL || '/app';
  
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary-900/10 -z-10" />
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to Build?</h2>
        <p className="text-xl text-slate-400 mb-10">
          Submit your proposal today and help shape the future of the Arc ecosystem.
        </p>
        <Link 
          to={appUrl}
          className="inline-flex items-center gap-2 bg-white text-dark-900 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
        >
          Enter App
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
