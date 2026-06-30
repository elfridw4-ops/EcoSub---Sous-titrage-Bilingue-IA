# Registre des Limitations et Compromis Techniques (Known Limitations) - EcoSub AI

Ce document présente en toute transparence les limites structurelles, les compromis de conception et les dettes techniques identifiées sur le projet EcoSub AI, permettant aux équipes d'anticiper les comportements d'exécution.

---

## 📐 1. Limitations Techniques Structurelles

### A. Limites de Taille de Fichiers Vidéo
- **Limite Actuelle** : 100 Mo pour le chargement d'une vidéo cible.
- **Pourquoi cette limite** : 
  - Pour éviter d'épuiser l'espace disque temporaire ou la mémoire vive (RAM) du conteneur Cloud Run lors des calculs d'incrustation de FFmpeg.
  - La conversion asynchrone des fichiers vidéo en chaîne Base64 via le Web Worker (`fileWorker.ts`) sature la mémoire du navigateur sur des fichiers extrêmement volumineux (supérieurs à 150 Mo).

### B. Prise en Charge des Formats Vidéo
- **Format Recommandé** : `.mp4` avec codec vidéo H.264 et audio AAC.
- **Comportement sur d'autres formats** : Bien que FFmpeg supporte de nombreux formats (MOV, AVI, MKV), certains codecs propriétaires d'iOS ou de caméras professionnelles peuvent échouer à être décodés ou transcodés proprement sans ajustements de paramètres.

---

## 🛠️ 2. Compromis et Choix Architecturaux

### A. Le Stockage Local IndexedDB (Périphérie Client)
- **Compromis** : L'historique complet des projets et les Blobs vidéo sont conservés dans l'IndexedDB locale du navigateur.
- **Risques** :
  - Si l'utilisateur vide l'historique ou le cache de son navigateur de manière agressive, l'intégralité de son historique de sous-titres et ses vidéos associées seront définitivement perdues.
  - La limite d'espace disque allouée à IndexedDB varie selon les navigateurs (généralement 50 % de l'espace disque libre sur Chrome, mais beaucoup plus restrictive sur Safari iOS).

### B. Le Modèle d'Inférence IA Probabiliste (BYOK Gemini)
- **Compromis** : Les transcriptions textuelles et traductions automatiques sont générées par intelligence artificielle de manière probabiliste.
- **Risques** : Risque d'hallucinations d'IA, de contresens linguistiques ou d'erreurs de synchronisation d'horodatage sur des vidéos comportant du bruit de fond ou des voix multiples. L'utilisateur doit impérativement relire ou réviser son contenu.

---

## 📉 3. Dette Technique & Améliorations Futures

1. **Intégration d'un Lecteur Vidéo Avancé** : Le lecteur vidéo actuel utilise les contrôles natifs du navigateur. Intégrer un lecteur personnalisé (ex: Plyr ou Video.js) permettrait une meilleure synchronisation de l'aperçu dynamique des styles ASS.
2. **Support Multilingue de l'Interface** : L'interface utilisateur est actuellement rédigée exclusivement en Français. Une internationalisation complète (i18n) serait nécessaire pour étendre l'audience de l'outil.
