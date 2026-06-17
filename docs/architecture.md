# Architecture & Guide de Démarrage Développeur - EcoSub AI

Ce document présente l'architecture système d'EcoSub AI, ses flux de données internes, la hiérarchie de ses dossiers, de même que ses points critiques afin de servir de guide de bienvenue pour tout nouveau développeur rejoignant le projet.

---

## 📐 1. Vue d’Ensemble & Flux de Données

EcoSub AI est une application **Full-Stack complète** articulée autour de deux axes de communication :
1. **Frontend (Vite + React + Web Worker)** : Gère l'acquisition des vidéos utilisateurs, la modification des styles de sous-titrage grâce à un aperçu temps réel, et la conversion performante sans blocage du thread principal.
2. **Backend (Express + FFmpeg + Gemini API)** : Reçoit les requêtes d'incrustation, appelle l'IA de Gemini pour extraire la transcription textuelle temporelle (SRT/ASS), génère la vidéo finale via des scripts FFmpeg et applique des politiques strictes de sécurité et de nettoyage temporaire.

### Flux d'Incrustation Vidéo :
```
[Utilisateur (UI)] 
    │ 
    ├── (1) Glisse-dépose la vidéo cible (.mp4)
    ├── (2) [Web Worker] Convertit le fichier en base64 de manière asynchrone
    ├── (3) Envoie la vidéo encodée + options de style vers /api/burn-subtitles (server.ts)
    │ 
[Serveur Express (server.ts)]
    │
    ├── (4) Valide le jeton d'authentification et les limites d'utilisation
    ├── (5) Transcrit la voix en sous-titrage SRT en interrogeant Gemini 3.5 Flash
    ├── (6) Convertit le SRT en fichiers d'instructions de style complexes (ASS)
    ├── (7) Exécute FFmpeg (avec limiteur de concurrence de 2 processus max)
    └── (8) Met à disposition la vidéo finale sur la route sécurisée /api/download/:filename
```

---

## 🗂️ 2. Structure Des Fichiers & Responsabilités de Chaque Module

Voici l'analyse détaillée des dossiers et fichiers de notre espace de travail :

### A. Fichiers Systèmes à la Racine du Projet

#### `server.ts`
- **Pourquoi le fichier existe** : Gère l'intégralité du traitement de backend, de l'authentification Express aux tâches FFmpeg lourdes, ainsi que le nettoyage à intervalle régulier de 15 minutes des fichiers temporaires.
- **Ce qui casse s'il disparaît** : Le moteur de traitement vidéo ne peut plus fonctionner. Plus aucune vidéo ne peut être gravée ou téléchargée.
- **Qui l'utilise** : Le frontend (App.tsx) pour l'incrustation et l'interrogation système, et l'hébergement de production Cloud Run.

#### `package.json`
- **Pourquoi le fichier existe** : Déclare les métadonnées de l'application, les commandes de lancement (`dev`, `build`, `start`), ainsi que toutes les dépendances clés (Express, React, Vite, lucide-react, etc.).
- **Ce qui casse s'il disparaît** : L'application n'a plus de repères de dépendances et s'arrête immédiatement de pouvoir compiler.
- **Qui l'utilise** : L'environnement Node.js, le gestionnaire de paquets npm et Vite.

---

### B. Le Dossier source `/src`

#### `/src/App.tsx`
- **Pourquoi le fichier existe** : Point d'accès et pivot central de l'application utilisateur. Il pilote le cycle de vie du traitement vidéo et harmonise les blocs fonctionnels.
- **Ce qui casse s'il disparaît** : L'interface utilisateur de l'application cesse intégralement d'être rendue.
- **Qui l'utilise** : L'utilisateur final et `/src/main.tsx`.

#### `/src/components/ApiKeyConfig.tsx`
- **Pourquoi le fichier existe** : Isole la récolte, le stockage optionnel chiffré localement et la vérification de l'existence et du bon fonctionnement de la clé API Gemini de l'utilisateur (BYOK).
- **Ce qui casse s'il disparaît** : L'utilisateur ne peut plus entrer sa propre clé de calcul sans exposer l'architecture globale à des pannes ou à du vol de secrets.
- **Qui l'utilise** :`/src/App.tsx`.

#### `/src/components/StyleEditor.tsx`
- **Pourquoi le fichier existe** : Fournit les contrôles interactifs visuels complets pour configurer le style ASS des sous-titres, avec un espace d'aperçu dynamique. Est maintenant isolé pour éviter les re-rendus monolithes.
- **Ce qui casse s'il disparaît** : L'utilisateur perd la possibilité d'éditer ou de choisir les presets (YouTube Classic, Netflix, Modern Green).
- **Qui l'utilise** :`/src/App.tsx`.

#### `/src/workers/fileWorker.ts`
- **Pourquoi le fichier existe** : Isoler l'opération extrêmement coûteuse d'encodage de fichiers vidéo lourds en Base64 sur un thread de calcul secondaire indépendant de l'Iframe, garantissant une UI réactive à 60 FPS.
- **Ce qui casse s'il disparaît** : Le navigateur gèle (UI blocking) sur les vidéos dépassant 15 Mo pendant plus de 4 secondes.
- **Qui l'utilise** : L'utilisateur via l'application pour l'upload de fichiers.

#### `/src/data/versions.ts`
- **Pourquoi le fichier existe** : Centralise l'état du registre global des versions (changelogs, criticité, dates d'incréments) comme source de vérité unique pour les composants utilisateur et de mise à jour.
- **Ce qui casse s'il disparaît** : Le VersionManager et ChangelogModal perdent leurs repères de versionning et bloquent l'affichage à l'évaluation d'état.
- **Qui l'utilise** : `/src/App.tsx`, `VersionManager.tsx`, et `/src/components/ChangelogModal.tsx`.

#### `/src/components/VersionManager.tsx`
- **Pourquoi le fichier existe** : Effectue une vérification de version silencieuse à l'ouverture en comparant la version locale avec `/version.json` sur le serveur et interagit avec le Service Worker pour notifier sans déconnecter ou perdre de session.
- **Ce qui casse s'il disparaît** : Les utilisateurs ne reçoivent plus de notifications fluides de nouvelles fonctionnalités et restent bloqués sur des caches navigateur obsolètes.
- **Qui l'utilise** : `/src/App.tsx` globalement.

#### `/src/components/PwaInstallButton.tsx`
- **Pourquoi le fichier existe** : Permet l'installation universelle intelligente sur Android, Windows, macOS, et affiche une bannière guidée élégante spécifique à Safari iOS (iPhone, iPad).
- **Ce qui casse s'il disparaît** : L'expérience d'installation native de l'application mobile est entravée car le prompt de navigateur n'est plus capturé interactivement.
- **Qui l'utilise** : `/src/App.tsx` globalement.

#### `/src/components/MyDataModal.tsx`
- **Pourquoi le fichier existe** : Offre la cabine centrale d'administration du respect de la vie privée ("Mes données") et de conformité RGPD (transparence d'audit de stockage, exportations en JSON/CSV, purge d'historique, auto-nettoyage pro-actif et effacement destructif de compte).
- **Ce qui casse s'il disparaît** : L'utilisateur n'a plus aucun moyen de contrôler le stockage des vidéos lourdes dans son IndexedDB locale, d'exporter ses données personnelles ni de supprimer son compte d'évaluation légalement.
- **Qui l'utilise** : `/src/App.tsx`.

#### `/src/utils/styles.ts`
- **Pourquoi le fichier existe** : Centralise la définition de l'interface `SubtitleStyle` et la structure des objets de presets réutilisables, servant de source unique de vérité esthétique.
- **Ce qui casse s'il disparaît** : Dysfonctionnement immédiat de l'éditeur de style et perte des styles d'incrustation.
- **Qui l'utilise** : `/src/components/StyleEditor.tsx` et `/src/App.tsx`.

#### `/src/utils/storage.ts`
- **Pourquoi le fichier existe** : Centralise l'utilisation d'IndexedDB pour la sauvegarde et l'indexation de l'historique des vidéos traitées.
- **Ce qui casse s'il disparaît** : L'utilisateur perd ses sessions d'historique s'il rafraîchit son navigateur.
- **Qui l'utilise** : `/src/App.tsx`.

#### `/src/utils/errors.ts`
- **Pourquoi le fichier existe** : Harmonise la gestion des erreurs réseau, cookies tiers, base de données Firestore et clés d'API Gemini.
- **Ce qui casse s'il disparaît** : Les incidents de navigation se traduisent par des fenêtres blanches d'erreur brutes inutilisables par l'utilisateur.
- **Qui l'utilise** : L'ensemble des modules frontend.

---

## 🛠️ 3. Dépendances Clés & Utilités

- **`@google/genai`** : SDK officiel de Google pour communiquer de manière réactive avec l'intelligence artificielle Gemini.
- **`motion/react`** : Framework d'animation pour les entrées, transitions et modifications d'éléments d'interface sans layout shift.
- **`lucide-react`** : Pack d'icônes vectorielles standardisé.
- **`express` & `multer`** : Prise en charge des requêtes HTTP et de l'upload segmenté de fichiers vidéos multiparts.
- **`ffmpeg-static`** : Bibliothèque binaire packagée de FFmpeg pour brûler et encoder de manière native et permanente les sous-titres sur la vidéo.

---

## ⚡ 4. Conventions de Code & Nommage
- **Composants** : Déclarations de composants fonctionnels TypeScript, typés explicitement avec le préfixe strict `react-example`.
- **Nommage des fichiers** : PascalCase pour les composants React (`StyleEditor.tsx`) et camelCase pour les fichiers utilitaires standard (`styles.ts`, `fileWorker.ts`).
- **Styles** : Utilisation exclusive du framework utilitaire **Tailwind CSS**.

---

## 🔴 5. Points Critiques & Améliorations Futures

1. **Isolation des Processus FFmpeg** : Actuellement régulée par un sémaphore de concurrency à `2` dans `server.ts` pour empêcher les crashs de surcharge CPU (DoS).
2. **Persistence Sécurisée (Local Storage VS Firestore)** : La clé d'API Gemini est stockée dans le LocalStorage de l'utilisateur pour préserver la structure BYOK.
3. **Optimisation Future** : Implémenter le chargement morcelé (Tus / protocoles chunked) pour l'upload d'immenses fichiers vidéo dépassant 250 Mo.
