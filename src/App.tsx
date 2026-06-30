import React, { useState, useRef, useEffect, Component } from 'react';
import { Upload, Video, CheckCircle, Loader2, Download, Languages, Play, Key, LogIn, LogOut, User, HelpCircle, ChevronRight, ChevronLeft, X, Sparkles, MousePointer2, AlertCircle, AlertTriangle, ExternalLink, ArrowRight, Palette, Type, AlignCenter, Settings2, Trash2, History, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { handleAppError, AppError, ErrorType } from './utils/errors';
import { saveVideo, getVideos, deleteVideo, StoredVideo } from './utils/storage';
import { VersionManager } from './components/VersionManager';
import { PwaInstallButton } from './components/PwaInstallButton';
import { ChangelogModal } from './components/ChangelogModal';
import { CURRENT_VERSION } from './data/versions';
import { FeedbackButton } from './components/FeedbackButton';
import { MyDataModal } from './components/MyDataModal';
import { ApiKeyConfig } from './components/ApiKeyConfig';
import { StyleEditor } from './components/StyleEditor';
import LandingPage from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { SubtitleStyle, PRESET_STYLES } from './utils/styles';
import { LegalModal } from './components/legal/LegalModal';
import { LegalDocumentId } from './components/legal/legalContent';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot, collection, getDocs, increment } from 'firebase/firestore';
import { useExitAppPrompt, useModalBackHandler } from './lib/navigation';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`Firestore Error [${operationType}] on [${path}]:`, err);
  
  // We don't want to show every Firestore error as a blocking app error 
  // unless it's critical (like permission denied on user profile)
  if (err.message.includes('permission-denied')) {
    // This is often a session issue in iframes
    console.warn("Permission denied detected. This might be a session/cookie issue.");
  }
}

class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Une erreur inattendue est survenue.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error && parsed.error.includes('permissions')) {
          message = "Erreur de permission Firestore. Veuillez contacter l'administrateur.";
        }
      } catch (e) {
        message = this.state.error?.message || message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 border border-black/5">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Oups ! Quelque chose a mal tourné</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const ADMIN_EMAIL = 'elfridw4@gmail.com';
const DAILY_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [subtitleMode, setSubtitleMode] = useState<'bilingual' | 'original' | 'translation'>('bilingual');
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [customStyle, setCustomStyle] = useState<SubtitleStyle>(PRESET_STYLES.default.style);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [saveApiKey, setSaveApiKey] = useState<boolean>(() => localStorage.getItem('save_gemini_key') !== 'false');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [appError, setAppError] = useState<AppError | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [usage, setUsage] = useState<{ generations: string[], history?: any[] } | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [showAdminDash, setShowAdminDash] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('has_seen_landing'));
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(() => !localStorage.getItem('gemini_api_key'));
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [storedVideos, setStoredVideos] = useState<StoredVideo[]>([]);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [isDraggingRef, setIsDraggingRef] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);
  
  // État d'affichage de l'historique complet des notes de version (Changelog)
  const [showVersionsHistory, setShowVersionsHistory] = useState(false);
  const [showMyData, setShowMyData] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocumentId | null>(null);
  
  // Handlers pour le bouton de retour matériel (Android) / gestes PWA
  const { showExitPrompt } = useExitAppPrompt();
  useModalBackHandler(showAdminDash, () => setShowAdminDash(false), 'admin-dash');
  useModalBackHandler(showStyleEditor, () => setShowStyleEditor(false), 'style-editor');
  useModalBackHandler(showApiKeyConfig, () => setShowApiKeyConfig(false), 'api-key-config');
  
  // Répérage de la présence au sein d'une Iframe
  const isIframe = window.self !== window.top;

  // Initialisation de l'état bloquant pour les cookies tiers requis par les requêtes Iframe
  const [iframeCookieBlocked, setIframeCookieBlocked] = useState(false);

  // Vérification silencieuse et proactive de la répertorisation des cookies tiers lors du montage
  useEffect(() => {
    // Exécuter l'évaluation uniquement si nous sommes intégrés dans un iframe
    if (isIframe) {
      // Appel réseau silencieux vers notre API de santé système
      fetch('/api/health')
        .then(async (res) => {
          // Extraction du texte de la réponse brute
          const text = await res.text();
          // Si le texte de réponse contient les indicateurs typiques du challenge de redirection proxy
          if (text.includes('Cookie check') || text.includes('Authenticate in new window') || !res.ok) {
            // Activer l'affichage du panneau explicatif bloquant
            setIframeCookieBlocked(true);
          }
        })
        .catch(() => {
          // Lever l'indicateur de cookies bloqués si la requête est purement rejetée par le navigateur
          setIframeCookieBlocked(true);
        });
    }
  }, [isIframe]);

  // Auth listener
  useEffect(() => {
    console.log("Auth: Initializing listener...");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth: State changed. User:", currentUser?.email || "None");
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        setAppError(null);
      }
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
        setDoc(userRef, { generations: [], history: [], email: user.email }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  // Clear error when API key changes
  useEffect(() => {
    if (apiKey) {
      setAppError(null);
    }
  }, [apiKey]);

  const handleGoogleSignIn = async () => {
    console.log("Auth: Starting Google Sign In...");
    try {
      setAppError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Auth: Sign in failed:", err);
      const appErr = handleAppError(err);
      
      // Provide clearer message for popup blocked
      if (err.code === 'auth/popup-blocked') {
        appErr.action = "Le navigateur a bloqué le popup. Veuillez cliquer sur l'icône de blocage dans la barre d'adresse pour l'autoriser, ou ouvrez l'application dans un nouvel onglet.";
      }
      
      setAppError(appErr);
    }
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Handle Save Choice
  useEffect(() => {
    if (!saveApiKey) {
      localStorage.removeItem('gemini_api_key');
      localStorage.setItem('save_gemini_key', 'false');
    } else {
      if (apiKey) {
        localStorage.setItem('gemini_api_key', apiKey);
      }
      localStorage.setItem('save_gemini_key', 'true');
    }
  }, [saveApiKey, apiKey]);

  // Admin Data Fetcher
  useEffect(() => {
    if (!isAdmin) return;

    // Fetch all users
    const fetchAllUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((u: any) => u.email !== ADMIN_EMAIL);
        setAllUsers(users);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'users');
      }
    };

    // Listen to global stats
    const statsRef = doc(db, 'stats', 'global');
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setGlobalStats(docSnap.data());
      } else {
        setDoc(statsRef, { anonymousGenerations: 0 }).catch(e => handleFirestoreError(e, OperationType.WRITE, 'stats/global'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'stats/global');
    });

    fetchAllUsers();
    return () => unsubStats();
  }, [isAdmin]);
  
  // BYOK Architecture: Every user must provide their own key.
  const activeApiKey = apiKey;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setResultUrl(null);
      setAppError(null);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFilePreview(null);
    setAppError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setRefFile(selectedFile);
      setRefPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveRefFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefFile(null);
    setRefPreview(null);
    if (refFileInputRef.current) {
      refFileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, type: 'target' | 'ref') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'target') {
      setIsDraggingTarget(true);
    } else {
      setIsDraggingRef(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, type: 'target' | 'ref') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'target') {
      setIsDraggingTarget(false);
    } else {
      setIsDraggingRef(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'target' | 'ref') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'target') {
      setIsDraggingTarget(false);
    } else {
      setIsDraggingRef(false);
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type.startsWith('video/')) {
        if (type === 'target') {
          setFile(selectedFile);
          setFilePreview(URL.createObjectURL(selectedFile));
          setStatus('idle');
          setResultUrl(null);
          setAppError(null);
        } else {
          setRefFile(selectedFile);
          setRefPreview(URL.createObjectURL(selectedFile));
        }
      } else {
        setAppError({
          type: ErrorType.UNKNOWN,
          message: `Veuillez déposer un fichier vidéo valide pour la ${type === 'target' ? 'vidéo cible' : 'vidéo de référence'}.`,
          details: "Le fichier choisi n'est pas au format vidéo supporté (video/*)."
        });
      }
    }
  };

  const handleDeleteStoredVideo = async (id: string) => {
    try {
      await deleteVideo(id);
      const updatedVideos = await getVideos();
      setStoredVideos(updatedVideos);
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleDownloadStoredVideo = (storedVideo: StoredVideo) => {
    const url = URL.createObjectURL(storedVideo.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EcoSub_${storedVideo.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load stored videos
  useEffect(() => {
    const loadVideos = async () => {
      try {
        let videos = await getVideos();
        // Nettoyage automatique local de 21 jours si activé
        const isAutoCleanupEnabled = localStorage.getItem('auto_cleanup_21_days') === 'true';
        if (isAutoCleanupEnabled) {
          const limitTime = new Date().getTime() - 21 * 24 * 60 * 60 * 1000;
          const toDelete = videos.filter(v => new Date(v.date).getTime() < limitTime);
          if (toDelete.length > 0) {
            for (const v of toDelete) {
              await deleteVideo(v.id);
            }
            videos = await getVideos();
            console.log(`Auto-cleanup local: ${toDelete.length} projet(s) de plus de 21 jours supprimé(s).`);
          }
        }
        setStoredVideos(videos);
      } catch (err) {
        console.error('Failed to load stored videos:', err);
      }
    };
    loadVideos();
  }, []);

  // Cleanup previews and local blob URLs
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (refPreview) URL.revokeObjectURL(refPreview);
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [filePreview, refPreview, localBlobUrl]);

  const downloadFile = async () => {
    if (!resultUrl && !localBlobUrl) return;
    
    setIsDownloading(true);
    try {
      // Prioritize local blob if available
      if (localBlobUrl) {
        const a = document.createElement('a');
        a.href = localBlobUrl;
        a.download = `EcoSub_${file?.name || 'video.mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsDownloading(false);
        return;
      }

      // Fallback to fetching from server
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
      setAppError(handleAppError(err));
      // Final fallback
      if (resultUrl) window.open(resultUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./workers/fileWorker.ts', import.meta.url), { type: 'module' });
      const id = Math.random().toString(36).substring(7);
      
      worker.onmessage = (e) => {
        if (e.data.id === id) {
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(e.data.base64);
          worker.terminate();
        }
      };
      
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
      
      worker.postMessage({ file, id });
    });
  };

  const processVideo = async () => {
    if (!file) return;
    
    if (!apiKey) {
      setAppError({
        type: ErrorType.API_KEY,
        message: "Veuillez configurer votre clé API Gemini dans les paramètres pour continuer.",
        action: "Saisissez votre clé API dans le champ dédié."
      });
      return;
    }

    try {
      if (isKeyValid === false) {
        throw new Error("Clé API invalide (Erreur 401). Veuillez vérifier votre clé sur Google AI Studio.");
      }
      
      setStatus('uploading');
      setAppError(null);

      // 1. Upload to server
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("Le fichier est trop volumineux (max 50 Mo pour le moment).");
      }

      const formData = new FormData();
      formData.append('video', file);
      if (refFile) {
        formData.append('reference', refFile);
      }

      setUploadProgress(0);
      const uploadText = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload-multi');
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject({ status: xhr.status, responseText: xhr.responseText });
          }
        };

        xhr.onerror = () => {
          reject({ status: xhr.status, responseText: 'Network Error' });
        };

        xhr.send(formData);
      }).catch((err) => {
        const text = err.responseText || '';
        if (text.includes('Cookie check') || text.includes('Authenticate in new window')) {
          throw new Error("Problème de sécurité du navigateur (Cookies tiers bloqués). Veuillez ouvrir l'application dans un nouvel onglet.");
        }
        throw new Error(`Le téléchargement a échoué (${err.status}): ${text.slice(0, 100)}`);
      });
      
      let uploadData;
      try {
        uploadData = JSON.parse(uploadText);
      } catch (e) {
        if (uploadText.includes('Cookie check') || uploadText.includes('Authenticate in new window')) {
          throw new Error("Problème de sécurité du navigateur (Cookies tiers bloqués). Veuillez ouvrir l'application dans un nouvel onglet.");
        }
        console.error('Upload JSON parse error. Received:', uploadText);
        throw new Error('Le serveur a renvoyé une réponse invalide (pas du JSON).');
      }
      const { filename } = uploadData;

      // 2. Transcription & Translation via Gemini
      setStatus('processing');
      const ai = new GoogleGenAI({ apiKey: apiKey });
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
        ${refFile ? `4. Analyze the visual style of subtitles in the REFERENCE video. You MUST extract the style to make the TARGET video's subtitles STRICTLY IDENTICAL to the REFERENCE video. 
        Look for:
        - Primary text color (hex)
        - Outline/border color (hex)
        - Font size (estimate for 1280x720 resolution, usually between 20 and 60)
        - Alignment (1-9 using ASS/SSA standard: 1=BottomLeft, 2=BottomCenter, 3=BottomRight, 4=MiddleLeft, 5=MiddleCenter, 6=MiddleRight, 7=TopLeft, 8=TopCenter, 9=TopRight)
        - Font name (detect the closest standard font: Arial, Roboto, Consolas, Times New Roman, Verdana, Georgia, Courier New, Impact, Arial Black)
        - Animation (detect if subtitles fade in/out: 'fade' or 'none')
        - Background style (detect if there is a background box: 'none' or 'semi-transparent-box')
        
        This is CRITICAL. Return a 'style' object with these properties: primaryColor, outlineColor, fontSize, alignment, fontName, animation, backgroundStyle.` : ""}
        
        Return ONLY a JSON object with this structure:
        {
          "segments": [{"start": number, "end": number, "original": string, "translated": string}],
          "style": { "primaryColor": "string", "outlineColor": "string", "fontSize": number, "alignment": number, "fontName": "string", "animation": "string", "backgroundStyle": "string" },
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
          model: 'gemini-3.5-flash',
          contents: { parts: contents },
          config: {
            responseMimeType: 'application/json'
          }
        });
      } catch (geminiErr: any) {
        console.error('Gemini API Error:', geminiErr);
        const msg = geminiErr.message || '';
        if (msg.includes('401') || msg.includes('API_KEY_INVALID') || msg.includes('invalid') || msg.includes('key')) {
          throw new Error('Clé API invalide (Erreur 401). Veuillez vérifier votre clé sur Google AI Studio.');
        } else if (msg.includes('quota') || msg.includes('429')) {
          throw new Error('Quota dépassé. Veuillez réessayer plus tard ou vérifier votre facturation sur Google AI Studio.');
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

      // Merge inferred style with customStyle to ensure all properties are present
      const finalStyle = (refFile && inferredStyle) 
        ? { ...customStyle, ...inferredStyle } 
        : customStyle;

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
        body: JSON.stringify({ filename, segments, style: finalStyle }),
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
        
        await updateDoc(userRef, {
          history: arrayUnion(historyItem)
        }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`));
      } else if (apiKey) {
        // Anonymous user with API key
        const statsRef = doc(db, 'stats', 'global');
        await updateDoc(statsRef, {
          anonymousGenerations: increment(1)
        }).catch(async () => {
          // If doc doesn't exist, create it
          await setDoc(statsRef, { anonymousGenerations: 1 }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, 'stats/global'));
        });
      }

      setResultUrl(downloadUrl);
      
      // 5. Fetch and store locally
      try {
        const response = await fetch(downloadUrl);
        if (response.ok) {
          const blob = await response.blob();
          const localUrl = URL.createObjectURL(blob);
          setLocalBlobUrl(localUrl);
          
          const videoToStore: StoredVideo = {
            id: crypto.randomUUID(),
            blob,
            name: file.name,
            date: new Date().toISOString(),
            language: detectedLanguage,
            mode: subtitleMode
          };
          
          await saveVideo(videoToStore);
          const updatedVideos = await getVideos();
          setStoredVideos(updatedVideos);
        }
      } catch (fetchErr) {
        console.error('Failed to fetch video for local storage:', fetchErr);
        // We don't throw here to not break the UI state 'done', 
        // but we can inform the user via a non-blocking error if needed.
      }

      setStatus('done');
    } catch (err) {
      console.error('Process error:', err);
      setStatus('error');
      setAppError(handleAppError(err));
    }
  };

  const [logoPressTimer, setLogoPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [logoPressProgress, setLogoPressProgress] = useState(0);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdminDash(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoPressStart = () => {
    setLogoPressProgress(0);
    const interval = setInterval(() => {
      setLogoPressProgress(prev => Math.min(prev + 2, 100));
    }, 100);
    setProgressInterval(interval);
    const timer = setTimeout(() => {
      setShowAdminDash(prev => !prev);
      handleLogoPressEnd();
    }, 5000);
    setLogoPressTimer(timer);
  };

  const handleLogoPressEnd = () => {
    if (logoPressTimer) {
      clearTimeout(logoPressTimer);
      setLogoPressTimer(null);
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    setLogoPressProgress(0);
  };

  const finishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('has_seen_landing', 'true');
  };

  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <LandingPage onStart={finishOnboarding} onOpenLegal={(id) => setActiveLegalDoc(id)} />
        <LegalModal 
          isOpen={activeLegalDoc !== null}
          onClose={() => setActiveLegalDoc(null)}
          documentId={activeLegalDoc || 'cgu'}
        />
      </ErrorBoundary>
    );
  }

  if (isAdmin && showAdminDash) {
    return (
      <ErrorBoundary>
        <AdminPanel 
          onClose={() => setShowAdminDash(false)} 
          allUsers={allUsers} 
          globalStats={globalStats} 
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <VersionManager />
      <PwaInstallButton />
      <FeedbackButton />
      <div className="min-h-screen bg-[#FDFCFB] text-[#141414] font-sans">
      {/* Header */}
      <header className="border-b border-black/5 p-4 sm:p-6 flex justify-between items-center sticky top-0 bg-[#FDFCFB]/80 backdrop-blur-md z-50">
        <div 
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setShowOnboarding(true)}
          onMouseDown={handleLogoPressStart}
          onMouseUp={handleLogoPressEnd}
          onMouseLeave={handleLogoPressEnd}
          onTouchStart={handleLogoPressStart}
          onTouchEnd={handleLogoPressEnd}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center relative overflow-hidden shadow-sm border border-black/5">
            <img 
              src="/icons/apple-touch-icon.png" 
              alt="EcoSub AI Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div 
              className="absolute inset-0 transition-all duration-100 pointer-events-none"
              style={{ 
                background: `conic-gradient(rgba(255, 77, 0, 0.4) ${logoPressProgress}%, transparent ${logoPressProgress}%)` 
              }}
            />
          </div>
          <h1 className="text-lg sm:xl font-bold tracking-tight">EcoSub <span className="font-light italic">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setShowApiKeyConfig(!showApiKeyConfig)}
            className={`p-2 rounded-full transition-colors ${showApiKeyConfig ? 'bg-[#FF4D00]/10 text-[#FF4D00]' : 'hover:bg-black/5 text-black/40 hover:text-[#FF4D00]'}`}
            title="Configuration Clé API"
          >
            <Key className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              setShowOnboarding(true);
            }}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40 hover:text-[#FF4D00]"
            title="Aide & Tutoriel"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
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
            ) : isKeyValid ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Connecté via</p>
                  <p className="text-xs font-medium text-emerald-600">Clé API Gemini</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Key className="w-4 h-4 text-emerald-500" />
                </div>
                <button 
                  onClick={() => {
                    setApiKey('');
                    setIsKeyValid(null);
                  }}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40 hover:text-red-500"
                  title="Retirer la clé"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleSignIn}
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
        {isIframe && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 mb-1">Aperçu Intégré Détecté</h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Vous utilisez l'application dans un iframe. Les navigateurs bloquent souvent les cookies tiers dans ce contexte, ce qui peut empêcher le téléchargement de vidéos.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="shrink-0 w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir dans un nouvel onglet
            </button>
          </div>
        )}

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
              {/* Alerte et action corrective immédiates si un blocage de cookies tiers est détecté de manière proactive */}
              {iframeCookieBlocked && (
                <div className="mb-6 p-5 bg-amber-50/80 border border-amber-200 rounded-2xl text-left space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100/80 rounded-full text-amber-600 shrink-0 mt-0.5 animate-pulse">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">Sécurité Iframe & Cookies tiers bloqués</h4>
                      <p className="text-xs text-amber-800 leading-relaxed mt-1">
                        Votre navigateur restreint de manière proactive la transmission de contenus multimédias au sein de l'iframe intégré par défaut d'AI Studio.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="w-full py-4 bg-[#FF4D00] hover:bg-[#E64500] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF4D00]/25 active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir l'application dans un nouvel onglet 🚀
                  </button>
                </div>
              )}

              {appError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">!</div>
                    <div className="flex-grow">
                      <p className="text-sm text-red-600 font-medium">{appError.message}</p>
                      {appError.details && <p className="text-[10px] text-red-500 mt-1">{appError.details}</p>}
                      {appError.action && (
                        <div className="mt-2 p-3 bg-white/50 rounded-xl text-[10px] text-red-700 space-y-2">
                          <p className="font-bold uppercase tracking-widest opacity-70">Action recommandée :</p>
                          <p>{appError.action}</p>
                          {appError.type === ErrorType.NETWORK && (
                            <button 
                              onClick={() => window.location.reload()}
                              className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold transition-colors"
                            >
                              Réessayer (Recharger)
                            </button>
                          )}
                        </div>
                      )}
                      {appError.type === ErrorType.AUTH && appError.message.includes("autorisé") && (
                        <button 
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="mt-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                          Ouvrir dans un nouvel onglet <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      {(appError.type === ErrorType.COOKIE || appError.message.includes("Cookies tiers bloqués")) && (
                        <button 
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="mt-3 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          Ouvrir l'application dans un nouvel onglet <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => setAppError(null)} className="text-red-300 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center space-y-6"
                  >
                    {/* API Key Input - BYOK Architecture */}
                    {showApiKeyConfig && (
                      <ApiKeyConfig 
                        apiKey={apiKey}
                        setApiKey={setApiKey}
                        saveApiKey={saveApiKey}
                        setSaveApiKey={setSaveApiKey}
                        onValidationChange={setIsKeyValid}
                      />
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
                        onClick={() => {
                          // Bloquer le clic d'import si un dysfonctionnement de l'iframe est identifié
                          if (iframeCookieBlocked) return;
                          fileInputRef.current?.click();
                        }}
                        onDragOver={(e) => {
                          // Bloquer le drag si un dysfonctionnement de l'iframe est identifié
                          if (iframeCookieBlocked) return;
                          handleDragOver(e, 'target');
                        }}
                        onDragLeave={(e) => {
                          // Bloquer le leave si un dysfonctionnement de l'iframe est identifié
                          if (iframeCookieBlocked) return;
                          handleDragLeave(e, 'target');
                        }}
                        onDrop={(e) => {
                          // Bloquer la dépose si un dysfonctionnement de l'iframe est identifié
                          if (iframeCookieBlocked) return;
                          handleDrop(e, 'target');
                        }}
                        className={`border-2 border-dashed rounded-2xl p-4 transition-all duration-200 group flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[160px] ${
                          // Style d'atténuation si l'iframe restreint les cookies
                          iframeCookieBlocked
                            ? 'border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-40'
                            : 'cursor-pointer'
                        } ${
                          !iframeCookieBlocked && isDraggingTarget 
                            ? 'border-[#FF4D00] bg-[#FF4D00]/5 scale-[1.02] shadow-sm' 
                            : !iframeCookieBlocked ? 'border-black/10 hover:border-[#FF4D00]/30' : ''
                        }`}
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/40">
                              <Play className="w-6 h-6 text-white mb-1" />
                              <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate max-w-full px-4">
                                {file?.name}
                              </p>
                              <button 
                                onClick={handleRemoveFile}
                                className="mt-3 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Retirer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className={`w-8 h-8 mb-2 transition-colors ${isDraggingTarget ? 'text-[#FF4D00]' : 'text-black/20 group-hover:text-[#FF4D00]'}`} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Vidéo Cible</p>
                            <p className="text-[10px] font-medium text-black/20">
                              {isDraggingTarget ? 'Déposez le fichier ici' : 'Choisir ou glisser la vidéo'}
                            </p>
                          </>
                        )}
                      </div>

                      <div 
                        onClick={() => {
                          // Bloquer l'action si les cookies de l'iframe sont bloqués de manière proactive
                          if (iframeCookieBlocked) return;
                          refFileInputRef.current?.click();
                        }}
                        onDragOver={(e) => {
                          // Bloquer le drag si les cookies de l'iframe sont bloqués de manière proactive
                          if (iframeCookieBlocked) return;
                          handleDragOver(e, 'ref');
                        }}
                        onDragLeave={(e) => {
                          // Bloquer le leave si les cookies de l'iframe sont bloqués de manière proactive
                          if (iframeCookieBlocked) return;
                          handleDragLeave(e, 'ref');
                        }}
                        onDrop={(e) => {
                          // Bloquer la dépose si les cookies de l'iframe sont bloqués de manière proactive
                          if (iframeCookieBlocked) return;
                          handleDrop(e, 'ref');
                        }}
                        className={`border-2 border-dashed rounded-2xl p-4 transition-all duration-200 group flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[160px] ${
                          // Style d'atténuation si l'iframe restreint les cookies
                          iframeCookieBlocked
                            ? 'border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-40'
                            : 'cursor-pointer'
                        } ${
                          !iframeCookieBlocked && isDraggingRef 
                            ? 'border-[#FF4D00] bg-[#FF4D00]/5 scale-[1.02] shadow-sm' 
                            : !iframeCookieBlocked && refFile 
                              ? 'border-[#FF4D00]/30 bg-[#FF4D00]/5 hover:border-[#FF4D00]/50'
                              : !iframeCookieBlocked ? 'border-black/10 hover:border-black/30' : ''
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={refFileInputRef} 
                          onChange={handleRefFileChange} 
                          className="hidden" 
                          accept="video/*"
                        />
                        {refPreview ? (
                          <div className="absolute inset-0 bg-black">
                            <video src={refPreview} className="w-full h-full object-cover opacity-60" muted />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/40">
                              <Video className="w-6 h-6 text-white mb-1" />
                              <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate max-w-full px-4">
                                {refFile?.name}
                              </p>
                              <button 
                                onClick={handleRemoveRefFile}
                                className="mt-3 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Retirer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Video className={`w-8 h-8 mb-2 transition-colors ${isDraggingRef || refFile ? 'text-[#FF4D00]' : 'text-black/20 group-hover:text-black/40'}`} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Vidéo Référence</p>
                            <p className="text-[10px] font-medium text-black/20">
                              {isDraggingRef ? 'Déposez le fichier ici' : 'Copier le style d\'une autre vidéo'}
                            </p>
                          </>
                        )}
                      </div>
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

                    {/* Subtitle Style Selection */}
                    <StyleEditor 
                      selectedPreset={selectedPreset}
                      setSelectedPreset={setSelectedPreset}
                      customStyle={customStyle}
                      setCustomStyle={setCustomStyle}
                      showStyleEditor={showStyleEditor}
                      setShowStyleEditor={setShowStyleEditor}
                    />

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
                      {status === 'uploading' && (
                        <div className="mt-4 max-w-xs mx-auto">
                          <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-[#FF4D00]"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ ease: "linear", duration: 0.2 }}
                            />
                          </div>
                          <p className="text-xs font-bold text-black/40 mt-2">{uploadProgress}%</p>
                        </div>
                      )}
                      <p className="text-xs text-black/40 mt-2">
                        {status === 'processing' ? 'Notre IA travaille sur votre vidéo. Cela peut prendre une minute.' : 'Veuillez patienter.'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {status === 'done' && (resultUrl || localBlobUrl) && (
                  <motion.div 
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="rounded-2xl overflow-hidden border border-black/10 bg-black aspect-video flex items-center justify-center">
                      <video 
                        src={localBlobUrl || resultUrl || ''} 
                        controls 
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={downloadFile}
                        disabled={isDownloading}
                        className="flex-1 bg-[#FF4D00] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#E64500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                        {isDownloading ? 'Téléchargement...' : 'Télécharger'}
                      </button>
                      <button 
                        onClick={() => {
                          setStatus('idle');
                          setFile(null);
                          setResultUrl(null);
                          if (localBlobUrl) {
                            URL.revokeObjectURL(localBlobUrl);
                            setLocalBlobUrl(null);
                          }
                        }}
                        className="px-6 py-4 border border-black/10 rounded-xl font-bold hover:bg-black/5 transition-colors"
                      >
                        Recommencer
                      </button>
                    </div>
                  </motion.div>
                )}

                {status === 'error' && appError && (
                  <motion.div 
                    key="error"
                    className="text-center space-y-6"
                  >
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-600">Oups !</h3>
                      <p className="text-sm text-black/60 mt-2">{appError.message}</p>
                      {appError.details && <p className="text-xs text-black/40 mt-1 italic">{appError.details}</p>}
                      
                      {appError.action && (
                        <div className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-100">
                          <p className="text-xs text-red-800 font-medium">{appError.action}</p>
                        </div>
                      )}

                      {appError.type === ErrorType.COOKIE && (
                        <button 
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="mt-4 w-full py-4 bg-[#FF4D00] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#E64500] transition-colors"
                        >
                          Ouvrir dans un nouvel onglet <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      
                      {appError.type === ErrorType.API_KEY && (
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

        {/* History and Local Storage Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Local Storage */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#FF4D00]" />
              <h2 className="text-lg font-bold">Mes Vidéos (Stockage Local)</h2>
            </div>
            
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
              {storedVideos.length > 0 ? (
                <div className="divide-y divide-black/5">
                  {storedVideos.map((v) => (
                    <div key={v.id} className="p-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center">
                          <Video className="w-5 h-5 text-black/40" />
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[150px] sm:max-w-[200px]">{v.name}</p>
                          <p className="text-[10px] text-black/40">
                            {new Date(v.date).toLocaleDateString()} · {v.language} · {v.mode}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDownloadStoredVideo(v)}
                          className="p-2 hover:bg-[#FF4D00]/10 text-[#FF4D00] rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStoredVideo(v.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto">
                    <Database className="w-6 h-6 text-black/20" />
                  </div>
                  <p className="text-sm text-black/40">Aucune vidéo stockée localement.</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-black/40 px-2">
              * Les vidéos sont stockées uniquement dans votre navigateur (IndexedDB). 
              Elles ne sont pas sauvegardées sur nos serveurs.
            </p>
          </div>

          {/* Account History */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#FF4D00]" />
              <h2 className="text-lg font-bold">Historique du Compte</h2>
            </div>
            
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
              {user ? (
                usage?.history && usage.history.length > 0 ? (
                  <div className="divide-y divide-black/5">
                    {usage.history.slice().reverse().map((item: any, i: number) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-[#FF4D00]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold truncate max-w-[150px] sm:max-w-[200px]">{item.videoName}</p>
                            <p className="text-[10px] text-black/40">
                              {new Date(item.date).toLocaleDateString()} · {item.language} · {item.mode}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto">
                      <History className="w-6 h-6 text-black/20" />
                    </div>
                    <p className="text-sm text-black/40">Votre historique est vide.</p>
                  </div>
                )
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto">
                    <LogIn className="w-6 h-6 text-black/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Connectez-vous</p>
                    <p className="text-xs text-black/40">Pour conserver un historique de vos générations.</p>
                  </div>
                  <button 
                    onClick={handleGoogleSignIn}
                    className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 transition-all"
                  >
                    Se connecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-black/5 p-8 text-center text-[10px] text-black/30 uppercase tracking-[0.2em] space-y-4">
        <div>
          <p className="mb-2">Propulsé par Google Gemini & FFmpeg • 2026 EcoSub AI</p>
          <p className="font-bold">
            Created by Horacio CHINKOUN •{' '}
            <button 
              onClick={() => setShowVersionsHistory(true)} 
              className="hover:text-[#FF4D00] transition-colors hover:underline font-bold tracking-widest cursor-pointer inline-flex items-center gap-1 uppercase"
            >
              Notes de version ({CURRENT_VERSION})
            </button> •{' '}
            <button 
              onClick={() => setShowMyData(true)} 
              className="hover:text-[#FF4D00] transition-colors hover:underline font-bold tracking-widest cursor-pointer inline-flex items-center gap-1 uppercase font-mono"
              id="manage-my-data-btn"
            >
              Gérer mes données
            </button>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-bold opacity-70">
          <button onClick={() => setActiveLegalDoc('cgu')} className="hover:text-black transition-colors focus:outline-none">CGU</button>
          <span className="opacity-30">•</span>
          <button onClick={() => setActiveLegalDoc('privacy')} className="hover:text-black transition-colors focus:outline-none">Confidentialité</button>
          <span className="opacity-30">•</span>
          <button onClick={() => setActiveLegalDoc('cookies')} className="hover:text-black transition-colors focus:outline-none">Cookies</button>
          <span className="opacity-30">•</span>
          <button onClick={() => setActiveLegalDoc('legal')} className="hover:text-black transition-colors focus:outline-none">Mentions Légales</button>
        </div>
      </footer>

      {/* PWA Widgets Globaux */}
      <VersionManager />
      <PwaInstallButton />
      
      {/* Historique complet des Changelogs */}
      <ChangelogModal 
        isOpen={showVersionsHistory} 
        onClose={() => setShowVersionsHistory(false)} 
        version={CURRENT_VERSION} 
        showAll={true} 
      />

      {/* Espace Données Personnelles et RGPD */}
      <MyDataModal 
        isOpen={showMyData}
        onClose={() => setShowMyData(false)}
      />

      {/* Affichage des documents légaux */}
      <LegalModal 
        isOpen={activeLegalDoc !== null}
        onClose={() => setActiveLegalDoc(null)}
        documentId={activeLegalDoc || 'cgu'}
      />

      {/* Toast PWA "Appuyez à nouveau pour quitter" */}
      <AnimatePresence>
        {showExitPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-black text-white px-6 py-3 rounded-full shadow-xl shadow-black/20 text-sm font-bold tracking-wide"
          >
            Appuyez à nouveau pour quitter
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}
