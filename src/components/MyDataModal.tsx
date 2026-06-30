import React, { useState, useEffect } from 'react';
import { 
  X, Database, HardDrive, Trash2, Download, AlertTriangle, 
  ShieldCheck, Clock, FileJson, FileSpreadsheet, Key, AlertCircle, 
  RefreshCw, CheckCircle2, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getVideos, deleteVideo, initDB, StoredVideo } from '../utils/storage';
import { deleteUser } from 'firebase/auth';
import { useModalBackHandler } from '../lib/navigation';

interface MyDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DataLog {
  action: string;
  date: string;
  id: string;
}

export function MyDataModal({ isOpen, onClose }: MyDataModalProps) {
  useModalBackHandler(isOpen, onClose, 'my-data-modal');
  
  // --- États locaux ---
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Statistiques de transparence
  const [storedVolume, setStoredVolume] = useState<string>('0 Ko');
  const [localProjectsCount, setLocalProjectsCount] = useState<number>(0);
  const [feedbacksCount, setFeedbacksCount] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<string>('Aucune activité récente');
  
  // Listes de données pour suppression individuelle
  const [localVideos, setLocalVideos] = useState<StoredVideo[]>([]);
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [firestoreHistory, setFirestoreHistory] = useState<any[]>([]);
  
  // Paramètres & Auto-nettoyage
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('auto_cleanup_21_days') === 'true';
  });
  
  // Confirmation de suppression globale
  const [showGlobalConfirm, setShowGlobalConfirm] = useState(false);
  const [globalConfirmInput, setGlobalConfirmInput] = useState('');
  
  // Confirmation de suppression de compte
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] = useState(false);
  const [accountConfirmInput, setAccountConfirmInput] = useState('');
  
  // Journaux de sécurité locaux
  const [securityLogs, setSecurityLogs] = useState<DataLog[]>([]);

  // Charger les statistiques et données à l'ouverture
  useEffect(() => {
    if (isOpen) {
      loadDataStats();
      loadSecurityLogs();
    }
  }, [isOpen]);

  // --- Charger les logs de sécurité ---
  const loadSecurityLogs = () => {
    const rawLogs = localStorage.getItem('ecosub_data_logs');
    if (rawLogs) {
      try {
        setSecurityLogs(JSON.parse(rawLogs));
      } catch (e) {
        setSecurityLogs([]);
      }
    }
  };

  // --- Enregistrer une action de sécurité ---
  const logSecurityAction = (action: string) => {
    const newLog: DataLog = {
      id: Math.random().toString(36).substring(2, 9),
      action,
      date: new Date().toISOString()
    };
    const updated = [newLog, ...securityLogs].slice(0, 30); // Limite à 30 logs
    setSecurityLogs(updated);
    localStorage.setItem('ecosub_data_logs', JSON.stringify(updated));
  };

  // --- Calculer le volume et récupérer l'historique ---
  const loadDataStats = async () => {
    setLoading(true);
    try {
      // 1. IndexedDB Videos
      const videos = await getVideos();
      setLocalVideos(videos);
      setLocalProjectsCount(videos.length);
      
      let totalBytes = 0;
      videos.forEach(v => {
        if (v.blob) {
          totalBytes += v.blob.size;
        }
      });
      
      if (totalBytes > 1024 * 1024) {
        setStoredVolume(`${(totalBytes / (1024 * 1024)).toFixed(2)} Mo`);
      } else {
        setStoredVolume(`${(totalBytes / 1024).toFixed(1)} Ko`);
      }

      // 2. Dernières activités & historique Firestore si connecté
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const historyList = data.history || [];
          setFirestoreHistory(historyList);
          
          if (historyList.length > 0) {
            // Trouver la date la plus récente
            const dates = historyList.map((h: any) => new Date(h.date).getTime());
            const maxDate = Math.max(...dates);
            setLastActivity(new Date(maxDate).toLocaleString('fr-FR'));
          } else {
            setLastActivity('Aujourd\'hui (Connexion)');
          }
        }
        
        // Feedbacks de l'utilisateur
        const q = query(
          collection(db, 'feedbacks'),
          where('userId', '==', currentUser.uid)
        );
        const feedbackSnap = await getDocs(q);
        const feedbacks: any[] = [];
        feedbackSnap.forEach(doc => {
          feedbacks.push({ id: doc.id, ...doc.data() });
        });
        setUserFeedbacks(feedbacks);
        setFeedbacksCount(feedbacks.length);
      } else {
        // Mode clé d'API Gemini ou Anonyme
        setFirestoreHistory([]);
        setUserFeedbacks([]);
        setFeedbacksCount(0);
        setLastActivity('Aujourd\'hui (Mode Local)');
      }
    } catch (e) {
      console.error('Erreur lors du chargement des statistiques de données:', e);
    } finally {
      setLoading(false);
    }
  };

  // --- Suppression individuelle de projet (IndexedDB) ---
  const handleDeleteLocalProject = async (id: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement le projet "${name}"?`)) return;
    try {
      await deleteVideo(id);
      logSecurityAction(`Suppression individuelle du projet vidéo : ${name}`);
      setSuccessMessage(`Projet "${name}" supprimé.`);
      loadDataStats();
    } catch (e) {
      setErrorMessage(`Erreur lors de la suppression de "${name}"`);
    }
  };

  // --- Suppression individuelle de feedback ---
  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer ce rapport de feedback ?')) return;
    try {
      await deleteDoc(doc(db, 'feedbacks', id));
      logSecurityAction(`Suppression individuelle du feedback ID : ${id}`);
      setSuccessMessage('Feedback supprimé avec succès.');
      loadDataStats();
    } catch (e) {
      setErrorMessage('Impossible de supprimer le feedback de Firestore.');
    }
  };

  // --- Nettoyage manuel des données > 21 jours ---
  const handleManualPrune = async () => {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 21);
    const limitTime = limitDate.getTime();
    
    let deletedCount = 0;
    try {
      const videos = await getVideos();
      for (const v of videos) {
        const videoTime = new Date(v.date).getTime();
        if (videoTime < limitTime) {
          await deleteVideo(v.id);
          deletedCount++;
        }
      }
      
      logSecurityAction(`Nettoyage manuel : ${deletedCount} projet(s) de plus de 21 jours supprimé(s)`);
      setSuccessMessage(`${deletedCount} projet(s) obsolète(s) ont été nettoyés avec succès.`);
      loadDataStats();
    } catch (e) {
      setErrorMessage('Une erreur est survenue lors du nettoyage.');
    }
  };

  // --- Activation de l'auto-nettoyage automatique ---
  const handleToggleAutoCleanup = (checked: boolean) => {
    setAutoCleanupEnabled(checked);
    localStorage.setItem('auto_cleanup_21_days', checked ? 'true' : 'false');
    logSecurityAction(`Modif paramètre : Nettoyage automatique à 21j ${checked ? 'activé' : 'désactivé'}`);
    setSuccessMessage(checked ? 'Nettoyage de 21 jours configuré en mode automatique.' : 'Nettoyage automatique désactivé.');
  };

  // --- Exportation JSON des données ---
  const handleExportJSON = () => {
    try {
      const dataToExport = {
        exportedAt: new Date().toISOString(),
        appName: 'EcoSub AI',
        user: auth.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName,
        } : null,
        localSettings: {
          gemini_api_key: localStorage.getItem('gemini_api_key') ? '[MASQUÉ_POUR_LA_SÉCURITÉ]' : null,
          has_seen_landing: localStorage.getItem('has_seen_landing'),
          auto_cleanup_21_days: localStorage.getItem('auto_cleanup_21_days'),
        },
        localProjects: localVideos.map(v => ({
          id: v.id,
          name: v.name,
          date: v.date,
          language: v.language,
          mode: v.mode,
          blobSize: v.blob ? v.blob.size : 0
        })),
        firestoreHistory: firestoreHistory,
        submittedFeedbacks: userFeedbacks.map(f => ({
          id: f.id,
          type: f.type,
          message: f.message,
          rating: f.rating,
          createdAt: f.createdAt?.toDate ? f.createdAt.toDate().toISOString() : f.createdAt
        })),
        activityLogs: securityLogs
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecosub_ai_data_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      logSecurityAction('Export de données complet au format JSON');
      setSuccessMessage('Exportation des données JSON lancée avec succès.');
    } catch (e) {
      setErrorMessage('Impossible de générer le fichier JSON.');
    }
  };

  // --- Exportation CSV de l'historique ---
  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Type,ID/Nom,Description,Date,Attribut Additionnel\n';
      
      // Projets Locaux
      localVideos.forEach(v => {
        const nameClean = v.name.replace(/"/g, '""');
        csvContent += `Projet Local,"${nameClean}",${v.language},${v.date},Taille: ${v.blob ? (v.blob.size / 1024).toFixed(1) : 0} Ko\n`;
      });
      
      // Historique des générations
      firestoreHistory.forEach((h, idx) => {
        const nameClean = (h.videoName || `Vidéo #${idx}`).replace(/"/g, '""');
        csvContent += `Historique Serveur,"${nameClean}",${h.mode || 'bilingue'},${h.date},Langue: ${h.language}\n`;
      });

      // Feedbacks
      userFeedbacks.forEach(f => {
        const messageClean = f.message.replace(/"/g, '""');
        csvContent += `Feedback,${f.type},"${messageClean}",${f.createdAt?.toDate ? f.createdAt.toDate().toISOString() : ''},Note: ${f.rating}/5\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ecosub_ai_history_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logSecurityAction('Export d\'historique au format CSV');
      setSuccessMessage('Exportation des données CSV lancée.');
    } catch (e) {
      setErrorMessage('Impossible de générer le fichier CSV.');
    }
  };

  // --- Suppression Globale (Reset de tout l'historique) ---
  const handleGlobalReset = async () => {
    if (globalConfirmInput !== 'EFFACER') {
      alert('Veuillez saisir le mot de confirmation exact.');
      return;
    }

    setLoading(true);
    try {
      // 1. Purger IndexedDB
      const videos = await getVideos();
      for (const v of videos) {
        await deleteVideo(v.id);
      }

      // 2. Purger les clés de localStorage
      localStorage.removeItem('gemini_api_key');
      localStorage.removeItem('save_gemini_key');
      localStorage.removeItem('auto_cleanup_21_days');
      
      // 3. Purger les feedbacks et l'historique Firestore si connecté
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Réinitialiser la fiche utilisateur mais garder la liste de generations 24h (sécurité / quotas)
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const generations = userDoc.exists() ? (userDoc.data().generations || []) : [];
        await setDoc(userRef, {
          generations,
          history: [],
          email: currentUser.email
        });

        // Supprimer tous les feedbacks individuels
        for (const f of userFeedbacks) {
          await deleteDoc(doc(db, 'feedbacks', f.id));
        }
      }

      logSecurityAction('Effacement complet et irréversible de tout l\'historique utilisateur');
      setSuccessMessage('L\'ensemble de votre historique local et cloud a été supprimé.');
      setShowGlobalConfirm(false);
      setGlobalConfirmInput('');
      loadDataStats();
    } catch (e) {
      setErrorMessage('Une erreur est survenue lors de l\'effacement global.');
    } finally {
      setLoading(false);
    }
  };

  // --- Suppression complète du compte ---
  const handleAccountDeletion = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (accountConfirmInput !== currentUser.email) {
      alert('L\'adresse e-mail saisie ne correspond pas à votre compte.');
      return;
    }

    setLoading(true);
    try {
      // 1. Purge locale (IndexedDB / localStorage)
      const videos = await getVideos();
      for (const v of videos) {
        await deleteVideo(v.id);
      }
      localStorage.clear();

      // 2. Suppression de Firestore /users/{userId}
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // 3. Suppression de tous les feedbacks de cet utilisateur
      for (const f of userFeedbacks) {
        await deleteDoc(doc(db, 'feedbacks', f.id));
      }

      logSecurityAction('Suppression définitive du compte utilisateur et de toutes ses données associées');
      
      // 4. Supprimer le compte Firebase Auth
      await deleteUser(currentUser);
      
      alert('Votre compte et l\'intégralité de vos données associées ont été définitivement supprimés.');
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        setErrorMessage('Sécurité : Vous devez vous déconnecter puis vous reconnecter pour confirmer la suppression de votre compte.');
      } else {
        setErrorMessage('La suppression de compte a échoué. Veuillez vous reconnecter et réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-black/5 overflow-hidden"
      >
        {/* Entête */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#FF4D00]/10 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-[#FF4D00]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Mes données & Confidentialité</h2>
              <p className="text-xs text-black/40">Gérez, exportez ou effacez vos données à votre convenance</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/50 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        <div className="shrink-0 mt-2">
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMessage}
              </span>
              <button onClick={() => setSuccessMessage(null)} className="font-bold hover:opacity-80">✕</button>
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMessage}
              </span>
              <button onClick={() => setErrorMessage(null)} className="font-bold hover:opacity-80">✕</button>
            </div>
          )}
        </div>

        {/* Corps - Double Grille Déroulable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 py-4">
          
          {/* Section 1 : Chiffres clés (Transparence) */}
          <div>
            <h3 className="text-xs font-bold tracking-wider text-black/40 uppercase mb-3">Statistiques de stockage (Transparence)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/5 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-black/40">Volume total</span>
                <span className="text-lg font-bold text-gray-900 mt-2 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-[#FF4D00]" /> {storedVolume}
                </span>
                <span className="text-[9px] text-black/50 mt-1">Stokage local (IndexedDB)</span>
              </div>
              
              <div className="bg-black/5 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-black/40">Projets vidéos</span>
                <span className="text-lg font-bold text-gray-900 mt-2">
                  {localProjectsCount} fichier(s)
                </span>
                <span className="text-[9px] text-black/50 mt-1">Conservés sur l'appareil</span>
              </div>

              <div className="bg-black/5 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-black/40">Feedbacks envoyés</span>
                <span className="text-lg font-bold text-gray-900 mt-2">
                  {feedbacksCount} rapport(s)
                </span>
                <span className="text-[9px] text-black/50 mt-1">Sauvegardés dans Firestore</span>
              </div>

              <div className="bg-black/5 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-black/40">Dernière activité</span>
                <span className="text-xs font-bold text-gray-800 mt-2 truncate">
                  {lastActivity}
                </span>
                <span className="text-[9px] text-black/50 mt-1">Date d'écritures</span>
              </div>
            </div>
          </div>

          {/* Section 2 : Export & Outils externes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-black/5 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-black/60" /> Exporter mes données
              </h4>
              <p className="text-xs text-black/60 leading-relaxed">
                Téléchargez une copie locale de l'ensemble de vos données, y compris l'historique complet, les métadonnées et vos rapports de feedback rédigés.
              </p>
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleExportJSON}
                  className="flex-1 py-2 px-3 bg-black text-white hover:bg-black/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FileJson className="w-3.5 h-3.5" /> Exporter en JSON
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="flex-1 py-2 px-3 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold text-gray-900 transition-all flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Exporter en CSV
                </button>
              </div>
            </div>

            {/* Auto Nettoyage */}
            <div className="border border-black/5 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-black/60" /> Nettoyage & Rétention des fichiers
                </h4>
                <p className="text-xs text-black/60 leading-relaxed mt-1">
                  Les fichiers temporaires de traitement vidéo sur le serveur sont <b>automatiquement détruits après 1 heure</b>. En local, configurez l'auto-suppression de vos projets obsolètes.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-black/5">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoCleanupEnabled}
                    onChange={(e) => handleToggleAutoCleanup(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF4D00] border-gray-300 focus:ring-[#FF4D00]"
                  />
                  Auto-nettoyage local (21 jours)
                </label>
                <button 
                  onClick={handleManualPrune}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-all"
                >
                  Nettoyer ≥ 21j maintenant
                </button>
              </div>
            </div>
          </div>

          {/* Section 3 : Gestion Individuelle de Données */}
          <div className="border border-black/5 rounded-2xl p-4">
            <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-500" /> Éléments individuels à supprimer
            </h4>
            
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
              
              {/* Projets locaux */}
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-2">Vidéos de projets localisés ({localVideos.length})</span>
                {localVideos.length === 0 ? (
                  <p className="text-xs text-black/40 italic">Aucun fichier projet stocké sur l'appareil.</p>
                ) : (
                  <div className="space-y-2">
                    {localVideos.map(v => (
                      <div key={v.id} className="bg-black/[0.02] border border-black/5 p-2 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="truncate">
                          <p className="font-bold text-gray-800 truncate">{v.name}</p>
                          <p className="text-[10px] text-black/40 block mt-0.5">Langue: {v.language} • {new Date(v.date).toLocaleDateString()}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteLocalProject(v.id, v.name)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors shrink-0"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedbacks de l'utilisateur */}
              {auth.currentUser && (
                <div className="border-t border-black/5 pt-3">
                  <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-2">Feedbacks & Rapports envoyés ({userFeedbacks.length})</span>
                  {userFeedbacks.length === 0 ? (
                    <p className="text-xs text-black/40 italic">Aucun rapport soumis depuis cette session.</p>
                  ) : (
                    <div className="space-y-2">
                      {userFeedbacks.map(f => (
                        <div key={f.id} className="bg-black/[0.02] border border-black/5 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="truncate">
                            <p className="font-semibold text-gray-800 truncate">{f.message}</p>
                            <p className="text-[10px] text-black/40 block mt-0.5">Note: {f.rating}/5 • Statut: {f.status}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteFeedback(f.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors shrink-0"
                            title="Supprimer du cloud"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 4 : Journaux de Sécurité & Audit d'actions */}
          <div className="border border-black/5 rounded-2xl p-4">
            <h4 className="font-bold text-sm text-[#141414] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Journal d'Audit de Sécurité
            </h4>
            <p className="text-xs text-black/50 mb-3">
              Historique des 30 dernières actions critiques liées à vos données personnelles et confidentialité sur EcoSub AI.
            </p>
            <div className="bg-black/[0.02] rounded-xl p-3 max-h-[120px] overflow-y-auto font-mono text-[10px] text-black/60 space-y-1.5">
              {securityLogs.length === 0 ? (
                <div className="text-center py-2 italic text-black/40">Aucune action journalisée à ce jour.</div>
              ) : (
                securityLogs.map(log => (
                  <div key={log.id} className="flex justify-between items-start gap-4 hover:bg-black/5 p-1 rounded transition-colors">
                    <span className="text-emerald-700 font-bold shrink-0">[OK]</span>
                    <span className="flex-1 font-sans text-gray-700 font-normal">{log.action}</span>
                    <span className="text-black/40 shrink-0">{new Date(log.date).toLocaleTimeString('fr-FR')}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 5 : Actions de destruction complexes */}
          <div className="bg-rose-50/50 border border-rose-200/60 rounded-3xl p-5 md:p-6 space-y-4">
            <div>
              <h4 className="font-bold text-sm text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4.5 h-4.5" /> Zone de danger critique
              </h4>
              <p className="text-xs text-rose-900 leading-relaxed mt-1">
                Les actions suivantes sont définitives, irréversibles et entrainent l'effacement total immédiat des fichiers et historiques de l'application EcoSub AI.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Effacer l'historique global */}
              <button 
                onClick={() => setShowGlobalConfirm(true)}
                className="flex-1 py-3 px-4 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Effacer tout l'historique
              </button>

              {/* Supprimer le compte */}
              {auth.currentUser && (
                <button 
                  onClick={() => setShowAccountDeleteConfirm(true)}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" /> Supprimer mon compte
                </button>
              )}
            </div>

            {/* Bloc de Confirmation Effacement Global */}
            <AnimatePresence>
              {showGlobalConfirm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-rose-200/50 pt-4 space-y-3"
                >
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs leading-relaxed">
                    <strong>Attention :</strong> Cela va effacer toutes les vidéos sauvegardées en local (IndexedDB), vos configurations de clés privées, et purger votre historique Firestore. Vos limites Glissantes de sécurité restent actives 24h pour contrer les abus.
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full">
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5">Saisissez « EFFACER » pour confirmer la destruction :</p>
                      <input 
                        type="text" 
                        value={globalConfirmInput}
                        onChange={(e) => setGlobalConfirmInput(e.target.value)}
                        placeholder="EFFACER"
                        className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs focus:ring-rose-500 focus:border-rose-500"
                      />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                      <button 
                        onClick={handleGlobalReset}
                        disabled={globalConfirmInput !== 'EFFACER' || loading}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Destruction...' : 'Confirmer l\'effacement'}
                      </button>
                      <button 
                        onClick={() => {
                          setShowGlobalConfirm(false);
                          setGlobalConfirmInput('');
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold text-gray-700 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bloc de Confirmation Suppression De Compte */}
            <AnimatePresence>
              {showAccountDeleteConfirm && auth.currentUser && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-rose-200/50 pt-4 space-y-3"
                >
                  <div className="bg-red-50 border border-red-200 text-red-900 p-3.5 rounded-xl text-xs leading-relaxed">
                    <strong>Destruction Irréversible de Compte :</strong> Cette action résilie instantanément votre accès à EcoSub AI. Votre historique Firestore `/users/${auth.currentUser.uid}` et vos feedbacks seront supprimés de manière sécurisée et totale de tous nos serveurs de stockage.
                  </div>
                  <div className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="w-full">
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5">Saisissez votre e-mail pour confirmer la suppression :</p>
                      <input 
                        type="email" 
                        value={accountConfirmInput}
                        onChange={(e) => setAccountConfirmInput(e.target.value)}
                        placeholder={auth.currentUser.email || ''}
                        className="w-full bg-white border border-red-300 rounded-xl px-3 py-2 text-xs focus:ring-red-500 focus:border-red-500 font-mono"
                      />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <button 
                        onClick={handleAccountDeletion}
                        disabled={accountConfirmInput !== auth.currentUser.email || loading}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-red-700 text-white font-bold text-xs rounded-xl hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Résililation...' : 'Supprimer Définitivement'}
                      </button>
                      <button 
                        onClick={() => {
                          setShowAccountDeleteConfirm(false);
                          setAccountConfirmInput('');
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold text-gray-700 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-black/5 flex items-center justify-between gap-4 shrink-0 mt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-black/40 bg-black/5 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> RGPD & Protection des données respectés
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 transition-all shrink-0 cursor-pointer"
          >
            Fermer l'espace
          </button>
        </div>
      </motion.div>
    </div>
  );
}
