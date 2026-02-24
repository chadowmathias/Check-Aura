'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, Download, Share2, Crown } from 'lucide-react';
import Loading from '@/components/Loading';
import PremiumModal from '@/components/PremiumModal';
import { toPng } from 'html-to-image';

const AURA_PHRASES = [
  { min: -10000, max: -5000, text: "Aura en chute libre. Vibe de PNJ buggé, reste couché aujourd'hui." },
  { min: -4999, max: -1, text: "C'est la hess cosmique. Ton aura est en grand sous-régime." },
  { min: 0, max: 4999, text: "Pas mal, mais tu peux mieux faire. Énergie de personnage secondaire." },
  { min: 5000, max: 8000, text: "Grosse énergie de Main Character. Tu brilles dans le noir." },
  { min: 8001, max: 10000, text: "AURA LÉGENDAIRE. T'es le boss final du jeu, respect." }
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<null | {
    color: string;
    score: number;
    image: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;
    analyzeImage(file);
  };

  const getAuraPhrase = (score: number) => {
    return AURA_PHRASES.find(p => score >= p.min && score <= p.max)?.text || "Vibration indéterminée...";
  };

  const analyzeImage = async (file: File) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
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
      setError(err.message || "Les énergies cosmiques sont instables. ✨");
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
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };
      };
    });
  };

  const downloadImage = async () => {
    if (!cardRef.current) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: '#09090b', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `aura-check-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur téléch.:', err);
      setError("Erreur technique de génération.");
    }
  };

  const getColorHex = (color: string) => {
    switch (color) {
      case 'purple': return '#a855f7';
      case 'red': return '#ef4444';
      case 'blue': return '#3b82f6';
      case 'gold': return '#eab308';
      case 'neon-green': return '#22c55e';
      default: return '#71717a';
    }
  };

  const getAuraColorClasses = (color: string) => {
    switch (color) {
      case 'purple': return 'from-purple-600 to-transparent';
      case 'red': return 'from-red-600 to-transparent';
      case 'blue': return 'from-blue-600 to-transparent';
      case 'gold': return 'from-yellow-400 to-transparent';
      case 'neon-green': return 'from-green-400 to-transparent';
      default: return 'from-zinc-600 to-transparent';
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center bg-zinc-950 relative overflow-x-hidden">
      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />

      {/* Decorative Glows (Restored) */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-aura-purple/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-aura-blue/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {!result ? (
        <div className="max-w-md w-full z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter aura-gradient text-glow leading-none">
              AURA CHECK
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl mb-16 max-w-sm mx-auto leading-relaxed">
              Découvre ton énergie cosmique en un flash. ✨
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="cursor-pointer group relative flex flex-col items-center">
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} disabled={isLoading} />

              <div className="relative w-52 h-52 rounded-full flex items-center justify-center transition-all duration-700">
                {/* Breathing Halo (Restored) */}
                <motion.div
                  className="absolute inset-[-10px] rounded-full border-2 border-aura-purple/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Main Button Body */}
                <div className="absolute inset-0 rounded-full bg-zinc-900 border border-white/10 group-hover:border-aura-purple/50 transition-all duration-500 shadow-[0_0_50px_rgba(124,58,237,0.15)] bg-glow overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-aura-purple/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <Camera className="w-14 h-14 text-white mb-2 group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>

              <span className="mt-8 text-xs font-black tracking-[0.3em] uppercase text-zinc-500 group-hover:text-white transition-colors">
                Lancer le rituel
              </span>
            </label>

            <label className="cursor-pointer mt-12 inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-xs font-black tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all hover:border-white/20">
              <Upload className="w-4 h-4" />
              <span>UPLOAD</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isLoading} />
            </label>
          </motion.div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full max-w-lg z-10">
          {/* STORY CARD (9:16) */}
          <div ref={cardRef} className="relative w-[340px] aspect-[9/16] rounded-[3rem] bg-zinc-950 overflow-hidden flex flex-col p-8 border border-white/5 shadow-2xl">
            <div className={`absolute top-0 left-0 w-full h-1/2 opacity-20 bg-gradient-to-b ${getAuraColorClasses(result.color)}`} />

            <div className="relative z-10 mb-8 flex flex-col items-center gap-1">
              <span className="text-[8px] tracking-[0.5em] font-mono text-zinc-500 uppercase">Aura Assessment</span>
              <h2 className="text-xl font-black aura-gradient tracking-tighter">AURA CHECK</h2>
            </div>

            {/* GIGANTIC SCORE (v0.1.4 Logic Kept) */}
            <div className="relative z-10 flex flex-col items-center justify-center mb-8">
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ color: getColorHex(result.color), textShadow: `0 0 40px ${getColorHex(result.color)}66` }}
                className="text-8xl font-black tracking-tighter drop-shadow-2xl"
              >
                {result.score > 0 ? `+${result.score}` : result.score}
              </motion.span>
              <span className="text-[10px] tracking-[0.5em] font-mono text-zinc-500 uppercase mt-2">Points d'Aura</span>
            </div>

            {/* PHOTO (Full Contain - v0.1.4 Logic Kept) */}
            <div className="relative flex-grow mb-8 rounded-3xl overflow-hidden bg-zinc-900/50 border border-white/10 group">
              <img src={result.image} alt="User" className="w-full h-full object-contain relative z-10" />
              <div className="absolute inset-0 blur-3xl opacity-20 z-0" style={{ backgroundColor: getColorHex(result.color) }} />
            </div>

            {/* PHRASE (v0.1.4 Logic Kept) */}
            <div className="relative z-10 px-4">
              <p className="text-white text-xl font-bold leading-tight drop-shadow-md italic">
                "{getAuraPhrase(result.score)}"
              </p>
              <div className="mt-4 inline-block px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: getColorHex(result.color) }}>
                  Aura {result.color}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-auto pt-6 opacity-30 text-center">
              <p className="text-[8px] tracking-[0.6em] font-mono text-white uppercase">AuraCheck.app v0.1.5</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-8 w-full max-w-[340px] flex flex-col gap-3">
            <button onClick={downloadImage} className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black font-black rounded-3xl hover:bg-zinc-200 transition-all uppercase tracking-tighter shadow-xl">
              <Download className="w-5 h-5" /> Partager ma Story
            </button>
            <button onClick={() => setIsPremiumModalOpen(true)} className="w-full flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-yellow-500/20 text-yellow-500 font-bold rounded-3xl hover:bg-zinc-800 transition-all uppercase tracking-tighter text-sm">
              <Crown className="w-5 h-5" /> Débloquer HD
            </button>
            <button onClick={() => setResult(null)} className="py-4 text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Retour à l'accueil</button>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="fixed bottom-10 left-4 right-4 z-[100] p-4 bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl text-red-400 text-sm animate-bounce">
          {error}
        </div>
      )}

      {/* Footer Branding (UI restored) */}
      {!result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1 }}
          className="fixed bottom-8 text-[10px] tracking-[0.3em] font-mono text-zinc-500 uppercase z-0"
        >
          AuraCheck v0.1.6
        </motion.div>
      )}
    </div>
  );
}
