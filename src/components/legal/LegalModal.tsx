import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, FileText, Landmark, Cookie, Mail, ChevronRight, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LegalDocumentId, LEGAL_DOCUMENTS } from './legalContent';
import { useModalBackHandler } from '../../lib/navigation';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: LegalDocumentId;
}

export function LegalModal({ isOpen, onClose, documentId }: LegalModalProps) {
  useModalBackHandler(isOpen, onClose, 'legal-modal');
  
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const contentContainerRef = useRef<HTMLDivElement>(null);
  
  const doc = LEGAL_DOCUMENTS[documentId];

  // Set the first section as active initially
  useEffect(() => {
    if (!isOpen) return;
    if (doc?.sections && doc.sections.length > 0) {
      setActiveSectionId(doc.sections[0].id);
    }
  }, [isOpen, documentId, doc]);

  // Handle active section tracking on scroll
  useEffect(() => {
    if (!isOpen) return;
    
    const handleScroll = () => {
      const container = contentContainerRef.current;
      if (!container || !doc?.sections) return;

      const containerTop = container.getBoundingClientRect().top;
      let currentActiveId = doc.sections[0].id;

      for (const section of doc.sections) {
        const element = document.getElementById(`section-${section.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the element is near the top of the container, mark it active
          if (rect.top - containerTop <= 100) {
            currentActiveId = section.id;
          } else {
            break;
          }
        }
      }
      setActiveSectionId(currentActiveId);
    };

    const container = contentContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Run once on load/render to set correct initial state
      setTimeout(handleScroll, 100);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen, documentId, doc]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (documentId) {
      case 'legal': return <Landmark className="w-5 h-5 text-gray-500" />;
      case 'cgu': return <FileText className="w-5 h-5 text-[#FF4D00]" />;
      case 'privacy': return <Shield className="w-5 h-5 text-green-500" />;
      case 'cookies': return <Cookie className="w-5 h-5 text-amber-500" />;
      default: return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleSectionClick = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element && contentContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full h-full sm:h-[85vh] sm:rounded-2xl sm:max-w-4xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-xl">
              {getIcon()}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">
                {doc.title}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-400 font-mono">
                Dernière mise à jour : {doc.lastUpdated}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group focus:outline-none"
            title="Fermer"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
          </button>
        </div>

        {/* Dynamic Mobile Quick Nav Bar */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 bg-gray-50 border-b border-gray-100 scrollbar-thin shrink-0">
          {doc.sections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeSectionId === section.id
                  ? 'bg-[#FF4D00] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {idx + 1}. {section.title.split('. ').slice(1).join('. ') || section.title}
            </button>
          ))}
        </div>

        {/* Dual-Pane Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar - Desktop Table of Contents */}
          <div className="hidden md:block w-64 border-r border-gray-100 bg-gray-50/50 p-4 overflow-y-auto shrink-0 select-none">
            <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-4 px-2">
              Sommaire
            </p>
            <nav className="space-y-1">
              {doc.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    activeSectionId === section.id
                      ? 'bg-white text-[#FF4D00] shadow-sm border-l-4 border-l-[#FF4D00] pl-2'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="truncate">{section.title}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${
                    activeSectionId === section.id
                      ? 'text-[#FF4D00] translate-x-0.5'
                      : 'text-gray-300 group-hover:text-gray-400'
                  }`} />
                </button>
              ))}
            </nav>

            {/* Quick Contact Box in Sidebar */}
            <div className="mt-8 p-4 bg-[#FF4D00]/5 rounded-2xl border border-[#FF4D00]/10">
              <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#FF4D00]" />
                Besoin d'aide ?
              </h4>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                Pour toute question relative à nos documents légaux.
              </p>
              <a 
                href="mailto:elfridw4@gmail.com"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4D00] hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                Contactez-nous
              </a>
            </div>
          </div>

          {/* Main Scrollable Content */}
          <div 
            ref={contentContainerRef}
            className="flex-1 p-6 overflow-y-auto no-scrollbar scroll-smooth bg-white"
          >
            <div className="max-w-2xl mx-auto space-y-10 pb-12">
              {doc.sections.map((section) => (
                <section 
                  key={section.id} 
                  id={`section-${section.id}`}
                  className="scroll-mt-6 border-b border-gray-50 pb-8 last:border-0"
                >
                  <h3 className="text-lg font-extrabold text-gray-900 mb-4 tracking-tight">
                    {section.title}
                  </h3>
                  <div className="prose prose-sm sm:prose-base max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-gray-900 prose-a:text-[#FF4D00] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-table:border prose-table:border-gray-100 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </section>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Mail className="w-3.5 h-3.5" />
            Contact légal : <a href="mailto:elfridw4@gmail.com" className="font-semibold text-gray-600 hover:text-black hover:underline">elfridw4@gmail.com</a>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-black transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            J'ai compris
          </button>
        </div>

      </div>
    </div>
  );
}
