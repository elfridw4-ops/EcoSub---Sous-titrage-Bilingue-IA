# Dossier de Transfert de Projet (Project Handover) - EcoSub AI

Ce document fournit toutes les informations indispensables pour qu'un développeur senior ou une équipe d'ingénieurs récupère et maintienne efficacement le projet EcoSub AI.

---

## 📐 1. Résumé du Projet

EcoSub AI est un outil Full-Stack haut de gamme de sous-titrage et de stylisation de vidéos assisté par IA. L'application permet d'uploader une vidéo, d'en extraire l'audio, de générer une transcription et une traduction bilingue de précision (Français/Anglais), d'appliquer des styles visuels complexes (et de copier le style d'une autre vidéo de référence), puis d'incruster de manière permanente (hardcode) ces sous-titres à l'aide de FFmpeg côté serveur.

---

## 🛠️ 2. État du Fonctionnalnel (Features Inventory)

### A. Fonctionnalités Principales (Complètes)
- **Transcription & Traduction Bilingue** : Intégration de l'API Gemini 3.5 Flash pour analyser l'audio et générer des segments temporels précis.
- **Incrustation Permanente (Hardcoding)** : Utilisation de FFmpeg (`ffmpeg-static`) pour fusionner le style de sous-titrage ASS directement dans la vidéo MP4.
- **Extraction & Copie de Style (BYO-Style)** : Modèle multimodal de Gemini analysant une image/vidéo de référence pour copier sa configuration esthétique.
- **Portabilité & Stockage Client (IndexedDB)** : Sauvegarde des fichiers Blobs vidéos et historiques de projets directement dans le navigateur sans saturer les serveurs de stockage.
- **Cabine de Vie Privée ("Mes données")** : Outil complet de conformité RGPD (Visualisation de la taille du cache IndexedDB, exportation CSV de l'historique, export JSON des métadonnées, auto-nettoyage proactif de 21 jours, et destruction complète et irréversible de compte).

### B. Fonctionnalités Secondaires (Complètes)
- **Raccourci Admin Discret** : Le panneau d'administration de modération des feedbacks est dissimulé via un raccourci clavier (`Ctrl + Alt + A`) ou un appui de 5 secondes sur le logo du header.
- **Service Worker & PWA Professionnelle** : Installabilité fluide sur Android, Desktop, et bannières didactiques adaptées pour Safari iOS.
- **Notification de Mise à Jour Silencieuse** : Interrogation automatique à l'ouverture de `/version.json` pour informer d'un nouveau build sans couper la session utilisateur.

### C. Fonctionnalités Incomplètes ou Futures (Backlog)
- **Protocoles d'Upload Chunked (Tus)** : Recommandé pour supporter des fichiers vidéo massifs dépassant 250 Mo sans coupure réseau.
- **Génération d'Audio de Synthèse (Voix-Off IA)** : Intégration possible de Gemini pour ajouter un doublage vocal bilingue automatique sur les vidéos.

---

## 🔗 3. Intégrations & Services Externes

- **Google Gemini API** : Via le SDK officiel `@google/genai` pour la transcription, la traduction et la copie visuelle. Fonctionne sur un modèle BYOK (Bring Your Own Key).
- **Firebase Auth** : Gestion unifiée des connexions par Google Sign-In.
- **Firebase Firestore** : Enregistrement distant des retours utilisateurs (feedbacks) avec règles de sécurité strictes d'accès par UID.
- **FFmpeg Utility** : Embarqué de manière statique côté serveur pour l'encodage vidéo.

---

## 🔴 4. Points de Vigilance Critique (Developer Notes)

1. **Sémaphore de Concurrence FFmpeg** : 
   - L'encodage vidéo est une tâche lourde en CPU. Le serveur limite à **2 exécutions concurrentes maximum** via un sémaphore asynchrone (`ffmpegSemaphore` dans `server.ts`). Ne pas augmenter cette limite sans s'assurer de la puissance de calcul du conteneur Cloud Run.
2. **Nettoyage Automatique (Garbage Collector)** :
   - Un script d'arrière-plan inspecte les dossiers `/uploads` et `/outputs` toutes les 15 minutes et supprime définitivement tous les fichiers vieux de plus d'une heure. S'assurer que le serveur dispose d'un espace de stockage temporaire configuré pour les gros volumes de traitement.
3. **Restrictions d'Iframe & Cookies Tiers** :
   - Dans des environnements de test comme l'iframe d'AI Studio, les requêtes nécessitant des identifiants (`withCredentials`) ou cookies échouent en raison des blocages de sécurité des navigateurs. Le système a été stabilisé pour fonctionner de manière entièrement stateless et s'adapter dynamiquement si les cookies de l'Iframe sont bloqués.
