export interface VersionRelease {
  version: string;
  date: string;
  isCritical: boolean;
  changes: string[];
}

export const APP_VERSIONS: VersionRelease[] = [
  {
    version: 'v1.1.0',
    date: '2026-06-17',
    isCritical: false,
    changes: [
      'Conversion complète en Progressive Web App (PWA) de niveau professionnel.',
      'Optimisation SEO avancée (Balises Open Graph, cartes Twitter/X et indexation optimisée).',
      'Système de mise à jour fluide, non intrusive et respectueux de la persistance de session.',
      'Bouton intelligent d\'installation (Android, iOS, Windows, macOS) basé sur le signal d\'installation natif.',
      'Fichier manifeste PWA raffiné avec des icônes multi-résolutions de haute fidélité.',
      'Ajout d\'une page dédiée pour consulter l\'historique détaillé des Notes de version.'
    ]
  },
  {
    version: 'v1.0.1',
    date: '2026-06-15',
    isCritical: false,
    changes: [
      'Améliorations de performance FFT pour le traitement audio de FFmpeg.',
      'Correction d\'un problème de rafraîchissement d\'état sur l\'éditeur de styles.'
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-06-10',
    isCritical: false,
    changes: [
      'Lancement initial d\'EcoSub AI.',
      'Génération automatique de sous-titres bilingues via Google Gemini AI.',
      'Incrustation de sous-titres direct-to-video avec FFmpeg.wasm.',
      'Sauvegarde locale sécurisée des vidéos générées.'
    ]
  }
];

export const CURRENT_VERSION = 'v1.1.0';
