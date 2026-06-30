# Tasks Tracking - EcoSub AI

## Fonctionnalités implémentées
- [x] Module complet de gestion et de suppression des données personnelles ("Mes données") conforme RGPD.
- [x] Application PWA complète (Service Worker, Manifest, Cache).
- [x] Système de feedback utilisateur complet (formulaire, dashboard admin, notation).
- [x] Bouton d'installation PWA contextuel.
- [x] SEO complet (Open Graph, Twitter Meta Tags).
- [x] Architecture BYOK (Bring Your Own Key) pour l'indépendance totale.
- [x] Transcription et Traduction automatique (Gemini).
- [x] Incrustation de sous-titres via FFmpeg.
- [x] Système de styles personnalisables et presets.
- [x] Copie de style via vidéo de référence.
- [x] Authentification Google (Firebase).
- [x] Stockage local persistant (IndexedDB).
- [x] Barre de progression de l'upload.
- [x] Système d'onboarding (slides de présentation).
- [x] Gestion robuste des erreurs et bannières d'aide (Iframe/Cookies).
- [x] Implémentation complète du Glisser-Déposer (Drag and Drop) fluide et dynamique sur les zones d'upload.
- [x] Modélisation de la stratégie SEO, charte graphique et guide d'architecture technique complets.
- [x] Masquage du bouton Dashboard Administrateur (sécurisation UX via raccourci clavier ou pression de 5 secondes sur le logo).
- [x] Transfert et restructuration du Dashboard Administrateur vers une section dédiée indépendante (`AdminPanel.tsx`), épurant l'UI principale.

## Bogues corrigés
- [x] Correction de la faille de sécurité (Path Traversal) dans le backend.
- [x] Ajout d'un Garbage Collector pour éviter la saturation du disque serveur.
- [x] Ajout d'un limiteur de concurrence FFmpeg pour prévenir les attaques DoS.
- [x] Correction des erreurs de cookies dans les iframes (workaround fetch/banner).
- [x] Correction de la validation des clés API (Résolution de l'erreur 404 en migrant de gemini-1.5-flash déprécié vers gemini-3.5-flash).
- [x] Correction de la persistance des styles lors de la copie par référence.
- [x] Suppression du blocage du thread principal (Frontend) via l'intégration d'un Web Worker pour l'encodage Base64.
- [x] Résolution des re-rendus excessifs en découpant le monolithe App.tsx en composants isolés (ApiKeyConfig, StyleEditor).
- [x] Résolution du dysfonctionnement de chevauchement de balises et correction syntaxique d'importation dans `App.tsx` (validation linter & compilation à 100%).
- [x] Sécurisation et verrouillage dynamique visualisé des deux dalles d'importation (Cible et Référence) en cas de blocage d'Iframe par cookies tiers.
- [x] Nettoyage et assainissement complet des ressources graphiques de l'application (suppression des anciens fichiers `.jpg` obsolètes au profit des nouveaux PNG haute-résolution dans `/public/icons/`).
- [x] Standardisation de l'identité de marque par le remplacement de tous les placeholders d'icônes et logos d'exemples par l'asset personnalisé haut de gamme (/icons/apple-touch-icon.png) sur la Landing Page et le tableau de bord principal.
- [x] Réalisation et compilation complète du dossier de pré-audit juridique, RGPD, et EU AI Act compilé dans `/docs/pre_audit_juridique.md` pour soumission externe (Perplexity).
- [x] Correction de l'erreur réseau "Le téléchargement a échoué (0): Network Error" liée à l'interdiction par les navigateurs d'inclure des cookies/identifiants tiers dans des iframes isolées (retrait de withCredentials et credentials:'include' sur tous les appels d'API, le backend étant de fait entièrement sans état).
- [x] Analyse et établissement du Plan Directeur Légale suite aux retours de l'audit externe de Perplexity (CGU, Confidentialité, Mentions légales).
- [x] Phase de Rédaction : Création de `legalContent.ts` encodant les Conditions d'utilisation structurées (incluant l'exonération d'hallucinations IA), la Politique de Confidentialité (incluant le fonctionnement BYOK/Google AI Studio et cycle des données) et les Mentions Légales.
- [x] Remaniement Typographique Légale : Application du formatage Markdown avancé aux documents juridiques (titres, listes structurées, tableaux, sections de citations) et enrichissement massif des Mentions Légales (P.I. et Hébergement).
- [x] Intégration UX : Implémentation du composant dynamique React `LegalModal.tsx` et mise à jour des footers de l'application (Landing Page et Dashboard) pour relier les documents.

## Tâches en cours
- [x] Implémentation du système de versionning global (v1.1.0) conforme avec notes de version interactives (`ChangelogModal.tsx` et registre `/src/data/versions.ts`).
- [x] Intégration de la notification de mise à jour silencieuse proactive à l'ouverture en interrogeant `/version.json` sans déconnexion utilisateur.
- [x] Conception et intégration de la bannière et des bulles d'aide interactives spécifiques à Safari iOS pour l'installation manuelle.
- [x] Conception et validation de la Landing Page d'EcoSub AI (Audit produit, Rédaction de la proposition de valeur, validation UX et implémentation finale).
- [x] Documentation complète du projet (Initialisation, stratégie SEO, charte graphique avancée, index d'architecture d'onboarding, et audit de conformité PWA).
- [x] Conception du contrôleur des retours virtuels pour intercepter le bouton Retour d'Android (NavigationManager/HistoryAPI, double-tap-to-exit pour PWA).
- [x] Résolution de l'URL de partage et Open Graph en préproduction : Remplacement de l'adresse codée en dur par l'URL active de prévisualisation et injection d'un adaptateur automatique par JavaScript.
- [ ] Optimisation de la taille des fichiers FFmpeg.
- [ ] Support de formats vidéo supplémentaires.
