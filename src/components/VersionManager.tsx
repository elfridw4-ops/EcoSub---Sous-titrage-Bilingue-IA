import React, { useState, useEffect } from 'react';
// @ts-expect-error - virtual module resolved by vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ChangelogModal } from './ChangelogModal';
import { CURRENT_VERSION, APP_VERSIONS } from '../data/versions';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function VersionManager() {
  const [showChangelog, setShowChangelog] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [customNeedRefresh, setCustomNeedRefresh] = useState(false);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW: Service Worker enregistré avec succès !', r);
    },
    onRegisterError(error) {
      console.error('SW: Échec de l\'enregistrement du Service Worker :', error);
    },
  });

  // Effectuer silencieusement une vérification de version à l'ouverture de l'application
  useEffect(() => {
    async function fetchServerVersion() {
      setIsChecking(true);
      try {
        const response = await fetch('/version.json', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setServerVersion(data.version);
          // Si la version serveur diffère de la version embarquée en dur
          if (data.version !== CURRENT_VERSION) {
            console.log(`SW: Version serveur (${data.version}) différente de la locale (${CURRENT_VERSION}).`);
            setCustomNeedRefresh(true);
          }
        }
      } catch (error) {
        console.error('SW: Erreur lors de la vérification de la version serveur :', error);
      } finally {
        setIsChecking(false);
      }
    }

    fetchServerVersion();
  }, []);

  const hasNewVersion = needRefresh || customNeedRefresh;
  const targetVersion = serverVersion || CURRENT_VERSION;
  const targetRelease = APP_VERSIONS.find(v => v.version === targetVersion) || APP_VERSIONS[0];

  const handleUpdate = async () => {
    // Événement de mise à jour sécurisée conservant les données
    console.log('SW: Lancement de la mise à jour de l\'application...');
    
    // Affichage des notes de version à l'utilisateur
    setShowChangelog(true);

    try {
      if (needRefresh) {
        // Déclencher la mise à jour du service worker natif
        await updateServiceWorker(true);
      } else {
        // Si c'est uniquement customNeedRefresh, forcer le rechargement propre
        // en purgeant le cache de navigation standard
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.update();
          }
        }
        window.location.reload();
      }
    } catch (e) {
      console.error('SW: Erreur lors du rechargement de mise à jour :', e);
      // Fallback de secours préservant session et IndexedDB
      window.location.reload();
    }
  };

  return (
    <>
      <AnimatePresence>
        {hasNewVersion && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 m-2 md:m-0 bg-black text-white p-5 rounded-2xl shadow-2xl z-[150] flex flex-col md:flex-row md:items-center gap-4 border border-white/10 max-w-md w-auto"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#FF4D00]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-[#FF4D00]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Nouvelle version disponible !</span>
                  <span className="bg-[#FF4D00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {targetVersion}
                  </span>
                </div>
                <p className="text-xs text-white/75 leading-relaxed">
                  Conservez vos brouillons et vos sessions avec cette mise à jour optimisée.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 justify-end">
              <button 
                onClick={handleUpdate}
                className="bg-[#FF4D00] hover:bg-[#E64500] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95"
              >
                Mettre à jour <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => {
                  setNeedRefresh(false);
                  setCustomNeedRefresh(false);
                }}
                className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-3 py-2 rounded-xl text-xs transition-colors whitespace-nowrap"
              >
                Plus tard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)} 
        version={targetVersion} 
      />
    </>
  );
}
