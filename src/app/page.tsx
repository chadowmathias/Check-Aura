'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, Download, Share2, Crown } from 'lucide-react';
import Loading from '@/components/Loading';
import PremiumModal from '@/components/PremiumModal';
import { toPng } from 'html-to-image';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<null | {
    color: string;
    score: number;
    description: string;
    image: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Compression de l'image (max 800px) pour performance et stabilité
      const compressedFile = await compressImage(file);

      const formData = new FormData();
      formData.append("file", compressedFile);

      const response = await fetch("/api/analyze-aura", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Frontend analyze error:", err);
      setError(err.message || "Les énergies cosmiques sont instables en ce moment. Réessaie dans un instant ✨");
    } finally {
      setIsLoading(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          ctx?.canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback
            }
          }, 'image/jpeg', 0.85);
        };
      };
    });
  };

  const downloadImage = async () => {
    if (!cardRef.current) return;

    try {
      // Small delay to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#09090b', // zinc-950
        style: {
          transform: 'scale(1)', // Ensure no weird scaling
        }
      });
      const link = document.createElement('a');
      link.download = `aura-check-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError("Erreur technique lors de la génération de l'image.");
    }
  };

  const getAuraColorClasses = (color: string) => {
    switch (color) {
      case 'purple': return 'from-purple-600 to-purple-900';
      case 'red': return 'from-red-600 to-red-900';
      case 'blue': return 'from-blue-600 to-blue-900';
      case 'gold': return 'from-yellow-400 to-yellow-700';
      case 'neon-green': return 'from-green-400 to-green-700';
      default: return 'from-zinc-600 to-zinc-900';
    }
  };

  const getGlowColorClasses = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-purple-600/50';
      case 'red': return 'bg-red-600/50';
      case 'blue': return 'bg-blue-600/50';
      case 'gold': return 'bg-yellow-500/50';
      case 'neon-green': return 'bg-green-500/50';
      default: return 'bg-zinc-600/50';
    }
  };

  const getBorderColorClasses = (color: string) => {
    switch (color) {
      case 'purple': return 'border-purple-500/30';
      case 'red': return 'border-red-500/30';
      case 'blue': return 'border-blue-500/30';
      case 'gold': return 'border-yellow-500/30';
      case 'neon-green': return 'border-green-500/30';
      default: return 'border-zinc-500/30';
    }
  };

  const getGradientClasses = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-gradient-to-t from-purple-900 via-transparent to-purple-900';
      case 'red': return 'bg-gradient-to-t from-red-900 via-transparent to-red-900';
      case 'blue': return 'bg-gradient-to-t from-blue-900 via-transparent to-blue-900';
      case 'gold': return 'bg-gradient-to-t from-yellow-700 via-transparent to-yellow-700';
      case 'neon-green': return 'bg-gradient-to-t from-green-900 via-transparent to-green-900';
      default: return 'bg-gradient-to-t from-zinc-900 via-transparent to-zinc-900';
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-zinc-950 overflow-y-auto">
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />

      {/* Background Decorative Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-aura-purple/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-aura-blue/10 blur-[120px] rounded-full pointer-events-none" />

      {error && (
        <div className="fixed top-4 left-0 right-0 px-4 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm z-50 backdrop-blur-md">
          {error}
        </div>
      )}

      {!result ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">
              <span className="aura-gradient text-glow">AURA</span> CHECK
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-md mx-auto leading-relaxed">
              Découvre la couleur de ton âme et ton score d'aura en un instant.
              <span className="block mt-2 text-zinc-500 text-sm italic">Analyse complète incluant ton décor. ✨</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="z-10"
          >
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="group relative flex flex-col items-center justify-center w-40 h-40 rounded-full bg-zinc-900 border border-white/10 hover:border-aura-purple/50 transition-all duration-500 overflow-hidden bg-glow">
                <motion.div
                  className="absolute inset-0 bg-aura-purple/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <Camera className="w-10 h-10 text-white mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs font-bold tracking-widest uppercase text-zinc-400 group-hover:text-white transition-colors">Scanner</span>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-aura-purple/30"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </label>

            <div className="mt-8 flex gap-4 justify-center">
              <label className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-all shadow-xl">
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="z-10 flex flex-col items-center w-full"
        >
          {/* STORY CARD (Captured) */}
          <div
            ref={cardRef}
            className="relative w-[320px] aspect-[9/16] rounded-[2.5rem] bg-zinc-950 overflow-hidden flex flex-col p-8 transition-all duration-1000 shadow-2xl border border-white/5"
          >
            {/* Background Effects for Card */}
            <div className={`absolute top-0 left-0 w-full h-1/2 opacity-20 bg-gradient-to-b ${getAuraColorClasses(result.color)}`} />

            {/* Header Card */}
            <div className="relative z-10 flex flex-col items-center gap-1 mb-6">
              <h3 className="text-[10px] tracking-[0.4em] font-mono text-zinc-500 uppercase">Aura Assessment</h3>
              <h2 className="text-2xl font-black aura-gradient tracking-tighter">AURA CHECK</h2>
            </div>

            {/* Photo Container */}
            <div className="relative flex-grow mb-6 rounded-3xl overflow-hidden shadow-2xl">
              <div className={`absolute -inset-4 opacity-50 blur-2xl animate-pulse ${getGlowColorClasses(result.color)}`} />
              <div className={`relative z-10 w-full h-full rounded-3xl border-2 overflow-hidden ${getBorderColorClasses(result.color)}`}>
                {/* Photo Overlay */}
                <div className={`absolute inset-0 z-20 opacity-30 mix-blend-overlay ${getGradientClasses(result.color)}`} />

                <img src={result.image} alt="User Aura" className="w-full h-full object-cover" />

                <div className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-white">
                  {result.score.toLocaleString()} PTS
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="relative z-10 text-center space-y-4">
              <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-200">
                  Aura {result.color === 'purple' ? 'Violette' : result.color === 'red' ? 'Rouge' : result.color === 'blue' ? 'Bleue' : result.color === 'gold' ? 'Dorée' : result.color === 'neon-green' ? 'Néon Green' : 'Sombre'}
                </span>
              </div>
              <p className="text-zinc-200 text-lg italic leading-tight px-2">
                "{result.description}"
              </p>
            </div>

            {/* Watermark */}
            <div className="relative z-10 mt-auto pt-6 text-center">
              <p className="text-[8px] tracking-[0.5em] font-mono text-zinc-600 uppercase">
                Fait sur AuraCheck.app
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 w-full max-w-[320px] space-y-3">
            <button
              onClick={downloadImage}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-tighter text-sm"
            >
              <Download className="w-5 h-5" />
              Partager ma Story
            </button>

            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 border border-yellow-500/30 text-yellow-500 font-bold rounded-2xl hover:bg-zinc-800 transition-all uppercase tracking-tighter text-sm group"
            >
              <Crown className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Débloquer l'image HD
            </button>

            <button
              onClick={() => setResult(null)}
              className="w-full py-4 text-zinc-500 font-medium hover:text-white transition-colors text-xs uppercase tracking-widest"
            >
              Refaire le scan
            </button>
          </div>
        </motion.div>
      )}

      {/* Footer Branding */}
      {!result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1 }}
          className="fixed bottom-8 text-[10px] tracking-[0.3em] font-mono text-zinc-500 uppercase z-0"
        >
          AuraCheck v0.1.3
        </motion.div>
      )}
    </div>
  );
}
