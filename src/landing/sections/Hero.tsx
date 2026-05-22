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
        <nav className="hidden md:flex items-center gap-10 text-[11px] font-semibold tracking-[0.1em] uppercase text-white/80 font-sans">
          <a href="#problem" className="hover:text-white transition-colors">Broken Model.</a>
          <a href="#how" className="hover:text-white transition-colors">Seamless Operations.</a>
          <a href="#features" className="hover:text-white transition-colors">Core Intelligence.</a>
          <a href="#benefits" className="hover:text-white transition-colors">Built for Builders.</a>
          <a href="#faq" className="hover:text-white transition-colors">Frequently Asked Questions</a>
        </nav>
      </header>

      {/* Main Text (Center Left) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute top-1/2 -translate-y-1/2 left-[5%] max-w-[900px] z-40 flex flex-col gap-6 text-left"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex items-center gap-3 drop-shadow-md font-sans"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <span className="font-bold text-white tracking-widest text-[10px]">CF</span>
          </div>
          <span className="font-semibold text-white tracking-widest text-sm uppercase">Circle Fund</span>
        </motion.div>

        <h1 className="text-[28px] md:text-[34px] lg:text-[42px] text-white font-light leading-[1.2] tracking-wide drop-shadow-xl font-sans uppercase">
          YOUR EVERYDAY<br />
          DECENTRALIZED<br />
          FUNDING PARTNER.
        </h1>
      </motion.div>

      {/* Description & CTA (Bottom Right) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        className="absolute bottom-[8%] right-[5%] max-w-[450px] z-40 flex flex-col items-end text-right font-sans"
      >
        <p className="text-[16px] md:text-[18px] text-white/90 font-light leading-relaxed mb-6 drop-shadow-md">
          We build for builders. A transparent decentralized funding platform without intermediaries. Unmatched security and absolute accountability.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <Link
            to={appUrl}
            className="bg-white text-black px-10 py-3.5 rounded-[50px] font-bold text-[14px] transition-all hover:scale-105 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            Launch App
          </Link>
        </div>
      </motion.div>

      {/* Empty space for bottom left */}
    </section>
  );
}

