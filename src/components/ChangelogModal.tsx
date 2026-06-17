import React, { useState } from 'react';
import { APP_VERSIONS, CURRENT_VERSION } from '../data/versions';
import { X, Calendar, Info, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string; // Version cible de la mise à jour (si appelé via le flux de mise à jour)
  showAll?: boolean; // Si on affiche tout l'historique par défaut
}

export function ChangelogModal({ isOpen, onClose, version = CURRENT_VERSION, showAll = false }: ChangelogModalProps) {
  const [activeTab, setActiveTab] = useState<'latest' | 'history'>(showAll ? 'history' : 'latest');

  if (!isOpen) return null;

  const latestRelease = APP_VERSIONS.find(v => v.version === version) || APP_VERSIONS[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-black/5"
      >
        {/* Entête */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#FF4D00]/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#FF4D00]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Notes de version</h2>
              <p className="text-xs text-black/40">Suivez l'évolution d'EcoSub AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/50 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sélection des Onglets */}
        <div className="flex bg-black/5 rounded-xl p-1 my-4">
          <button
            onClick={() => setActiveTab('latest')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'latest' 
                ? 'bg-white text-black shadow-sm' 
                : 'text-black/60 hover:text-black'
            }`}
          >
            Dernière mise à jour ({version})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'history' 
                ? 'bg-white text-black shadow-sm' 
                : 'text-black/60 hover:text-black'
            }`}
          >
            Historique complet ({APP_VERSIONS.length} versions)
          </button>
        </div>

        {/* Zone de Contenu Déroulable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 max-h-[50vh]">
          {activeTab === 'latest' ? (
            <div className="space-y-4">
              {/* Carte Flash Version */}
              <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center font-mono text-sm font-bold text-[#FF4D00]">
                    v
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-base">{latestRelease.version}</span>
                      {latestRelease.isCritical && (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wider">
                          <ShieldAlert className="w-2.5 h-2.5" /> Critique
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-black/40 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(latestRelease.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs bg-black/5 px-3 py-1.5 rounded-xl font-bold self-start sm:self-auto">
                  Version Actuelle
                </div>
              </div>

              {/* Liste des changements */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-wider text-black/40 uppercase">Aperçu des nouveautés :</h3>
                <div className="space-y-2.5">
                  {latestRelease.changes.map((change, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx} 
                      className="flex items-start gap-3 bg-black/[0.01] border border-black/5 p-3 rounded-xl hover:bg-black/[0.02] transition-all"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#FF4D00]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#FF4D00]" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-normal">{change}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative border-l border-black/10 ml-3.5 space-y-8 pl-6 py-2">
              {APP_VERSIONS.map((release, idx) => (
                <div key={idx} className="relative">
                  {/* Point clé de la timeline */}
                  <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                    release.version === CURRENT_VERSION ? 'border-[#FF4D00] scale-110 shadow-sm' : 'border-gray-300'
                  }`}>
                    {release.version === CURRENT_VERSION && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D00]" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm md:text-base">{release.version}</span>
                      <span className="text-xs text-black/40 font-mono">({new Date(release.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })})</span>
                      {release.version === CURRENT_VERSION && (
                        <span className="bg-[#FF4D00]/10 text-[#FF4D00] text-[9px] font-bold px-2 py-0.5 rounded-lg">Active</span>
                      )}
                    </div>

                    <ul className="space-y-1.5 pl-2">
                      {release.changes.map((change, cIdx) => (
                        <li key={cIdx} className="text-xs md:text-sm text-black/60 flex items-start gap-2 leading-relaxed">
                          <span className="text-[#FF4D00] mt-1.5 select-none">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-black/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-[11px] text-black/40 bg-black/5 px-2.5 py-1 rounded-lg">
            <Info className="w-3.5 h-3.5" /> Uniquement des mises à jour sûres.
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 transition-all flex-shrink-0"
          >
            Fermer les notes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
