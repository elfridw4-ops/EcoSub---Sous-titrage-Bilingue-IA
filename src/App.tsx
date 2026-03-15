import React, { useState, useRef, useEffect } from 'react';
import { Upload, Video, CheckCircle, Loader2, Download, Languages, Play, Key, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';

const ADMIN_EMAIL = 'elfridw4@gmail.com';
const DAILY_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [useDynamicEmojis, setUseDynamicEmojis] = useState(true);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [subtitleMode, setSubtitleMode] = useState<'bilingual' | 'original' | 'translation'>('bilingual');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [usage, setUsage] = useState<{ generations: string[], history?: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Usage listener
  useEffect(() => {
    if (!user) {
      setUsage(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUsage(docSnap.data() as { generations: string[], history?: any[] });
      } else {
        // Initialize user doc if it doesn't exist
        setDoc(userRef, { generations: [], history: [], email: user.email });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const isAdmin = user?.email === ADMIN_EMAIL;
  
  // Logic: All authenticated users get to use the system key, but limited.
  // Unauthenticated users must provide their own key (or login).
  const canUseSystemKey = !!user;
  const activeApiKey = (canUseSystemKey && process.env.GEMINI_API_KEY) ? process.env.GEMINI_API_KEY : apiKey;

  const getRecentGenerations = () => {
    if (!usage) return [];
    const now = Date.now();
    return usage.generations.filter(ts => (now - new Date(ts).getTime()) < WINDOW_MS);
  };

  const recentGenerations = getRecentGenerations();
  const remainingCredits = isAdmin ? Infinity : Math.max(0, DAILY_LIMIT - recentGenerations.length);
  const isLimitReached = !isAdmin && remainingCredits <= 0;

  const getWaitTime = () => {
    if (recentGenerations.length === 0) return null;
    const oldestTs = new Date(recentGenerations[0]).getTime();
    const nextAvailable = oldestTs + WINDOW_MS;
    const diff = nextAvailable - Date.now();
    if (diff <= 0) return "Maintenant";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Persist API Key
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setResultUrl(null);
      setError(null);
    }
  };

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setRefFile(selectedFile);
      setRefPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Cleanup previews
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (refPreview) URL.revokeObjectURL(refPreview);
    };
  }, [filePreview, refPreview]);

  const downloadFile = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EcoSub_${file?.name || 'video.mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback
      window.open(resultUrl, '_blank');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processVideo = async () => {
    if (!file) return;
    
    if (!activeApiKey) {
      setError("Veuillez vous connecter ou entrer votre clé API Gemini pour continuer.");
      return;
    }

    if (isLimitReached) {
      setError(`Limite atteinte. Prochain crédit disponible dans ${getWaitTime()}.`);
      return;
    }

    try {
      setStatus('uploading');
      setError(null);

      // 1. Upload to server
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("Le fichier est trop volumineux (max 50 Mo pour le moment).");
      }

      const formData = new FormData();
      formData.append('video', file);
      if (refFile) {
        formData.append('reference', refFile);
      }

      const uploadRes = await fetch('/api/upload-multi', {
        method: 'POST',
        body: formData,
      });

      const uploadText = await uploadRes.text();

      if (!uploadRes.ok) {
        if (uploadText.includes('Cookie check') || uploadText.includes('Authenticate in new window')) {
          throw new Error("Votre navigateur bloque les cookies de sécurité. Veuillez ouvrir l'application dans un nouvel onglet ou autoriser les cookies tiers.");
        }
        throw new Error(`Le téléchargement a échoué (${uploadRes.status}): ${uploadText.slice(0, 100)}`);
      }
      
      let uploadData;
      try {
        uploadData = JSON.parse(uploadText);
      } catch (e) {
        if (uploadText.includes('Cookie check') || uploadText.includes('Authenticate in new window')) {
          throw new Error("Problème de cookies de sécurité. Veuillez ouvrir l'application dans un nouvel onglet (bouton en haut à droite) pour corriger cela.");
        }
        console.error('Upload JSON parse error. Received:', uploadText);
        throw new Error('Le serveur a renvoyé une réponse invalide (pas du JSON).');
      }
      const { filename } = uploadData;

      // 2. Transcription & Translation via Gemini
      setStatus('processing');
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const base64Data = await fileToBase64(file);
      
      let refBase64 = null;
      if (refFile) {
        refBase64 = await fileToBase64(refFile);
      }

      const prompt = `
        Analyze the videos provided.
        ${refFile ? "The first video is the TARGET video. The second video is the REFERENCE video." : "The provided video is the TARGET video."}
        
        TASKS:
        1. Detect if the language in the TARGET video is English or French.
        2. Transcribe the audio in its original language with precise timestamps.
        3. Translate each segment into the other language (EN -> FR or FR -> EN).
        ${useDynamicEmojis ? "4. Add 1 to 3 highly relevant and expressive emojis (e.g., 😂, 😭, 😞, 😌, 🤣, 😒, 🔥, 💀, ✊, 💸, ❣️, 💔, 🙃, 👏, 🙄, 🤛, 😮, 😦, 🤔, 🥳, 👆, 😁, 🎉, 😍, 🤩, 😱, 😛, 🤪, 🥺, 🥱, 😡, 🤨, 🤯, 🤡, 😈, 👽, 💯, 👀, 👄, 👅, 🫀, 🧠, 🫁, 👎, 👂, 💪, 🤞, ✌️, 🤝, 🖕, 🙏, 🌻, 🌼, 🌪️, 🌈, 🌟, 🌍, 🥒, 🍑, 🚧, 🚨, ✈️, 🚢, 🚘) at the end of each segment. The emojis MUST perfectly match the emotion, tone, and specific keywords of the phrase to make it more engaging." : ""}
        ${refFile ? "5. Analyze the visual style of subtitles in the REFERENCE video (font color, background, position, size). Return a 'style' object with these properties: primaryColor (hex), outlineColor (hex), fontSize (number), alignment (1-9, where 2 is bottom center)." : ""}
        
        Return ONLY a JSON object with this structure:
        {
          "segments": [{"start": number, "end": number, "original": string, "translated": string}],
          "style": { "primaryColor": "string", "outlineColor": "string", "fontSize": number, "alignment": number },
          "detectedLanguage": "string"
        }
        The 'start' and 'end' should be in seconds.
      `;

      const contents: any[] = [{ text: prompt }];
      
      // Target Video
      contents.push({
        inlineData: {
          mimeType: file.type || 'video/mp4',
          data: base64Data
        }
      });

      // Reference Video
      if (refBase64) {
        contents.push({
          inlineData: {
            mimeType: refFile?.type || 'video/mp4',
            data: refBase64
          }
        });
      }

      let geminiResponse;
      try {
        geminiResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts: contents },
          config: {
            responseMimeType: 'application/json'
          }
        });
      } catch (geminiErr: any) {
        console.error('Gemini API Error:', geminiErr);
        const msg = geminiErr.message || '';
        if (msg.includes('API_KEY_INVALID') || msg.includes('invalid') || msg.includes('key')) {
          throw new Error('Clé API invalide ou expirée. Veuillez vérifier votre clé Gemini.');
        } else if (msg.includes('quota') || msg.includes('429')) {
          throw new Error('Quota dépassé. Veuillez réessayer plus tard ou utiliser votre propre clé API.');
        }
        throw new Error(`Erreur Gemini: ${msg}`);
      }

      let aiResult;
      try {
        aiResult = JSON.parse(geminiResponse.text || '{}');
      } catch (e) {
        console.error('Gemini JSON parse error:', geminiResponse.text);
        throw new Error('L\'IA a renvoyé un format invalide. Veuillez réessayer.');
      }
      
      const rawSegments = aiResult.segments || [];
      const inferredStyle = aiResult.style || null;
      const detectedLanguage = aiResult.detectedLanguage || 'Inconnu';

      // Filter segments based on selected mode
      const segments = rawSegments.map((seg: any) => {
        if (subtitleMode === 'original') return { ...seg, translated: '' };
        if (subtitleMode === 'translation') return { ...seg, original: seg.translated, translated: '' };
        return seg;
      });

      // 3. Burn Subtitles (Backend)
      const burnRes = await fetch('/api/burn-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, segments, style: inferredStyle }),
      });

    if (!burnRes.ok) {
      const errorText = await burnRes.text();
      let errorMessage = 'Subtitle burning failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = `Erreur ${burnRes.status}: ${errorText.slice(0, 100)}`;
      }
      throw new Error(errorMessage);
    }
    
    let burnData;
    const burnText = await burnRes.text();
    try {
      burnData = JSON.parse(burnText);
    } catch (e) {
      console.error('Burn JSON parse error. Received:', burnText);
      throw new Error('Le serveur a renvoyé une réponse invalide après le traitement.');
    }
    const { downloadUrl } = burnData;

      // 4. Update usage and history in Firestore
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const historyItem = {
          videoName: file.name,
          date: new Date().toISOString(),
          language: detectedLanguage,
          mode: subtitleMode
        };
        
        if (isAdmin) {
          await updateDoc(userRef, {
            history: arrayUnion(historyItem)
          });
        } else {
          await updateDoc(userRef, {
            generations: arrayUnion(new Date().toISOString()),
            history: arrayUnion(historyItem)
          });
        }
      }

      setResultUrl(downloadUrl);
      setStatus('done');
    } catch (err) {
      console.error('Process error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#141414] font-sans">
      {/* Header */}
      <header className="border-b border-black/5 p-4 sm:p-6 flex justify-between items-center sticky top-0 bg-[#FDFCFB]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF4D00] rounded-full flex items-center justify-center">
            <Languages className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-lg sm:xl font-bold tracking-tight">EcoSub <span className="font-light italic">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          {!isAuthLoading && (
            user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Connecté en tant que</p>
                  <p className="text-xs font-medium">{user.displayName || user.email}</p>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-black/5" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                    <User className="w-4 h-4 text-black/40" />
                  </div>
                )}
                <button 
                  onClick={logout}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40 hover:text-[#FF4D00]"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-medium hover:bg-black/80 transition-colors"
              >
                <LogIn className="w-3 h-3" />
                Connexion
              </button>
            )
          )}
          <div className="text-xs uppercase tracking-widest opacity-50 font-mono hidden md:block">
            v1.0
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8 pt-8 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Info */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.1] tracking-tighter">
              Donnez une voix <br />
              <span className="text-[#FF4D00]">bilingue</span> à vos vidéos.
            </h2>
            <p className="text-base sm:text-lg text-black/60 leading-relaxed">
              Téléchargez votre vidéo en français ou anglais. Notre IA détecte la langue, transcrit et traduit instantanément avec un style bilingue élégant.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3 text-xs font-medium">
                <CheckCircle className="w-5 h-5 text-[#FF4D00]" />
                <span>Détection automatique FR/EN</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <CheckCircle className="w-5 h-5 text-[#FF4D00]" />
                <span>Sous-titres incrustés (Burn-in)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <CheckCircle className="w-5 h-5 text-[#FF4D00]" />
                <span>Design bilingue parallèle</span>
              </div>
            </div>
          </div>

          {/* Right Column: Action */}
          <div className="lg:col-span-7">
            <motion.div 
              layout
              className="bg-white border border-black/10 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/5 min-h-[400px] flex flex-col justify-center"
            >
              <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center space-y-6"
                  >
                    {/* Usage Info for Authenticated Users */}
                    {user && !isAdmin && (
                      <div className="bg-black/5 rounded-2xl p-5 flex flex-col gap-3 text-left border border-black/5">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Utilisation de l'IA</p>
                            <h4 className="text-sm font-bold">Crédits Quotidiens</h4>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${remainingCredits > 0 ? 'text-emerald-600' : 'text-[#FF4D00]'}`}>
                              {remainingCredits}
                            </span>
                            <span className="text-xs text-black/40 font-medium"> / {DAILY_LIMIT}</span>
                          </div>
                        </div>
                        
                        <div className="relative w-full bg-black/10 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(remainingCredits / DAILY_LIMIT) * 100}%` }}
                            className={`h-full transition-all duration-1000 ${remainingCredits > 0 ? 'bg-emerald-500' : 'bg-[#FF4D00]'}`}
                          />
                        </div>

                        {isLimitReached ? (
                          <div className="flex items-center gap-2 text-[#FF4D00] bg-[#FF4D00]/5 p-3 rounded-xl border border-[#FF4D00]/10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <p className="text-[11px] font-medium leading-tight">
                              Limite atteinte. <br />
                              <span className="font-bold">Prochain crédit disponible dans {getWaitTime()}</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-black/40 italic">
                            Chaque génération consomme 1 crédit. Recharge automatique après 24h.
                          </p>
                        )}
                      </div>
                    )}

                    {/* API Key Input - Only show if NOT logged in */}
                    {!user && (
                      <div className="space-y-4">
                        <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/10 rounded-2xl p-5 text-left space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#FF4D00] rounded-full flex items-center justify-center shrink-0">
                              <LogIn className="text-white w-4 h-4" />
                            </div>
                            <p className="text-xs font-bold text-[#FF4D00]">Utilisez l'IA Gratuitement</p>
                          </div>
                          <p className="text-[11px] text-black/60 leading-relaxed">
                            Connectez-vous avec Google pour profiter de 3 générations gratuites par jour sans avoir besoin de clé API.
                          </p>
                          <button 
                            onClick={signInWithGoogle}
                            className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 transition-all active:scale-[0.98]"
                          >
                            Se connecter avec Google
                          </button>
                        </div>

                        <div className="relative flex items-center py-2">
                          <div className="flex-grow border-t border-black/5"></div>
                          <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-black/20">OU</span>
                          <div className="flex-grow border-t border-black/5"></div>
                        </div>

                        <div className="flex flex-col gap-2 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Utiliser ma propre clé API</label>
                            <a 
                              href="https://aistudio.google.com/app/apikey" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#FF4D00] hover:underline font-bold"
                            >
                              Obtenir une clé
                            </a>
                          </div>
                          <div className="relative">
                            <input 
                              type="password"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="Collez votre clé API ici..."
                              className="w-full px-4 py-3 bg-black/5 border border-black/5 rounded-xl text-xs focus:outline-none focus:border-[#FF4D00]/30 transition-colors"
                            />
                            <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                          </div>
                          {apiKey && (
                            <p className="text-[9px] text-emerald-600 font-bold mt-1">✓ Utilisation de votre clé API personnelle (Illimité)</p>
                          )}
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 text-left">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle className="text-white w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-900">Mode Administrateur Activé</p>
                          <p className="text-[10px] text-emerald-700">Utilisation illimitée avec la clé système.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-black/10 rounded-2xl p-4 cursor-pointer hover:border-[#FF4D00]/30 transition-colors group flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[160px]"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept="video/*"
                        />
                        {filePreview ? (
                          <div className="absolute inset-0 bg-black">
                            <video src={filePreview} className="w-full h-full object-cover opacity-60" muted />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/20">
                              <Play className="w-6 h-6 text-white mb-1" />
                              <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate max-w-full">
                                {file?.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-black/20 group-hover:text-[#FF4D00] transition-colors" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Vidéo Cible</p>
                            <p className="text-[10px] font-medium text-black/20">Choisir la vidéo</p>
                          </>
                        )}
                      </div>

                      <div 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'video/*';
                          input.onchange = handleRefFileChange;
                          input.click();
                        }}
                        className={`border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-colors group flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[160px] ${
                          refFile ? 'border-[#FF4D00]/30 bg-[#FF4D00]/5' : 'border-black/10 hover:border-black/30'
                        }`}
                      >
                        {refPreview ? (
                          <div className="absolute inset-0 bg-black">
                            <video src={refPreview} className="w-full h-full object-cover opacity-60" muted />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/20">
                              <Video className="w-6 h-6 text-white mb-1" />
                              <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate max-w-full">
                                {refFile?.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Video className={`w-8 h-8 mb-2 transition-colors ${refFile ? 'text-[#FF4D00]' : 'text-black/20 group-hover:text-black/40'}`} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Vidéo Référence</p>
                            <p className="text-[10px] font-medium text-black/20">Copier le style</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Emojis Toggle */}
                    <div className="flex items-center justify-between bg-black/5 p-4 rounded-xl border border-black/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${useDynamicEmojis ? 'bg-[#FF4D00] text-white' : 'bg-black/10 text-black/40'}`}>
                          <span className="text-sm">✨</span>
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold">Emojis Expressifs ✨</p>
                          <p className="text-[10px] text-black/40">Ajoute des emojis réels (😂, 😭, 🔥) qui correspondent au sens des mots</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setUseDynamicEmojis(!useDynamicEmojis)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${useDynamicEmojis ? 'bg-[#FF4D00]' : 'bg-black/20'}`}
                      >
                        <motion.div 
                          animate={{ x: useDynamicEmojis ? 24 : 4 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    {/* Subtitle Mode Selection */}
                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40 text-left">Mode de sous-titrage</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'bilingual', label: 'Bilingue' },
                          { id: 'original', label: 'Original' },
                          { id: 'translation', label: 'Traduction' }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => setSubtitleMode(mode.id as any)}
                            className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg border transition-all ${
                              subtitleMode === mode.id 
                                ? 'bg-[#FF4D00] border-[#FF4D00] text-white' 
                                : 'bg-white border-black/10 text-black/60 hover:border-black/30'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={!file}
                      onClick={processVideo}
                      className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                        file ? 'bg-[#FF4D00] hover:bg-[#E64500]' : 'bg-black/10 cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-5 h-5" />
                      Générer les sous-titres
                    </button>
                  </motion.div>
                )}

                {(status === 'uploading' || status === 'processing') && (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-6"
                  >
                    <div className="relative w-24 h-24 mx-auto">
                      <Loader2 className="w-full h-full text-[#FF4D00] animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-8 h-8 text-black/20" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {status === 'uploading' ? 'Téléchargement...' : 'Analyse & Incrustation...'}
                      </h3>
                      <p className="text-xs text-black/40 mt-2">
                        {status === 'processing' ? 'Notre IA travaille sur votre vidéo. Cela peut prendre une minute.' : 'Veuillez patienter.'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {status === 'done' && resultUrl && (
                  <motion.div 
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="rounded-2xl overflow-hidden border border-black/10 bg-black aspect-video flex items-center justify-center">
                      <video 
                        src={resultUrl} 
                        controls 
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={downloadFile}
                        className="flex-1 bg-[#FF4D00] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#E64500] transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        Télécharger
                      </button>
                      <button 
                        onClick={() => {
                          setStatus('idle');
                          setFile(null);
                          setResultUrl(null);
                        }}
                        className="px-6 py-4 border border-black/10 rounded-xl font-bold hover:bg-black/5 transition-colors"
                      >
                        Recommencer
                      </button>
                    </div>
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div 
                    key="error"
                    className="text-center space-y-6"
                  >
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 rotate-45" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-600">Oups !</h3>
                      <p className="text-sm text-black/60 mt-2">{error}</p>
                      {error?.includes("onglet") && (
                        <button 
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="mt-4 px-4 py-2 bg-[#FF4D00] text-white text-xs font-bold rounded-lg hover:bg-[#E64500] transition-colors"
                        >
                          Ouvrir dans un nouvel onglet
                        </button>
                      )}
                      {(error?.toLowerCase().includes('clé') || error?.toLowerCase().includes('api')) && (
                        <div className="mt-4 p-4 bg-black/5 rounded-xl border border-black/5">
                          <p className="text-[11px] text-black/40 mb-2">Besoin d'une nouvelle clé ?</p>
                          <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-[#FF4D00] hover:underline"
                          >
                            <Key className="w-3 h-3" />
                            Obtenir une clé Gemini gratuite
                          </a>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setStatus('idle')}
                      className="w-full py-4 bg-black text-white rounded-xl font-bold"
                    >
                      Réessayer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* History Section */}
        {user && usage?.history && usage.history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Video className="w-5 h-5 text-[#FF4D00]" />
                Historique des Générations
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                {usage.history.length} vidéo{usage.history.length > 1 ? 's' : ''} traitée{usage.history.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...usage.history].reverse().map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-black/5 p-4 rounded-2xl flex items-start gap-4 hover:shadow-lg hover:shadow-black/5 transition-all"
                >
                  <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-black/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.videoName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-black/40 flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        {item.language}
                      </span>
                      <span className="text-[10px] text-black/40">
                        {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-tighter bg-black/5 px-2 py-1 rounded text-black/40">
                      {item.mode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-black/5 p-8 text-center text-[10px] text-black/30 uppercase tracking-[0.2em] space-y-2">
        <p>Propulsé par Google Gemini & FFmpeg • 2026 EcoSub AI</p>
        <p className="font-bold">Created by Horacio CHINKOUN</p>
      </footer>
    </div>
  );
}
