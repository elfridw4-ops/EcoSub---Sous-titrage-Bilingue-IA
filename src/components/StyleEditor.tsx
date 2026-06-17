import React from 'react';
import { Settings2, Palette, X, Type, AlignCenter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SubtitleStyle, PRESET_STYLES } from '../utils/styles';

interface StyleEditorProps {
  selectedPreset: string;
  setSelectedPreset: (preset: string) => void;
  customStyle: SubtitleStyle;
  setCustomStyle: (style: SubtitleStyle) => void;
  showStyleEditor: boolean;
  setShowStyleEditor: (show: boolean) => void;
}

export const StyleEditor: React.FC<StyleEditorProps> = ({
  selectedPreset,
  setSelectedPreset,
  customStyle,
  setCustomStyle,
  showStyleEditor,
  setShowStyleEditor
}) => {
  return (
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
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.style.primaryColor, border: `1px solid ${preset.style.outlineColor}` }} />
            </div>
          </button>
        ))}
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
                {/* Colors */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/60 uppercase">Couleur Texte</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={customStyle.primaryColor}
                      onChange={(e) => {
                        setCustomStyle({...customStyle, primaryColor: e.target.value});
                        setSelectedPreset('custom');
                      }}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono text-black/60">{customStyle.primaryColor}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/60 uppercase">Couleur Contour</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={customStyle.outlineColor}
                      onChange={(e) => {
                        setCustomStyle({...customStyle, outlineColor: e.target.value});
                        setSelectedPreset('custom');
                      }}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono text-black/60">{customStyle.outlineColor}</span>
                  </div>
                </div>

                {/* Font & Size */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/60 uppercase flex items-center gap-1">
                    <Type className="w-3 h-3" /> Police
                  </label>
                  <select 
                    value={customStyle.fontName}
                    onChange={(e) => {
                      setCustomStyle({...customStyle, fontName: e.target.value});
                      setSelectedPreset('custom');
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Consolas">Consolas</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Impact">Impact</option>
                    <option value="Arial Black">Arial Black</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/60 uppercase">Taille ({customStyle.fontSize}px)</label>
                  <input 
                    type="range" 
                    min="16" max="72" 
                    value={customStyle.fontSize}
                    onChange={(e) => {
                      setCustomStyle({...customStyle, fontSize: parseInt(e.target.value)});
                      setSelectedPreset('custom');
                    }}
                    className="w-full accent-[#FF4D00]"
                  />
                </div>

                {/* Layout & Effects */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/60 uppercase flex items-center gap-1">
                    <AlignCenter className="w-3 h-3" /> Position
                  </label>
                  <select 
                    value={customStyle.alignment}
                    onChange={(e) => {
                      setCustomStyle({...customStyle, alignment: parseInt(e.target.value)});
                      setSelectedPreset('custom');
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value={8}>Haut</option>
                    <option value={5}>Milieu</option>
                    <option value={2}>Bas</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/60 uppercase">Fond</label>
                  <select 
                    value={customStyle.backgroundStyle}
                    onChange={(e) => {
                      setCustomStyle({...customStyle, backgroundStyle: e.target.value as any});
                      setSelectedPreset('custom');
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="none">Transparent</option>
                    <option value="semi-transparent-box">Boîte semi-transparente</option>
                  </select>
                </div>
              </div>

              {/* Preview Box */}
              <div className="mt-4 p-4 bg-gray-200 rounded-xl relative overflow-hidden flex items-center justify-center min-h-[100px]">
                <div 
                  className="text-center transition-all"
                  style={{
                    fontFamily: customStyle.fontName,
                    fontSize: `${customStyle.fontSize * 0.6}px`, // Scaled down for preview
                    color: customStyle.primaryColor,
                    textShadow: customStyle.backgroundStyle === 'none' 
                      ? `-1px -1px 0 ${customStyle.outlineColor}, 1px -1px 0 ${customStyle.outlineColor}, -1px 1px 0 ${customStyle.outlineColor}, 1px 1px 0 ${customStyle.outlineColor}, 0px 4px ${customStyle.shadow * 2}px rgba(0,0,0,0.5)`
                      : 'none',
                    backgroundColor: customStyle.backgroundStyle === 'semi-transparent-box' ? 'rgba(0,0,0,0.5)' : 'transparent',
                    padding: customStyle.backgroundStyle === 'semi-transparent-box' ? '4px 12px' : '0',
                    borderRadius: customStyle.backgroundStyle === 'semi-transparent-box' ? '4px' : '0',
                  }}
                >
                  Aperçu du style
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
