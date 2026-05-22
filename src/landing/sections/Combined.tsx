import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Transparency() {
  return (
    <section className="py-32 px-[4vw] bg-transparent border-t border-white/[0.02]">
      <div className="max-w-[1000px] mx-auto text-center">
        <h2 className="text-[2.5rem] md:text-[4rem] font-bold mb-8 tracking-tight text-white leading-[1.1]">Uncompromising Transparency.</h2>
        <p className="text-[18px] text-[#A3A3A3] mb-12 font-light leading-relaxed">
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
    <section className="py-32 px-[4vw] bg-transparent">
      <div className="max-w-[800px] mx-auto">
        <h2 className="text-[2.5rem] md:text-[3rem] font-bold mb-16 text-center text-white tracking-tight">Frequently Asked Questions</h2>
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
    <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#0F0F0F] transition-colors hover:border-white/10">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left transition-colors"
      >
        <span className="font-semibold text-[18px] text-white/90">{question}</span>
        <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform ${open ? 'rotate-180 bg-white/10' : ''}`}>
          <ChevronDown className="w-4 h-4 text-white/70" />
        </div>
      </button>
      <AnimatePresence>
        {open && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden"
           >
             <div className="p-6 pt-0 text-[#A3A3A3] leading-relaxed border-t border-white/5 mt-2 font-light">
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
    <section className="py-40 px-[4vw] relative overflow-hidden bg-transparent">
      <div className="absolute inset-0 bg-gradient-radial from-white/[0.05] to-transparent blur-[100px] -z-10" />
      <div className="max-w-[1000px] mx-auto text-center relative z-10">
        <h2 className="text-[3.5rem] md:text-[5.5rem] font-extrabold mb-8 tracking-tight leading-[1.1]">Ready to Build?</h2>
        <p className="text-[20px] text-[#A3A3A3] mb-12 font-light">
          Submit your proposal today and help shape the future of the Arc ecosystem.
        </p>
        <Link 
          to={appUrl}
          className="inline-flex items-center justify-center bg-white text-black px-12 py-5 rounded-full font-bold text-[16px] transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          Enter App
        </Link>
      </div>
    </section>
  );
}
