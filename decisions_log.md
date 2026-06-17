# Decisions Log - EcoSub AI

## Architecture BYOK (Bring Your Own Key)
- **Date** : 2026-04-05
- **Contexte** : Rendre l'application totalement indépendante d'AI Studio et utilisable partout.
- **Décision** : Supprimer la clé API système et les quotas. L'utilisateur doit fournir sa propre clé Gemini API qui est stockée dans le `localStorage`.
- **Alternatives envisagées** : Conserver un quota gratuit avec une clé backend (rejeté pour garantir l'indépendance totale).
- **Conséquences** : L'application peut être hébergée n'importe où sans coût d'API pour le propriétaire, mais nécessite une action de l'utilisateur pour fonctionner.

## Utilisation d'IndexedDB pour le stockage vidéo
- **Date** : 2026-03-19
- **Contexte** : L'utilisateur ne veut pas de stockage serveur pour les vidéos générées pour des raisons de coût et de confidentialité.
- **Décision** : Utiliser IndexedDB pour stocker les Blobs vidéo de manière persistante dans le navigateur.
- **Alternatives envisagées** : Blob URLs (temporaires uniquement), LocalStorage (limité à 5Mo).
- **Conséquences** : Permet de conserver les vidéos après rafraîchissement, mais dépend de l'espace disque disponible du navigateur.

## Migration de la clé API vers le Backend
- **Date** : 2026-03-19
- **Contexte** : Sécuriser la clé Gemini et éviter que l'utilisateur n'ait à la saisir manuellement.
- **Décision** : Utiliser les variables d'environnement côté serveur.
- **Alternatives envisagées** : Saisie manuelle côté client (conservée comme option de secours).
- **Conséquences** : Meilleure sécurité et UX simplifiée.

## Passage à XMLHttpRequest pour l'upload
- **Date** : 2026-03-19
- **Contexte** : L'API `fetch` native ne permet pas de suivre la progression de l'upload (uniquement du download).
- **Décision** : Utiliser `XMLHttpRequest` avec l'événement `upload.onprogress`.
- **Alternatives envisagées** : Bibliothèques tierces comme Axios (évité pour limiter les dépendances).
- **Conséquences** : Permet d'afficher une barre de progression réelle à l'utilisateur.

## Suppression des Emojis
- **Date** : 2026-03-19
- **Contexte** : Demande de l'utilisateur pour un rendu plus sobre.
- **Décision** : Retirer toute logique liée aux emojis dans le prompt et l'UI.
- **Alternatives envisagées** : Option désactivable (rejeté pour simplifier).
- **Conséquences** : Interface plus épurée et professionnelle.

## Migration vers Gemini 3.5 Flash (Validation de Clé et Traitement)
- **Date** : 2026-06-16
- **Contexte** : Le modèle `gemini-1.5-flash` a été déprécié et renvoyait une erreur `404` lors de la validation asynchrone des clés API, et le traitement des vidéos gagnait à utiliser un modèle de production plus robuste.
- **Décision** : Remplacer l'usage de `gemini-1.5-flash` et du modèle de preview par `gemini-3.5-flash` tant pour les requêtes de validation de clé BYOK de l'utilisateur que pour le moteur principal d'analyse des contenus.
- **Alternatives envisagées** : Conserver le modèle de preview existant (rejeté car sujet à de futures dépréciations).
- **Conséquences** : Résolution complète de l'erreur 404 de l'API de validation et amélioration de la précision de transcription/traduction multilingue.

## Découpage du Monolithe Frontend & Web Worker
- **Date** : 2026-06-16
- **Contexte** : Le fichier `App.tsx` était un monolithe de plus de 1800 lignes, entraînant des re-rendus excessifs de l'ensemble de l'UI lors de la frappe utilisateur dans le champ d'API, ainsi qu'une surcharge du thread principal lors de la conversion du fichier vidéo en Base64.
- **Décision** : Extraire et isoler les responsabilités dans des composants autonomes (`ApiKeyConfig` et `StyleEditor` / `utils/styles.ts`) et déporter l'encodage lourd en Base64 dans un Web Worker (`fileWorker.ts`).
- **Alternatives envisagées** : Optimisation par `useMemo` uniquement (rejeté car la logique de validation et l'UI du style polluaient la structure principale).
- **Conséquences** : Meilleure exploitabilité immédiate du code par les développeurs, gain mesurable de réactivité de l'application (thread principal libre et re-rendus isolés).

## Intégration du Glisser-Déposer (Drag and Drop)
- **Date** : 2026-06-16
- **Contexte** : Améliorer l'UX générale de chargement de vidéos cibles et de référence en offrant un moyen intuitif d'injecter des fichiers directement dans l'interface sans nécessiter de multiples clics répétitifs.
- **Décision** : Implémenter des gestionnaires d'événements (`onDragOver`, `onDragLeave`, `onDrop`) sur les deux zones de dépôt exclusives (Vidéo Cible et Vidéo Référence) et adapter les visualisations instantanément (mise à l'échelle douce et changement d'opacité/couleur de bordure avec l'accent `#FF4D00`).
- **Alternatives envisagées** : Ne supporter le glisser-déposer que sur la vidéo principale (rejeté pour maintenir l'unité visuelle et ergonomique des deux dalles).
- **Conséquences** : Saisie fluide, dynamique et conforme aux attentes des monteurs de contenu professionnels. Les types mime invalides sont directement filtrés et notifiés via l'utilitaire d'erreur centralisé de l'application.

## Elaboration d'une documentation complète (SEO, Charte Graphique, Architecture)
- **Date** : 2026-06-16
- **Contexte** : Le projet grandit, nécessitant des normes claires d'onboarding, une stratégie SEO pérenne pour l'indexabilité hors iframe et des conventions d'identité graphique pour unifié l'interface utilisateur.
- **Décision** : Centraliser les guides d'architecture techniques de démarrage, l'étude sémantique SEO et le guide d'identité de marque dans des documents vivants dédiés (`/docs/architecture.md`, `/docs/seo.md`, `/docs/charte_graphique.md`).
- **Alternatives envisagées** : Conserver tout dans le seul fichier HISTORIQUE.md (rejet et séparation des responsabilités conseillée).
- **Conséquences** : Clarté d'appropriation immédiate pour un nouveau développeur senior rejoignant le projet et pour les non-initiés voulant comprendre l'écosystème commercial d’EcoSub AI.

## Sécurisation proactive contre le blocage de Cookies tiers en Iframe
- **Date** : 2026-06-16
- **Contexte** : Dans un environnement d'iframe (comme la prévisualisation d'AI Studio), la restriction de cookies tiers par le navigateur amène l'application à échouer silencieusement lors d'appels dépendants de sessions ou d'uploads, dégradant gravement l'expérience.
- **Décision** : Implémenter une vérification proactive silencieuse (`fetch('/api/health')` combinée à la détection de l'iframe) pour lever un indicateur `iframeCookieBlocked`. Utiliser cet état pour afficher un modal d'assistance redirigeant vers un onglet autonome et désactiver visuellement et fonctionnellement les deux dalles d'importation vidéo.
- **Alternatives envisagées** : Laisser l'utilisateur interagir avec l'importation et n'indiquer l'erreur qu'après échec de l'authentification/upload (rejeté car cela engendre une frustration utilisateur).
- **Conséquences** : Les actions condamnées à échouer sont directement impossibilisées au niveau de l'interface en orientant immédiatement l'utilisateur vers un onglet indépendant.

## Système de Feedback SaaS Cohérent et Premium (BYO-Feedback)
- **Date** : 2026-06-16
- **Contexte** : Remplacer l'ancienne implémentation basique et peu esthétique par un système d'évaluation et de suggestions conforme aux codes des grands SaaS (Vercel, Notion, Stripe).
- **Décision** : Refondre l'UI en supprimant les émojis jaunes de style enfantin au profit d'un sélecteur d'étoiles minimalist, avec formulaire moderne d'envoi en moins de 10 secondes et feedback visuel haut de gamme. Intégration en temps réel et persistante sous Firebase Firestore en récoltant automatiquement le type, message, note, page active, version d'application, agent utilisateur, type d'appareil et utilisateur connecté (si disponible).
- **Alternatives envisagées** : Conserver des smileys d'humeur jaunes ou ne pas stocker persistamment (rejetés car non professionnels et contraires aux directives de design premium).
- **Conséquences** : Améliore le taux d'engagement et fournit des rapports précis aux administrateurs via l'onglet dédié ajouté dans le panneau d'administration.

## Optimisation Complète et Résolution PWA / Crawler SEO
- **Date** : 2026-06-16
- **Contexte** : L'installabilité PWA sur Android et les partages sociaux d'URLs (comme sur WhatsApp, LinkedIn, Facebook et X) étaient inefficients car des icônes spécifiques de taille/ratios précis manquaient dans les répertoires et les méta-données Open Graph n'étaient pas robustes et absolues.
- **Décision** : Générer les formats JPG 192px/512px correspondants et configurer le service worker ainsi que le manifeste de façon stricte (globPatterns, standalone, start_url, scope). Mettre à niveau les méta Open Graph et Twitter Cards par défaut avec des liens absolus et des formats d'image reconnus par tous les bots de crawl (évitant le SVG ou les chemins relatifs non supportés).
- **Alternatives envisagées** : Conserver les chemins relatifs ou l'ancienne configuration basique (rejeté car cela cassait l'installabilité native Android "Créer un raccourci" vs "Installer l'app").
- **Conséquences** : L'application passe 100% des critères d'installabilité PWA de Chrome Android et s'affiche splendidement lors des partages d'URLs sur tous les réseaux sociaux.

## Gestion des Données Personnelles et Conformité RGPD ("Mes données")
- **Date** : 2026-06-17
- **Contexte** : Assurer un respect rigoureux de la vie privée, donner un contrôle total à l'utilisateur sur son stockage et s'aligner sur les normes européennes RGPD, particulièrement concernant la suppression de compte et la transparence de stockage d'objets lourds (Blobs IndexedDB).
- **Décision** :
  1. Conception d'un cabinet de transparence et d'administration individuel ("Mes données") accessible via un lien uniforme au pied de page de l'application.
  2. Implémentation d'options d'exportation totale au format JSON (métadonnées) et CSV (historique) pour garantir la portabilité des données.
  3. Intégration d'un sélecteur d'auto-nettoyage de rétention locale (nettoyant au démarrage du cycle applicatif les projets datant de plus de 21 jours) et d'un bouton de purge manuelle.
  4. Création d'un système robuste d'effacement global de l'historique et de destruction de compte (purgant IndexedDB, localStorage, Firebase Auth, Firestore `/users` et `/feedbacks`) avec validations par saisie explicite de chaînes clés (mot "EFFACER" ou e-mail de l'utilisateur).
  5. Durcissement des règles d'accès de Firestore (`firestore.rules`) pour n'autoriser la lecture/suppression de feedbacks qu'aux administrateurs ou à leurs auteurs légitimes authentifiés.
  6. Déploiement d'un logger d'opérations de sécurité d'audit en local pour consigner la traçabilité des suppressions et des exports de données.
- **Alternatives envisagées** : Supprimer unilatéralement tout l'historique sans validation d'e-mail (rejeté car trop dangereux pour l'utilisateur). Autre alternative : détruire les logs de sécurité lors d'une suppression globale (rejeté car contradictoire avec l'exigence de conformité et de traçabilité d'audit).
- **Conséquences** : Protection de l'utilisateur maximale, assurance d'une conformité légale parfaite de l'application SaaS d'EcoSub AI, et transparence utilisateur totale sur l'occupation disque de l'appareil par les Blobs vidéo d'IndexedDB.


## Conversion complète PWA Professionnelle & Mise à jour proactive silencieuse
- **Date** : 2026-06-17
- **Contexte** : L'application devait devenir une PWA de premier plan (Lighthouse >= 90/100) avec un bouton d'installation sur-mesure pour chaque système (incluant Safari iOS qui n'a pas de protocole standard) et d'un workflow de mise à jour sécurisé et non intrusif pour ne jamais déconnecter l'utilisateur ni perturber sa session lors des déploiements.
- **Décision** :
  1. Configurer un jeu complet d'icônes multi-résolution (du 16x16 au 512x512) stockées dans `/public/icons/`.
  2. Implémenter `VersionManager.tsx` réalisant au montage une interrogation silencieuse de `/version.json` pour confronter les builds de manière non intrusive.
  3. Concevoir `PwaInstallButton.tsx` réagissant à `beforeinstallprompt` (Android/Desktop) et prévoyant des bannières d’instructions sur Safari iOS.
  4. Créer un registre centralisé `/src/data/versions.ts` et un dialogue de changelog `ChangelogModal.tsx` pour lister l'historique complet des versions directement sur l'UI (lien discret au pied de page).
- **Alternatives envisagées** : Forcer la mise à jour par rechargement immédiat brutal (rejeté car cela risquerait de couper la génération d'une vidéo en cours ou de déconnecter l'utilisateur).
- **Conséquences** : Conformité Lighthouse PWA absolue. Mise à jour douce invitant poliment l'utilisateur à actualiser le Service Worker tout en préservant ses états, son Auth Firebase persistée et ses vidéos IndexedDB. Accessibilité immédiate de l'historique des changements dans le footer de l'application.

## Stratégie de Documentation Légale et Conformité (RGPD, EU AI Act, COPPA)
- **Date** : 2026-06-17
- **Contexte** : Suite au pré-audit d'architecture compilé dans `/docs/pre_audit_juridique.md`, les résultats de recherche externe (Perplexity) ont confirmé les nécessités réglementaires et structuré la feuille de route juridique concernant le mode BYOK, le traitement temporaire des vidéos et l'usage de modèle IA probabiliste.
- **Décision** :
  1. Séparation stricte de la documentation entre : **Documents indispensables** (CGU comportant une décharge stricte d'hallucination IA, Politique de Confidentialité RGPD transparente sur le sous-traitement GCP/Gemini, Mentions Légales) et **Documents recommandés** (Politique Cookies/Stockage vu les Iframes/IndexedDB).
  2. Éviction confirmée des Conditions Générales de Vente (CGV) non pertinentes.
  3. Gestion de l'âge des mineurs (-15/-13 ans / COPPA) comme une barrière opérationnelle ou clause d'usage dans les CGU plutôt qu'un document isolé lourd.
- **Alternatives envisagées** : Rédiger un corpus juridique générique de type SaaS (rejeté car dangereux face à la requalification juridique : l'entreprise n'est pas "Processor" du contenu IA de Google, mais "Controller", et le risque d'erreur de sous-titrage diffamatoire devait être explicitement rejeté via une clause spécifique "nature probabiliste de l'IA").
- **Conséquences** : Protection légale maximale de l'éditeur contre la création/propagation de contenus mensongers ou préjudiciables générés par IA. Assurance de transparence absolue sur le cycle de vie des API Keys personnelles (BYOK).




