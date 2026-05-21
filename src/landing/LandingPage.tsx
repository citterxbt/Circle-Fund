import React from 'react';
import { Hero } from './sections/Hero';
import { ProblemStatement } from './sections/ProblemStatement';
import { HowItWorks } from './sections/HowItWorks';
import { KeyFeatures } from './sections/KeyFeatures';
import { Benefits } from './sections/Benefits';
import { Transparency, FAQ, CTASection } from './sections/Combined';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 font-sans selection:bg-primary-500/30">
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
      <footer className="border-t border-dark-800 py-12 text-center text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p>&copy; {new Date().getFullYear()} Circle Fund. Built for the Arc Testnet.</p>
        </div>
      </footer>
    </div>
  );
}
