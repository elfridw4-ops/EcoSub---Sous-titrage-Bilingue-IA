import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Video, Languages, Zap, ArrowRight, CheckCircle, Smartphone, Globe, Briefcase } from 'lucide-react';

import { LegalDocumentId } from './legal/legalContent';

interface LandingPageProps {
  onStart: () => void;
  onOpenLegal?: (doc: LegalDocumentId) => void;
}

export default function LandingPage({ onStart, onOpenLegal }: LandingPageProps) {
  const steps = [
    {
      title: "1. Importer la vidéo",
      description: "Déposez votre vidéo cible (Français ou Anglais) d'un simple glisser-déposer."
    },
    {
      title: "2. Définir le style",
      description: "Utilisez un template ou copiez le style d'une vidéo existante de votre choix."
    },
    {
      title: "3. IA en action",
      description: "Gemini 1.5 Flash traduit, synchronise et incruste vos sous-titres instantanément."
    }
  ];

  const features = [
    {
      title: "Détection automatique",
      description: "Reconnaissance vocale ultra-précise en français et anglais via l'IA.",
      icon: <Zap className="w-6 h-6 text-[#FF4D00]" />
    },
    {
      title: "Styles sur-mesure",
      description: "Copiez le style (police, couleur, position) d'une vidéo virale en 1 clic.",
      icon: <Sparkles className="w-6 h-6 text-[#FF4D00]" />
    },
    {
      title: "Traduction instantanée",
      description: "Passez de l'anglais au français sans perdre l'intégrité du sens.",
      icon: <Languages className="w-6 h-6 text-[#FF4D00]" />
    },
    {
      title: "Export prêt à l'emploi",
      description: "Vos vidéos sont immédiatement prêtes pour TikTok, Reels ou YouTube Shorts.",
      icon: <Video className="w-6 h-6 text-[#FF4D00]" />
    }
  ];

  const useCases = [
    {
      title: "Créateurs de contenu",
      description: "Un créateur TikTok adapte ses vidéos anglophones pour son audience française en conservant le style viral de ses idoles.",
      icon: <Smartphone className="w-8 h-8 text-[#FF4D00]" />
    },
    {
      title: "Agences marketing",
      description: "Une agence social media décline rapidement des campagnes pubs internationales avec des sous-titres bilingues dynamiques.",
      icon: <Briefcase className="w-8 h-8 text-[#FF4D00]" />
    },
    {
      title: "Éducateurs & Formateurs",
      description: "Un formateur rend ses cours en ligne accessibles mondialement en ajoutant un sous-titrage clair et stylisé.",
      icon: <Globe className="w-8 h-8 text-[#FF4D00]" />
    }
  ];

  const faqs = [
    {
      question: "Combien de temps faut-il pour sous-titrer une vidéo ?",
      answer: "Grâce à notre traitement par IA, une vidéo d'une minute est généralement transcrite, traduite et stylisée en moins de quelques secondes."
    },
    {
      question: "Puis-je vraiment copier le style d'une autre vidéo ?",
      answer: "Absolument. Vous importez une vidéo de référence, et notre outil analyse et reproduit la police, les couleurs et le placement des sous-titres."
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Vos vidéos sont traitées via l'API Gemini et ne sont pas conservées de manière permanente sur nos serveurs. Tout est pensé pour le traitement éphémère."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-[#FF4D00]/20 selection:text-[#FF4D00]">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-black/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/icons/apple-touch-icon.png" 
              alt="EcoSub AI Logo" 
              className="w-10 h-10 object-cover rounded-xl shadow-sm border border-black/5 transform hover:rotate-12 transition-transform"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold tracking-tight">EcoSub AI</span>
          </div>
          <button 
            onClick={onStart}
            className="px-6 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-sm font-bold text-white rounded-full transition-all active:scale-95 shadow-lg shadow-[#FF4D00]/20"
          >
            Accéder à l'outil
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4" />
            Bilingual Subtitles, Made Effortless
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]"
          >
            Donnez une voix internationale à vos vidéos.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            EcoSub AI transcrit, traduit et incruste des sous-titres ultra-stylisés en quelques clics. Copiez le style de création viral et maximisez votre portée.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4"
          >
            <button 
              onClick={onStart}
              className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-[#FF4D00] hover:bg-[#E64500] text-lg font-bold text-white rounded-2xl transition-all active:scale-95 shadow-xl shadow-[#FF4D00]/25 group"
            >
              Cadrer ma première vidéo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">La magie d'un sous-titrage nouvelle génération</h2>
            <p className="text-gray-500">Un concentré d'intelligence artificielle au service de l'accessibilité visuelle.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-900 text-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl font-bold tracking-tight mb-4">Le workflow le plus fluide du marché.</h2>
                <p className="text-gray-400 text-lg">Finies les heures passées sur des timelines complexes. Nous avons repensé la productivité.</p>
              </div>
              <div className="space-y-8">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF4D00]/20 flex items-center justify-center text-[#FF4D00] font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square sm:aspect-video lg:aspect-square bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl relative">
                  <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1600&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="App Preview" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent flex items-end p-8">
                      <div className="text-2xl font-bold">Prévisualisation instantanée</div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Conçu pour ceux qui créent l'impact.</h2>
            <p className="text-gray-500">Un outil versatile adapté aux créateurs exigeants.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, i) => (
              <div key={i} className="p-8 rounded-3xl bg-orange-50 border border-orange-100">
                <div className="mb-6">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                <p className="text-orange-900/70 text-sm leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-gray-50 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Questions fréquentes</h2>
            <p className="text-gray-500">Tout ce que vous devez savoir sur EcoSub AI.</p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="py-24 bg-white border-t border-gray-100 text-center px-6 flex flex-col items-center">
        <div className="max-w-3xl mx-auto space-y-8 mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight">Prêt à rendre vos vidéos virales ?</h2>
          <p className="text-xl text-gray-500">Rejoignez la nouvelle ère du sous-titrage sémantique et élégant.</p>
          <button 
            onClick={onStart}
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#FF4D00] hover:bg-[#E64500] text-lg font-bold text-white rounded-2xl transition-all active:scale-95 shadow-xl shadow-[#FF4D00]/25"
          >
            Lancer EcoSub AI gratuitement
          </button>
        </div>
        
        {/* Legal Links */}
        <div className="flex flex-col items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <p>Propulsé par Google Gemini & FFmpeg • 2026 EcoSub AI</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <button onClick={() => onOpenLegal && onOpenLegal('cgu')} className="hover:text-gray-900 transition-colors focus:outline-none">CGU</button>
            <button onClick={() => onOpenLegal && onOpenLegal('privacy')} className="hover:text-gray-900 transition-colors focus:outline-none">Confidentialité</button>
            <button onClick={() => onOpenLegal && onOpenLegal('legal')} className="hover:text-gray-900 transition-colors focus:outline-none">Mentions Légales</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
