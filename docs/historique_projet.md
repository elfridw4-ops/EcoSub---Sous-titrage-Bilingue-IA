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
- **2026-06-25** :
    - **Refonte des Documents Légaux et Ajout de la Politique de Cookies** : Mise en conformité RGPD, Code du Numérique et EU AI Act de l'ensemble des pages légales. Séparation structurée des CGU, Politique de Confidentialité et Mentions Légales en sections thématiques distinctes. Conception d'une nouvelle politique de gestion des cookies techniques et locaux.
    - **Conception du LegalModal Dual-Pane & Sommaire Dynamique** : Refonte de la modale d'affichage avec l'ajout d'une table des matières interactive (ToC) cliquable, gestion dynamique de la section active lors du défilement, affichage proéminent de la date de mise à jour et d'un point de contact d'aide légale (`elfridw4@gmail.com`). Support d'une barre de navigation sémantique pour les smartphones.
- **2026-06-17** :
    - **Optimisation du Partage en Préproduction (Open Graph & Canonical)** : Résolution de la problématique de l'aperçu de partage de l'application. Les balises Meta et Canonical dans `index.html` référençaient en dur l'adresse finale non encore configurée (https://ecosub.ai). Remplacement par l'adresse courante active de prévisualisation d'AI Studio et injection d'un adaptateur JavaScript dynamique de correction d'origine pour que l'application s'ajuste d'elle-même au domaine de production dès qu'il sera déployé et acheté.
    - **Définition de la Stratégie Légale et de Conformité** : Analyse des retours d'audit juridique externes (Perplexity) au regard de l'architecture d'EcoSub AI. Établissement du plan d'action documentaire classifiant la stricte nécessité des CGU avec clause d'exonération IA, de la Politique de Confidentialité transparente sur le modèle BYOK, avec éviction confirmée des documents mercantiles (CGV) non applicables à ce stade.
    - **Résolution de l'Erreur de Téléchargement/Upload Réseau (`Network Error`)** : Correction critique de l'erreur `Le téléchargement a échoué (0): Network Error` empêchant l'upload ou l'incrustation vidéo sur certains navigateurs. Le problème était causé par la configuration `withCredentials = true` et `credentials: 'include'` sur les appels AJAX et Fetch vers notre API. Au sein des iframes de prévisualisation isolées d'AI Studio, les politiques de blocage de cookies tiers provoquent systématiquement un rejet sécurisé par le navigateur de toute requête requérant expressément des identifiants (status 0). Les requêtes ont été passées en mode par défaut sans état (le backend étant entièrement stateless et ne vérifiant de fait aucune session cookie).
    - **Création du Dossier de Pré-Audit Juridique (`pre_audit_juridique.md`)** : Élaboration d'une analyse complète d'architecture, des flux de données, de l'inventaire RGPD des données personnelles collectées/traitées et de l'identification des risques majeurs (Voice-Biometrics, BYOK, fuites d'URLs, saturation d'infrastructure) pour alimenter le moteur d'ingénierie légale Perplexity.
    - **Uniformisation et Optimisation des Actifs Graphiques (Icônes & Logos)** : Suppression définitive des anciens fichiers `.jpg` obsolètes (`pwa-192x192.jpg` et `pwa-512x512.jpg`) au profit des icônes haute-résolution fraîchement créées et intégrées dans le répertoire `/public/icons/` (les PNG `apple-touch-icon.png`, `social-card-og-1200x630.png`, etc.). Cela renforce la cohérence graphique et assure des performances de cache PWA optimales en évitant les doublons.
    - **Cabinet complet de gestion des données ("Mes données" / RGPD)** : Création d'une interface et d'un modal interactif permettant à l'utilisateur d'auditer en toute transparence son stockage local (volume calculé en Ko/Mo depuis IndexedDB) et distant, d'exporter ses données en un clic (JSON complet + CSV d'historique formaté), d'activer ou d'exécuter un auto-nettoyage de rétention de projets locaux à 21 jours, de supprimer individuellement ses projets ou feedbacks, de purger globalement son historique ou de supprimer définitivement son compte utilisateur.
    - **Sécurisation et Journalisation d'Audit** : Configuration d'un logger d'opérations de sécurité d'audit RGPD pour s'assurer de la traçabilité des actions critiques en local, durcissement des règles de sécurité Firestore (`firestore.rules`) pour la collection `feedbacks` en restreignant la lecture/suppression par filtrage d'UID, et déploiement immédiat.
    - **PWA de Niveau Professionnel (Lighthouse ≥ 90/100)** : Configuration du jeu d'icônes complet multi-résolutions (du 16x16 au 512x512) dans `/public/icons/` pour l'installabilité universelle fluide et soignée.
    - **Double Système de Comparaison de Versions Silencieuse** : Lancement d'une requête d'interrogation proactive de `/version.json` à l'ouverture de l'application pour vérifier l'état du serveur en temps réel et notification non invasive s'exécutant sur le Service Worker.
    - **Mise à Jour Non Intrusive** : Système de conservation intégrale de session et de données d'indexation locale (IndexedDB / Local-state / Firebase Persisted Auth) lors de l'application sécurisée de la mise à jour (Actualisation douce via actualisation de cache de Service Worker).
    - **Sélecteur Contextuel d'Installation Universel (`PwaInstallButton.tsx`)** : Capture de l'événement natif `beforeinstallprompt` (Chrome, Android, Edge, Windows, macOS) et intégration de bannières d'instructions didactiques animées exclusives pour Safari iOS.
    - **Dialogue Centralisé de l'Historique de Version (`ChangelogModal.tsx`)** : Création d'une bibliothèque d'historique (`/src/data/versions.ts`) et de son interface interactive correspondante, accessible via un lien de pied de page discret et soigné dans toute l'application.
- **2026-06-16** :
    - **Intégration et Refonte Complète du Feedback Premium (SaaS)** : Création d'un système de feedback complet avec un bouton visible sur toutes les pages, une modale de saisie minimaliste professionnelle avec système d'évaluation 5 étoiles élégant (fini les emojis enfantins et smileys jaunes conformes aux critères de grandes marques type Linear, Stripe, Vercel), états de chargement et de succès, ainsi qu'un enregistrement automatique dans Firestore des détails de session (page, version, navigateur, appareil, utilisateur connecté).
    - **Tableau de Bord Admin Feedback** : Intégration d'un module d'administration pour filtrer, consulter et mettre à jour le statut des feedbacks reçus (Nouveau, En cours, Planifié, Résolu, Rejeté).
    - **Mise en Conformité Complète PWA (Android / iOS)** : Configuration des balises de cache et du manifeste PWA (dans `vite.config.ts` et `index.html`), génération asynchrone des icônes d'application haute définition conformes aux directives et ratios d'aspect (192x192 et 512x512 JPG masquables), garantissant ainsi un comportement standalone fluide, le support de l'installation native et la détection auto-update dynamique des versions via le `VersionManager`.
    - **Alignement SEO et Partages Sociaux (WhatsApp/Facebook/LinkedIn/Twitter)** : Optimisation complète et enrichissement des balises Meta Open Graph de `index.html` avec utilisation d'URLs d'images absolues et formats standards supportés par tous les moteurs de crawl.
    - **Intégration du Glisser-Déposer (Drag and Drop)** : Ajout d'une gestion complète du glisser-déposer sur les deux zones de chargement de vidéos (Vidéo Cible et Vidéo Référence). Amélioration visuelle avec transitions fluides au survol et retour haptique d'échelle via `motion/react`.
    - **Création de la Documentation Système** : Production et intégration de la stratégie SEO, de la charte graphique globale unissant l'image de marque et du guide d'architecture complet d'onboarding technique (fichiers `/docs/seo.md`, `/docs/charte_graphique.md`, `/docs/architecture.md`).
    - **Refactorisation Modulaire (Frontend)** : Découpage du fichier monolithique `App.tsx` en composants hautement réutilisables et isolés (`ApiKeyConfig.tsx` et `StyleEditor.tsx`). Isolation de la validation des clés d'API et du style de rendu des sous-titres pour empêcher les re-rendus globaux inefficaces.
    - **Optimisation Performance (Web Worker)** : Création et déploiement d'un Web Worker dédié (`fileWorker.ts`) pour gérer de manière non blocante l'encodage asynchrone Base64 des fichiers vidéo lourds sur un thread secondaire sans perturber le thread principal (UI).
    - **Résolution Dépréciations API & 404** : Migration des requêtes de validation et du moteur de transcription principal vers le modèle de production standard `gemini-3.5-flash` pour corriger les erreurs critiques `404` provoquées par la fin de support du modèle `gemini-1.5-flash`.
    - **Correction et uniformisation syntaxique d'importation** : Résolution du dysfonctionnement de chevauchement de balises HTML et assainissement de l'imbrication des balises de dalles d'importation vidéo. Sécurisation du verrouillage visuel de l'importateur lors du blocage Iframe/Cookies tiers.
    - **Création et intégration de la Landing Page** : Suite à un audit produit exhaustif, mise en œuvre d'une page d'accueil professionnelle (Hero Section, Pitch, Fonctionnalités, Use Cases, FAQ) respectant parfaitement la charte visuelle d'EcoSub AI. Remplacement modal d'onboarding complet par ce composant (`LandingPage.tsx`).
    - **Sécurisation UI et Masquage Admin** : Suppression du bouton public d'accès au Dashboard administrateur. Implémentation d'un accès secret via une longue pression (5s) sur le logo du header ou via le raccourci clavier masqué (Ctrl + Alt + A).
    - **Refonte Interface Administrateur** : Extraction de l'ancien Dashboard Administrateur en ligne dans `App.tsx` vers une nouvelle page dédiée, indépendante et professionnelle (`AdminPanel.tsx`). Cette page offre diverses options (Vue d'ensemble, Utilisateurs, Système) avec une navigation structurée, protégeant l'application d'un chevauchement d'UX et sécurisant la modération des utilisateurs.
- **2026-04-14** :
    - **Sécurité Backend** : Correction d'une faille critique de Path Traversal sur les routes de téléchargement et de traitement vidéo.
    - **Stabilité Backend** : Implémentation d'un Garbage Collector pour supprimer automatiquement les vidéos vieilles de plus d'une heure (prévention de la saturation disque).
    - **Performance Backend** : Ajout d'un sémaphore asynchrone pour limiter la concurrence de FFmpeg à 2 processus simultanés (prévention des attaques DoS par épuisement CPU/RAM).
- **2026-04-05** :
    - Masquage du panneau de configuration de la clé API (BYOK). Il est désormais accessible via un bouton dans l'en-tête (header) et s'affiche automatiquement si aucune clé n'est configurée.
    - Transition vers une architecture BYOK (Bring Your Own Key).
    - Suppression de la clé API système et des quotas d'utilisation.
    - Ajout d'un champ de saisie pour la clé API Gemini de l'utilisateur.
- **2026-03-19** :
    - Implémentation du stockage local via IndexedDB.
    - Amélioration de la gestion des erreurs de téléchargement.
    - Suppression de toutes les références aux emojis.
    - Ajout d'une barre de progression visuelle pour l'upload.
    - Ajout d'une bannière de détection d'iframe pour prévenir les problèmes de cookies.
