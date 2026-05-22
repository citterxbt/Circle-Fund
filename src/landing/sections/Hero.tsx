import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export function Hero() {
  const appUrl = import.meta.env.VITE_APP_ENTRY_URL || '/app';

  return (
    <section className="relative w-full h-[100svh] overflow-hidden font-sans bg-transparent text-white">
      {/* Background provided by LandingPage video */}

      {/* Navigation Header (Top) */}
      <header className="absolute top-0 left-0 w-full flex justify-center items-center px-[5%] py-8 z-50">
        <nav className="hidden md:flex items-center gap-3 text-[11px] font-semibold tracking-[0.1em] uppercase font-sans">
          <a href="#problem" className="px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">The Problem</a>
          <a href="#how" className="px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">How It Works</a>
          <a href="#features" className="px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">Features</a>
          <a href="#benefits" className="px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">For Builders</a>
          <a href="#faq" className="px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">FAQ</a>
        </nav>
      </header>

      {/* Main Text (Center Left) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute top-[45%] -translate-y-1/2 left-[5%] md:left-[8%] max-w-[900px] z-40 flex flex-col gap-5 text-left mb-0 ml-0 -mt-[45px]"
      >
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="font-medium text-white/50 tracking-widest text-sm uppercase drop-shadow-md font-display"
        >
          Circle Fund
        </motion.span>

        <h1 className="text-[32px] md:text-[40px] lg:text-[48px] text-white font-bold leading-[1.2] tracking-wide drop-shadow-xl font-display uppercase">
          YOUR EVERYDAY<br />
          DECENTRALIZED<br />
          FUNDING PARTNER
        </h1>
      </motion.div>

      {/* Description (Right Side) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="absolute bottom-[15%] md:bottom-[20%] right-[5%] md:right-[8%] max-w-[450px] z-40 flex flex-col items-end text-right font-sans"
      >
        <p className="pl-0 mb-[35px] text-right leading-[36.5px] text-[18px] text-white/90 font-light drop-shadow-md">
          We build for builders. A transparent decentralized funding platform without intermediaries. Unmatched security and absolute accountability
        </p>
      </motion.div>

      {/* CTA Button (Bottom Center) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-40"
      >
        <Link
          to={appUrl}
          className="inline-flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 px-12 py-4 rounded-full font-bold text-[14px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          Launch App
        </Link>
      </motion.div>

      {/* Empty space for bottom left */}
    </section>
  );
}

