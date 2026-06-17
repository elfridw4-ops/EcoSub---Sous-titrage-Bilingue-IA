import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ApiKeyConfigProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  saveApiKey: boolean;
  setSaveApiKey: (save: boolean) => void;
  onValidationChange: (isValid: boolean | null) => void;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({
  apiKey,
  setApiKey,
  saveApiKey,
  setSaveApiKey,
  onValidationChange
}) => {
  const [isKeyValidating, setIsKeyValidating] = useState(false);
  const [keyValidationError, setKeyValidationError] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setIsKeyValid(null);
      setKeyValidationError(null);
      onValidationChange(null);
      return;
    }

    const validateKey = async () => {
      if (apiKey.length < 30) {
        setIsKeyValid(false);
        setKeyValidationError("La clé API semble trop courte.");
        onValidationChange(false);
        return;
      }

      setIsKeyValidating(true);
      setKeyValidationError(null);
      setIsKeyValid(null);

      try {
        const ai = new GoogleGenAI({ apiKey });
        // Simple call to verify the key
        await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: 'test'
        });
        
        setIsKeyValid(true);
        onValidationChange(true);
      } catch (err: any) {
        setIsKeyValid(false);
        onValidationChange(false);
        if (err.message?.includes('API key not valid')) {
          setKeyValidationError("Clé API invalide. Veuillez vérifier votre clé.");
        } else {
          setKeyValidationError(err.message || "Erreur de validation de la clé.");
        }
      } finally {
        setIsKeyValidating(false);
      }
    };

    const timeoutId = setTimeout(validateKey, 800);
    return () => clearTimeout(timeoutId);
  }, [apiKey, onValidationChange]);

  return (
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
  );
};
