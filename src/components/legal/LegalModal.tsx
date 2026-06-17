import React from 'react';
import { X, Shield, FileText, Landmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LegalDocumentId, LEGAL_DOCUMENTS } from './legalContent';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: LegalDocumentId;
}

export function LegalModal({ isOpen, onClose, documentId }: LegalModalProps) {
  if (!isOpen) return null;

  const doc = LEGAL_DOCUMENTS[documentId];

  const getIcon = () => {
    switch (documentId) {
      case 'legal': return <Landmark className="w-5 h-5 text-gray-400" />;
      case 'cgu': return <FileText className="w-5 h-5 text-[#FF4D00]" />;
      case 'privacy': return <Shield className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                {doc.title}
              </h2>
              <p className="text-xs text-gray-500 font-mono">Dernière mise à jour : {doc.lastUpdated}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar scroll-smooth flex-1">
          <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-[#FF4D00] prose-a:no-underline hover:prose-a:underline prose-p:text-gray-600 prose-li:text-gray-600">
            <ReactMarkdown>{doc.content}</ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
