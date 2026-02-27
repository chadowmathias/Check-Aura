'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Play, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Stripe initialization
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// const stripePromise = stripeKey ? loadStripe(stripeKey) : null;
// Removed loadStripe import to avoid unused variable warning since we redirect server-side

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWatchAd?: () => void;
}

export default function PremiumModal({ isOpen, onClose, onWatchAd }: PremiumModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        // Simple check for the publishable key
        const hasPublicKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!hasPublicKey) {
            console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is likely missing, but proceeding with checkout initialization...");
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erreur API Checkout:", errorData);

                if (errorData.error) {
                    alert(`Erreur: ${errorData.error}`);
                } else {
                    alert("Une erreur est survenue lors de l'initialisation du paiement.");
                }
                return;
            }

            const { url } = await response.json();

            if (url) {
                window.location.href = url;
            } else {
                console.error("No checkout URL returned");
                alert("Erreur de redirection vers le paiement.");
            }
        } catch (error) {
            console.error("Checkout Exception:", error);
            alert("Une erreur technique est survenue.");
        } finally {
            // Keep loading true if redirecting
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden z-10"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/20 blur-3xl rounded-full" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 border border-yellow-500/20">
                            <Crown className="w-8 h-8 text-yellow-500" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">Débloque la version HD</h3>
                        <p className="text-zinc-400 text-sm mb-8">
                            Enlève le filigrane et obtiens une qualité maximale pour tes stories.
                        </p>

                        <div className="w-full space-y-3">
                            <button
                                onClick={onWatchAd}
                                className="w-full flex items-center justify-between px-6 py-4 bg-yellow-500 text-black font-bold rounded-2xl hover:bg-yellow-400 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Play className="w-5 h-5 fill-current" />
                                    <span>Regarder une pub</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest opacity-60">Gratuit</span>
                            </button>

                            <button
                                onClick={handleCheckout}
                                disabled={isLoading}
                                className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                    <span>{isLoading ? "Chargement..." : "Payer une fois"}</span>
                                </div>
                                <span className="text-yellow-500 text-sm">0.99€</span>
                            </button>
                        </div>

                        <p className="mt-6 text-[10px] text-zinc-500 uppercase tracking-widest">
                            Aucun abonnement requis
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
