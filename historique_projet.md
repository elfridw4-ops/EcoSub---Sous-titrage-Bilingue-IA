# Historique du Projet - EcoSub AI

## Présentation du projet
- **Nom du projet** : EcoSub AI
- **Objectif** : Transformer des vidéos en contenus bilingues élégants en quelques secondes grâce à l'IA.
- **Utilisateurs cibles** : Créateurs de contenu, formateurs, et toute personne souhaitant rendre ses vidéos accessibles dans deux langues (Français/Anglais).
- **Fonctionnalités principales** :
    - Détection automatique de la langue (FR/EN).
    - Transcription et traduction via Gemini 1.5 Flash.
    - Incrustation de sous-titres (Burn-in) avec styles personnalisables.
    - Copie de style à partir d'une vidéo de référence.
    - Stockage local des vidéos générées (IndexedDB).
    - Barre de progression du téléchargement.

## Architecture
- **Architecture globale** : Application Full-Stack (Frontend React + Backend Express).
- **Technologies utilisées** :
    - **Interface utilisateur** : React, Vite, Tailwind CSS, Motion (framer-motion), Lucide-React.
    - **Serveur** : Node.js, Express, Multer (upload), FFmpeg (traitement vidéo).
    - **Base de données** : Firebase Firestore (historique/stats), IndexedDB (stockage local des fichiers volumineux).
    - **Hébergement** : Compatible avec les plateformes supportant Node.js (Render, Railway, Google Cloud Run).
- **Flux de données** :
    1. L'utilisateur uploade une vidéo (et optionnellement une référence).
    2. Le serveur stocke temporairement les fichiers.
    3. Le frontend envoie la vidéo à Gemini pour analyse (transcription, traduction, style).
    4. Le serveur utilise FFmpeg pour incruster les sous-titres selon les données de Gemini.
    5. La vidéo finale est téléchargée par le frontend et stockée dans IndexedDB.

## Décisions techniques
- **Stockage Local (IndexedDB)** : Choisi pour éviter de saturer les serveurs et respecter la vie privée des utilisateurs tout en permettant une persistance dans le navigateur.
- **Clé API au Backend** : Pour sécuriser la clé Gemini et simplifier l'expérience utilisateur.
- **XMLHttpRequest pour l'Upload** : Utilisé à la place de `fetch` pour pouvoir suivre la progression réelle de l'upload via l'événement `onprogress`.
- **Suppression des Emojis** : Décision de simplifier le rendu visuel pour un aspect plus professionnel et raffiné.

## Historique des modifications
- **2026-03-19** :
    - Implémentation du stockage local via IndexedDB.
    - Amélioration de la gestion des erreurs de téléchargement.
    - Suppression de toutes les références aux emojis.
    - Ajout d'une barre de progression visuelle pour l'upload.
    - Ajout d'une bannière de détection d'iframe pour prévenir les problèmes de cookies.
