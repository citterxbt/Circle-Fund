import React from 'react';
import { Hero } from './sections/Hero';
import { ProblemStatement } from './sections/ProblemStatement';
import { HowItWorks } from './sections/HowItWorks';
import { KeyFeatures } from './sections/KeyFeatures';
import { Benefits } from './sections/Benefits';
import { Transparency, FAQ, CTASection } from './sections/Combined';

export default function LandingPage() {
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
          <Transparency />
          <FAQ />
          <CTASection />
        </main>
        <footer className="border-t border-white/5 py-12 text-center text-[#A3A3A3] text-[13px] bg-transparent font-light tracking-wide relative z-10">
          <div className="max-w-[1400px] mx-auto px-[4vw]">
            <p>&copy; {new Date().getFullYear()} Circle Fund. Built for the Arc Testnet.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
