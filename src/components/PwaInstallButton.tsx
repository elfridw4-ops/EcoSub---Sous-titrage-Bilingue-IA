import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Check, Sparkles, X, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Détecter si l'application est lancée en mode autonome (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Gestion de l'événement natif d'installation (Android / Chrome Desktop / Edge / Windows / macOS)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Détection spécifique d'iOS pour guider l'utilisateur
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos && !isStandalone) {
      // Afficher un petit indicateur pour iOS Safari après un court délai
      const timer = setTimeout(() => {
        setShowIosTip(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowButton(false);
      setIsInstalled(true);
      console.log('SW: L\'utilisateur a accepté l\'installation.');
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[160] flex flex-col gap-2 max-w-sm m-2 md:m-0">
      {/* Bouton d'installation standard (Android, Windows, macOS) */}
      <AnimatePresence>
        {showButton && (
          <motion.button 
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleInstall}
            className="bg-white text-black border border-black/10 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-black flex-shrink-0">
              <Download className="w-4 h-4 text-[#FF4D00]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight">Installer l'application</p>
              <p className="text-[10px] text-black/40 font-normal mt-0.5">Accès rapide sur l'écran d'accueil</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Infobulle d'installation iOS Safari */}
      <AnimatePresence>
        {showIosTip && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white text-black border border-black/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-2.5 relative"
          >
            <button 
              onClick={() => setShowIosTip(false)}
              className="absolute top-2.5 right-2.5 p-1 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center text-[#FF4D00] flex-shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="space-y-1 pr-4">
                <p className="text-xs font-bold text-gray-900 leading-tight">Installer sur votre iPhone / iPad</p>
                <p className="text-[10px] text-black/60 leading-relaxed font-normal">
                  Pour une expérience plein écran optimale : appuyez sur le bouton de partage <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-black/50" /> de Safari, puis sélectionnez <span className="font-bold">« Sur l'écran d'accueil »</span>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
