# Guide d'Installation et Configuration Locale (Local Setup) - EcoSub AI

Ce document détaille les prérequis, la structure des répertoires et toutes les commandes de terminal nécessaires pour installer, exécuter, compiler et tester EcoSub AI dans un environnement de développement local.

---

## 📐 1. Prérequis Système

Pour faire tourner le projet localement dans des conditions optimales, vous devez disposer des éléments suivants :

- **Node.js** : Version `18.x` ou supérieure (Version recommandée : `20.x` ou `22.x` LTS).
- **Gestionnaire de Paquets** : `npm` v9.x+ (ou `yarn` / `pnpm`).
- **FFmpeg** : Bien que le projet utilise `ffmpeg-static` pour installer une version binaire packagée au démarrage, disposer d'une installation globale de FFmpeg sur votre machine de développement est un atout pour le débogage.

---

## 🗂️ 2. Structure Générale des Dossiers

```text
/
├── docs/                     # Système documentaire vivant du projet
├── public/                   # Actifs publics statiques, icônes et manifeste PWA
│   └── icons/                # Icônes de résolutions multiples pour la PWA
├── src/                      # Code source principal (Frontend React)
│   ├── components/           # Composants isolés réutilisables (StyleEditor, ApiKeyConfig, etc.)
│   │   └── legal/            # Composants et contenus juridiques (LegalModal)
│   ├── data/                 # Modélisation des données locales et changelogs de versions
│   ├── lib/                  # Gestionnaires de navigation et utilitaires transverses
│   ├── utils/                # Logique de calcul, IndexedDB et gestion des styles ASS
│   └── workers/              # Threads d'arrière-plan (Web Worker Base64)
├── server.ts                 # Point d'entrée du serveur de backend (Express / FFmpeg)
├── package.json              # Déclarations des dépendances et scripts
└── vite.config.ts            # Configuration du bundler Vite et plugin PWA
```

---

## ⚡ 3. Commandes d'Exécution de Terminal

Exécutez ces commandes à la racine du projet :

### A. Installation des Dépendances
Installez l'ensemble des modules requis déclarés dans `package.json` :
```bash
npm install
```

### B. Lancement en Mode Développement
Démarre simultanément le serveur de backend Express et le middleware de prévisualisation à chaud de Vite grâce à l'utilitaire `tsx` :
```bash
npm run dev
```
- Le serveur sera accessible localement à l'adresse suivante : **`http://localhost:3000`**

### C. Validation et Audit Syntaxique (Linter)
Vérifie la conformité des types TypeScript sur l'ensemble de la base de code sans produire de fichiers compilés :
```bash
npm run lint
```

### D. Compilation pour la Production (Build)
Compile le frontend React en fichiers HTML/JS/CSS statiques optimisés dans le dossier `/dist` :
```bash
npm run build
```

### E. Prévisualisation locale de la Production (Preview)
Permet de tester localement le build de production statique généré :
```bash
npm run preview
```

### F. Nettoyage des fichiers temporaires (Clean)
Vide le dossier `/dist` des anciennes compilations de production :
```bash
npm run clean
```

---

## 🔴 4. Points d'Entrée Importants du Code

- **Frontend** : `/src/main.tsx` (Rend le composant racine `/src/App.tsx`).
- **Backend** : `/server.ts` (Gère les requêtes d'incrustation vidéo et de téléchargement).
- **Styles CSS Globaux** : `/src/index.css` (Importe Tailwind CSS et définit les variables de polices d'écriture).
