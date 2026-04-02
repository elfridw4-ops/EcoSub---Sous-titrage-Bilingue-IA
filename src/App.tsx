import React, { useState, useRef, useEffect, Component } from 'react';
import { Upload, Video, CheckCircle, Loader2, Download, Languages, Play, Key, LogIn, LogOut, User, HelpCircle, ChevronRight, ChevronLeft, X, Sparkles, MousePointer2, AlertCircle, AlertTriangle, ExternalLink, ArrowRight, Palette, Type, AlignCenter, Settings2, Trash2, History, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { handleAppError, AppError, ErrorType } from './utils/errors';
import { saveVideo, getVideos, deleteVideo, StoredVideo } from './utils/storage';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot, collection, getDocs, increment } from 'firebase/firestore';

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

interface SubtitleStyle {
  primaryColor: string;
  outlineColor: string;
  fontSize: number;
  alignment: number;
  fontName: string;
  animation: 'none' | 'fade';
  backgroundStyle: 'none' | 'semi-transparent-box';
  shadow: number;
}

const PRESET_STYLES: Record<string, { name: string; style: SubtitleStyle }> = {
  default: {
    name: 'Défaut',
    style: {
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      fontSize: 32,
      alignment: 2,
      fontName: 'Arial',
      animation: 'none',
      backgroundStyle: 'none',
      shadow: 2
    }
  },
  youtube: {
    name: 'YouTube Classic',
    style: {
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      fontSize: 28,
      alignment: 2,
      fontName: 'Roboto',
      animation: 'none',
      backgroundStyle: 'semi-transparent-box',
      shadow: 0
    }
  },
  netflix: {
    name: 'Netflix Style',
    style: {
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      fontSize: 34,
      alignment: 2,
      fontName: 'Consolas',
      animation: 'none',
      backgroundStyle: 'none',
      shadow: 2
    }
  },
  modern: {
    name: 'Modern Green',
    style: {
      primaryColor: '#00FF00',
      outlineColor: '#000000',
      fontSize: 36,
      alignment: 2,
      fontName: 'Arial Black',
      animation: 'fade',
      backgroundStyle: 'none',
      shadow: 3
    }
  },
  minimal: {
    name: 'Minimalist',
    style: {
      primaryColor: '#F3F4F6',
      outlineColor: '#1F2937',
      fontSize: 24,
      alignment: 2,
      fontName: 'Inter',
      animation: 'none',
      backgroundStyle: 'none',
      shadow: 1
    }
  }
};

export default function App() {
  const SYSTEM_API_KEY = process.env.GEMINI_API_KEY || '';
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
    const savedKey = localStorage.getItem('gemini_api_key');
    return savedKey || SYSTEM_API_KEY;
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
  const [isKeyValidating, setIsKeyValidating] = useState(false);
  const [keyValidationError, setKeyValidationError] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_completed'));
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [storedVideos, setStoredVideos] = useState<StoredVideo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isIframe = window.self !== window.top;

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

  // API Key Validation
  useEffect(() => {
    // If using system key, assume it's valid (it's from the environment)
    if (apiKey === SYSTEM_API_KEY && SYSTEM_API_KEY !== '') {
      setIsKeyValid(true);
      setKeyValidationError(null);
      return;
    }

    if (!apiKey || user) {
      setIsKeyValid(null);
      setKeyValidationError(null);
      return;
    }

    const validateKey = async () => {
      setIsKeyValidating(true);
      setKeyValidationError(null);
      setIsKeyValid(null);

      try {
        // Basic format check
        if (apiKey.length < 30) {
          throw new Error("Clé trop courte");
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Try a very small generation to be sure
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "test",
          config: { maxOutputTokens: 1 }
        });

        if (response.text) {
          setIsKeyValid(true);
        }
      } catch (err: any) {
        console.error("Key validation error:", err);
        setIsKeyValid(false);
        setKeyValidationError(err.message || "Clé API invalide");
      } finally {
        setIsKeyValidating(false);
      }
    };

    const timeoutId = setTimeout(validateKey, 1000);
    return () => clearTimeout(timeoutId);
  }, [apiKey, user]);

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
        const videos = await getVideos();
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
    
    const currentApiKey = apiKey || SYSTEM_API_KEY;
    
    if (!currentApiKey) {
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
      const ai = new GoogleGenAI({ apiKey: currentApiKey });
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
          model: 'gemini-3-flash-preview',
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
        
        if (isAdmin) {
          await updateDoc(userRef, {
            history: arrayUnion(historyItem)
          }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`));
        } else {
          await updateDoc(userRef, {
            generations: arrayUnion(new Date().toISOString()),
            history: arrayUnion(historyItem)
          }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`));
        }
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

  const finishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  const onboardingSteps = [
    {
      title: "Bienvenue sur EcoSub AI",
      description: "Transformez vos vidéos en contenus bilingues élégants en quelques secondes grâce à la puissance de Gemini 1.5 Flash.",
      icon: <Sparkles className="w-12 h-12 text-[#FF4D00]" />,
      image: "https://picsum.photos/seed/welcome/400/250"
    },
    {
      title: "1. Vidéo Cible",
      description: "Déposez la vidéo que vous souhaitez sous-titrer. Nous détecterons automatiquement si elle est en Français ou en Anglais.",
      icon: <Upload className="w-12 h-12 text-[#FF4D00]" />,
      image: "https://picsum.photos/seed/upload/400/250"
    },
    {
      title: "2. Style de Référence (Optionnel)",
      description: "Vous aimez le style d'un autre créateur ? Déposez une vidéo de référence et nous copierons automatiquement la couleur, la police et la position de ses sous-titres.",
      icon: <Video className="w-12 h-12 text-[#FF4D00]" />,
      image: "https://picsum.photos/seed/style/400/250"
    },
    {
      title: "3. Magie de l'IA",
      description: "Notre IA transcrit, traduit et incruste les sous-titres directement dans la vidéo.",
      icon: <Languages className="w-12 h-12 text-[#FF4D00]" />,
      image: "https://picsum.photos/seed/ai/400/250"
    },
    {
      title: "4. Téléchargez & Partagez",
      description: "Une fois terminé, prévisualisez votre vidéo et téléchargez-la. Vos crédits gratuits se rechargent toutes les 24 heures !",
      icon: <Download className="w-12 h-12 text-[#FF4D00]" />,
      image: "https://picsum.photos/seed/share/400/250"
    }
  ];

  return (
    <ErrorBoundary>
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden relative"
            >
              <button 
                onClick={finishOnboarding}
                className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-black/40" />
              </button>

              <div className="p-8 sm:p-10 space-y-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <motion.div 
                    key={onboardingStep}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-[#FF4D00]/5 rounded-3xl flex items-center justify-center"
                  >
                    {onboardingSteps[onboardingStep].icon}
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {onboardingSteps[onboardingStep].title}
                    </h3>
                    <p className="text-black/60 leading-relaxed">
                      {onboardingSteps[onboardingStep].description}
                    </p>
                  </div>

                  <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black/5 border border-black/5">
                    <img 
                      src={onboardingSteps[onboardingStep].image} 
                      alt="Tutorial" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-1.5">
                    {onboardingSteps.map((_, i) => (
                      <div 
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === onboardingStep ? 'w-8 bg-[#FF4D00]' : 'w-1.5 bg-black/10'}`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-3">
                    {onboardingStep > 0 && (
                      <button 
                        onClick={() => setOnboardingStep(prev => prev - 1)}
                        className="p-3 bg-black/5 hover:bg-black/10 rounded-xl transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    
                    {onboardingStep < onboardingSteps.length - 1 ? (
                      <button 
                        onClick={() => setOnboardingStep(prev => prev + 1)}
                        className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black/80 transition-all active:scale-95"
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={finishOnboarding}
                        className="px-8 py-3 bg-[#FF4D00] text-white rounded-xl font-bold text-sm hover:bg-[#E64500] transition-all active:scale-95 shadow-lg shadow-[#FF4D00]/20"
                      >
                        C'est parti !
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <button 
            onClick={() => {
              setOnboardingStep(0);
              setShowOnboarding(true);
            }}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40 hover:text-[#FF4D00]"
            title="Aide & Tutoriel"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowAdminDash(!showAdminDash)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                showAdminDash ? 'bg-[#FF4D00] text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'
              }`}
            >
              Dashboard
            </button>
          )}
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

        {/* Admin Dashboard */}
        <AnimatePresence>
          {isAdmin && showAdminDash && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-black text-white rounded-3xl p-6 sm:p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Tableau de Bord Administrateur</h3>
                  <button onClick={() => setShowAdminDash(false)} className="text-white/40 hover:text-white">Fermer</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Utilisateurs Google</p>
                    <p className="text-3xl font-bold">{allUsers.length}</p>
                    <p className="text-[10px] text-white/20 mt-2">Comptes uniques enregistrés</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Utilisateurs Clé API</p>
                    <p className="text-3xl font-bold">{globalStats?.anonymousGenerations || 0}</p>
                    <p className="text-[10px] text-white/20 mt-2">Générations anonymes totales</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Total Générations</p>
                    <p className="text-3xl font-bold">
                      {(allUsers.reduce((acc, u) => acc + (u.history?.length || 0), 0)) + (globalStats?.anonymousGenerations || 0)}
                    </p>
                    <p className="text-[10px] text-white/20 mt-2">Toutes méthodes confondues</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Derniers Utilisateurs Google</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {allUsers.slice(0, 5).map((u, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {u.email?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{u.email}</p>
                            <p className="text-[9px] text-white/40">{u.history?.length || 0} générations</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-white/40">Dernière activité</p>
                          <p className="text-[10px] font-medium">
                            {u.generations?.length > 0 ? new Date(u.generations[u.generations.length - 1]).toLocaleDateString() : 'Jamais'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    {!SYSTEM_API_KEY && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 text-left bg-black/5 p-5 rounded-2xl border border-black/5">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <Key className="w-4 h-4 text-[#FF4D00]" />
                              <label className="text-xs font-bold uppercase tracking-widest text-black/60">Configuration Clé API (BYOK)</label>
                            </div>
                            <a 
                              href="https://aistudio.google.com/app/apikey" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#FF4D00] hover:underline font-bold flex items-center gap-1"
                            >
                              Obtenir une clé <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <p className="text-[11px] text-black/50 mb-2">
                            Cette application utilise votre propre clé API Gemini. Elle est stockée localement et de manière sécurisée dans votre navigateur.
                          </p>
                          <div className="relative">
                            <input 
                              type="password"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="Collez votre clé API Gemini ici..."
                              className={`w-full px-4 py-3 bg-white border rounded-xl text-xs focus:outline-none transition-all ${
                                isKeyValid === true ? 'border-emerald-500/50 focus:border-emerald-500' : 
                                isKeyValid === false ? 'border-red-500/50 focus:border-red-500' : 
                                'border-black/10 focus:border-[#FF4D00]/50'
                              }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              {isKeyValidating && <Loader2 className="w-4 h-4 text-[#FF4D00] animate-spin" />}
                              {!isKeyValidating && isKeyValid === true && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                              {!isKeyValidating && isKeyValid === false && <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">!</div>}
                            </div>
                          </div>
                          {keyValidationError && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{keyValidationError}</p>
                          )}
                          {isKeyValid === true && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1 ml-1">✓ Clé API valide et prête à l'emploi</p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-3 ml-1">
                            <button 
                              onClick={() => setSaveApiKey(!saveApiKey)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveApiKey ? 'bg-[#FF4D00] border-[#FF4D00]' : 'border-black/20 bg-white'}`}
                            >
                              {saveApiKey && <CheckCircle className="w-3 h-3 text-white" />}
                            </button>
                            <span className="text-xs text-black/70 font-medium cursor-pointer" onClick={() => setSaveApiKey(!saveApiKey)}>
                              Sauvegarder la clé (localStorage)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {SYSTEM_API_KEY && !isAdmin && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4 text-left">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                          <CheckCircle className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Service Prêt</p>
                          <p className="text-[11px] text-emerald-700/80 mt-0.5">L'application utilise la clé API du système. Aucune configuration requise.</p>
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
                            <Video className={`w-8 h-8 mb-2 transition-colors ${refFile ? 'text-[#FF4D00]' : 'text-black/20 group-hover:text-black/40'}`} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Vidéo Référence</p>
                            <p className="text-[10px] font-medium text-black/20">Copier le style</p>
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
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-black/40 text-left">Style des sous-titres</p>
                        <button 
                          onClick={() => setShowStyleEditor(!showStyleEditor)}
                          className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${showStyleEditor ? 'text-[#FF4D00]' : 'text-black/40 hover:text-[#FF4D00]'}`}
                        >
                          <Settings2 className="w-3 h-3" />
                          {showStyleEditor ? 'Fermer l\'éditeur' : 'Personnaliser'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(PRESET_STYLES).map(([id, preset]) => (
                          <button
                            key={id}
                            onClick={() => {
                              setSelectedPreset(id);
                              setCustomStyle(preset.style);
                              setShowStyleEditor(false);
                            }}
                            className={`py-2 px-2 text-[10px] font-bold rounded-lg border transition-all flex flex-col items-center gap-1 ${
                              selectedPreset === id && !showStyleEditor
                                ? 'bg-black text-white border-black' 
                                : 'bg-white border-black/10 text-black/60 hover:border-black/30'
                            }`}
                          >
                            <span>{preset.name}</span>
                            <div 
                              className="w-full h-1 rounded-full" 
                              style={{ backgroundColor: preset.style.primaryColor, border: `1px solid ${preset.style.outlineColor}` }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Style Editor Panel */}
                    <AnimatePresence>
                      {showStyleEditor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-black/5 p-5 rounded-2xl border border-black/5 space-y-4">
                            <div className="flex justify-between items-center border-b border-black/5 pb-2">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-black/60 flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Éditeur de Style
                              </h4>
                              <button onClick={() => setShowStyleEditor(false)} className="text-black/40 hover:text-black">
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-black/40 uppercase">Couleur Principale</label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="color" 
                                    value={customStyle.primaryColor}
                                    onChange={(e) => {
                                      setCustomStyle({...customStyle, primaryColor: e.target.value});
                                      setSelectedPreset('custom');
                                    }}
                                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                  />
                                  <span className="text-[10px] font-mono">{customStyle.primaryColor}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-black/40 uppercase">Couleur Contour</label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="color" 
                                    value={customStyle.outlineColor}
                                    onChange={(e) => {
                                      setCustomStyle({...customStyle, outlineColor: e.target.value});
                                      setSelectedPreset('custom');
                                    }}
                                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                  />
                                  <span className="text-[10px] font-mono">{customStyle.outlineColor}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-black/40 uppercase flex items-center gap-1">
                                  <Type className="w-2 h-2" />
                                  Taille Police ({customStyle.fontSize}px)
                                </label>
                                <input 
                                  type="range" min="12" max="72" step="1"
                                  value={customStyle.fontSize}
                                  onChange={(e) => {
                                    setCustomStyle({...customStyle, fontSize: parseInt(e.target.value)});
                                    setSelectedPreset('custom');
                                  }}
                                  className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#FF4D00]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-black/40 uppercase">Police</label>
                                <select 
                                  value={customStyle.fontName}
                                  onChange={(e) => {
                                    setCustomStyle({...customStyle, fontName: e.target.value});
                                    setSelectedPreset('custom');
                                  }}
                                  className="w-full p-2 bg-white border border-black/10 rounded-lg text-[10px] focus:outline-none"
                                >
                                  <option value="Arial">Arial</option>
                                  <option value="Roboto">Roboto</option>
                                  <option value="Consolas">Consolas</option>
                                  <option value="Verdana">Verdana</option>
                                  <option value="Impact">Impact</option>
                                  <option value="Arial Black">Arial Black</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-black/40 uppercase flex items-center gap-1">
                                  <AlignCenter className="w-2 h-2" />
                                  Alignement
                                </label>
                                <div className="grid grid-cols-3 gap-1">
                                  {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(pos => (
                                    <button
                                      key={pos}
                                      onClick={() => {
                                        setCustomStyle({...customStyle, alignment: pos});
                                        setSelectedPreset('custom');
                                      }}
                                      className={`p-1 border rounded transition-colors flex items-center justify-center ${customStyle.alignment === pos ? 'bg-[#FF4D00] border-[#FF4D00] text-white' : 'bg-white border-black/10 text-black/40 hover:border-black/30'}`}
                                      title={`Alignement ${pos}`}
                                    >
                                      <div className={`w-2 h-2 bg-current rounded-sm ${pos === 2 ? 'mb-0.5' : ''}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-black/40 uppercase">Ombre ({customStyle.shadow}px)</label>
                                  <input 
                                    type="range" min="0" max="10" step="0.5"
                                    value={customStyle.shadow}
                                    onChange={(e) => {
                                      setCustomStyle({...customStyle, shadow: parseFloat(e.target.value)});
                                      setSelectedPreset('custom');
                                    }}
                                    className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#FF4D00]"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-black/40 uppercase">Fond Opaque</label>
                                  <button 
                                    onClick={() => {
                                      setCustomStyle({...customStyle, backgroundStyle: customStyle.backgroundStyle === 'none' ? 'semi-transparent-box' : 'none'});
                                      setSelectedPreset('custom');
                                    }}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${customStyle.backgroundStyle === 'semi-transparent-box' ? 'bg-[#FF4D00]' : 'bg-black/20'}`}
                                  >
                                    <motion.div 
                                      animate={{ x: customStyle.backgroundStyle === 'semi-transparent-box' ? 22 : 2 }}
                                      className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                    />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-black/40 uppercase">Animation Fondu</label>
                                  <button 
                                    onClick={() => {
                                      setCustomStyle({...customStyle, animation: customStyle.animation === 'none' ? 'fade' : 'none'});
                                      setSelectedPreset('custom');
                                    }}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${customStyle.animation === 'fade' ? 'bg-[#FF4D00]' : 'bg-black/20'}`}
                                  >
                                    <motion.div 
                                      animate={{ x: customStyle.animation === 'fade' ? 22 : 2 }}
                                      className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

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
      <footer className="mt-20 border-t border-black/5 p-8 text-center text-[10px] text-black/30 uppercase tracking-[0.2em] space-y-2">
        <p>Propulsé par Google Gemini & FFmpeg • 2026 EcoSub AI</p>
        <p className="font-bold">Created by Horacio CHINKOUN</p>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
