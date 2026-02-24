'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const loadingTexts = [
  "Analyse des vibrations énergétiques...",
  "Connexion à l'astral...",
  "Scan des chakras...",
  "Mesure du taux de red flags...",
  "Révélation de l'Aura en cours..."
];

export default function Loading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 z-50">
      <div className="relative mb-12">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="w-48 h-48 rounded-full border-t-2 border-b-2 border-aura-purple opacity-30"
        />
        
        {/* Inner pulsing glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 m-auto w-24 h-24 bg-aura-purple/20 rounded-full blur-2xl font-mono text-center flex items-center justify-center border border-aura-purple/50 bg-glow"
        >
            <Sparkles className="w-8 h-8 text-aura-purple" />
        </motion.div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 3 + i, 
              repeat: Infinity, 
              delay: i * 0.5 
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ 
              top: `${20 + Math.random() * 60}%`, 
              left: `${20 + Math.random() * 60}%` 
            }}
          />
        ))}
      </div>

      <div className="h-12 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-zinc-400 text-lg font-medium text-center italic tracking-wide"
          >
            {loadingTexts[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
