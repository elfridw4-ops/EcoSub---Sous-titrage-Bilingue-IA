import React, { useState, useRef, useEffect } from 'react';
import { Upload, Video, CheckCircle, Loader2, Download, Languages, Play, Key, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { auth, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const ADMIN_EMAIL = 'elfridw4@gmail.com';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [subtitleMode, setSubtitleMode] = useState<'bilingual' | 'original' | 'translation'>('bilingual');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const activeApiKey = isAdmin ? (process.env.GEMINI_API_KEY || apiKey) : apiKey;

  // Persist API Key
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setResultUrl(null);
      setError(null);
    }
  };

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
      setError("Veuillez entrer votre clé API Gemini pour continuer.");
      return;
    }

    try {
      setStatus('uploading');
      setError(null);

      // 1. Upload to server
      const formData = new FormData();
      formData.append('video', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        let errorMessage = 'Upload failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = `${uploadRes.status} ${uploadRes.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const { filename } = await uploadRes.json();

      // 2. Transcription & Translation via Gemini
      setStatus('processing');
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      const base64Data = await fileToBase64(file);

      const prompt = `
        Analyze this video. 
        1. Detect if the language is English or French.
        2. Transcribe the audio in its original language with precise timestamps.
        3. Translate each segment into the other language (EN -> FR or FR -> EN).
        4. Return ONLY a JSON array of objects with this structure:
           [{"start": number, "end": number, "original": string, "translated": string}]
        The 'start' and 'end' should be in seconds.
      `;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type || 'video/mp4',
              data: base64Data
            }
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      let rawSegments;
      try {
        rawSegments = JSON.parse(geminiResponse.text || '[]');
      } catch (e) {
        console.error('Gemini JSON parse error:', geminiResponse.text);
        throw new Error('Erreur lors de la lecture de la transcription IA. Vérifiez votre clé API.');
      }
      
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
        body: JSON.stringify({ filename, segments }),
      });

      if (!burnRes.ok) {
        const errorText = await burnRes.text();
        let errorMessage = 'Subtitle burning failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = `${burnRes.status} ${burnRes.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const { downloadUrl } = await burnRes.json();

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
                    {/* API Key Input - Only show if not admin */}
                    {!isAdmin && (
                      <div className="flex flex-col gap-2 text-left">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Clé API Gemini</label>
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
                      </div>
                    )}

                    {isAdmin && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 text-left">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle className="text-white w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-900">Mode Administrateur Activé</p>
                          <p className="text-[10px] text-emerald-700">Votre clé API système est utilisée automatiquement.</p>
                        </div>
                      </div>
                    )}

                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-black/10 rounded-2xl p-8 sm:p-12 cursor-pointer hover:border-[#FF4D00]/30 transition-colors group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="video/*"
                      />
                      <Upload className="w-12 h-12 mx-auto mb-4 text-black/20 group-hover:text-[#FF4D00] transition-colors" />
                      <p className="text-xs font-medium">
                        {file ? file.name : "Cliquez pour choisir une vidéo"}
                      </p>
                      <p className="text-xs text-black/40 mt-2">MP4, MOV, AVI (Max 100MB)</p>
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
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-black/5 p-8 text-center text-xs text-black/30 uppercase tracking-[0.2em]">
        Propulsé par Google Gemini & FFmpeg • 2024 EcoSub AI
      </footer>
    </div>
  );
}
