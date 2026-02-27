'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export default function AdModal({ isOpen, onClose, onComplete }: AdModalProps) {
    const [timeLeft, setTimeLeft] = useState(30);

    // Reset timer when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(30);
        }
    }, [isOpen]);

    // Countdown logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isOpen && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isOpen && timeLeft === 0) {
            // Unlock logic when timer hits 0
            onComplete();
            onClose();
        }

        return () => clearInterval(interval);
    }, [isOpen, timeLeft, onComplete, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                {/* Backdrop with heavy blur/opacity */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/95 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden z-10 flex flex-col items-center text-center"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="mb-6 flex flex-col items-center">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20 animate-pulse">
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Patience cosmique...</h3>
                        <p className="text-zinc-400 text-sm">
                            Ton Aura HD se débloque dans <span className="text-yellow-500 font-bold text-lg">{timeLeft}</span> secondes...
                        </p>
                    </div>

                    {/* AD PLACEHOLDER */}
                    <div className="w-[300px] h-[250px] bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center mb-6 relative overflow-hidden group">

                        {/* Placeholder Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 group-hover:opacity-75 transition-opacity">
                            <Play className="w-12 h-12 text-zinc-600 mb-2" />
                            <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Espace Publicitaire</span>
                            <span className="text-zinc-600 text-[10px] mt-1">(300x250)</span>
                        </div>

                        {/* IMPORTANT COMMENT FOR INTEGRATION */}
                        {/*
                            👇 INSÉRER LE SCRIPT GOOGLE ADSENSE OU MONETAG ICI 👇
                            Exemple: <ins className="adsbygoogle" ... />
                        */}
                    </div>

                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-yellow-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </div>

                    <p className="mt-4 text-[10px] text-zinc-600 uppercase tracking-widest">
                        Ne ferme pas cette fenêtre
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
