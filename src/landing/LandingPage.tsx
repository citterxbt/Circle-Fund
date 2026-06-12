import React, { useState, useEffect } from 'react';
import { Hero } from './sections/Hero';
import { ProblemStatement } from './sections/ProblemStatement';
import { HowItWorks } from './sections/HowItWorks';
import { KeyFeatures } from './sections/KeyFeatures';
import { Benefits } from './sections/Benefits';
import { FAQ, CTASection } from './sections/Combined';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LandingPage() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-white/20">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-40 mix-blend-screen"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-transparent fixed z-0 pointer-events-none" />
      
      <div className="relative z-10 w-full">
        <main>
          <Hero />
          <ProblemStatement />
          <HowItWorks />
          <KeyFeatures />
          <Benefits />
          <FAQ />
          <CTASection />
        </main>
        <footer className="border-t border-white/5 py-12 text-center text-[#A3A3A3] text-[13px] bg-transparent font-light tracking-wide relative z-10">
          <div className="max-w-[1400px] mx-auto px-[4vw]">
            <p>&copy; {new Date().getFullYear()} Circle Fund. Built for the Arc Testnet</p>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.1)]"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
