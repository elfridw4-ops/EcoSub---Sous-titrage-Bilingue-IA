# Dossier de Pré-Audit Juridique et RGPD — EcoSub AI

Ce dossier d'analyse juridique et de conformité a été rédigé sous la supervision de l'architecte et du lead technique. Il constitue une synthèse rigoureuse et factuelle de l'architecture d'EcoSub AI, de ses flux de traitement et des typologies de données circulantes. 

Il a été conçu pour alimenter un moteur de recherche externe spécialisé (Perplexity) afin d'exécuter un audit de réglementation et de rédiger ultérieurement des politiques de confidentialité, conditions générales, chartes cookies et politiques d'IA précises et à jour.

---

## 📐 1. Analyse Technique du Projet

### A. Présentation Fonctionnelle d'EcoSub AI
EcoSub AI est une application web full-stack d'incrustation et de stylisation de sous-titres assistée par intelligence artificielle (modèle Google Gemini). 
* **Cible :** Créateurs de contenu individuels, influenceurs, monteurs vidéo et agences de communication digitale.
* **Fonctionnalité clé 1 :** Chargement d'une vidéo cible (format `.mp4` jusqu'à 100 Mo), extraction audio, transcription temporelle textuelle et traduction bilingue croisée (Français / Anglais) via l'IA de Google Gemini.
* **Fonctionnalité clé 2 (BYO-Style) :** Chargement optionnel d'une vidéo de référence pour en extraire et copier automatiquement les caractéristiques visuelles des sous-titres existants (polices, couleurs, animations, ombres) grâce au traitement d'image multimodal de Gemini.
* **Fonctionnalité clé 3 (Incrustation physique) :** Gravure physique permanente (hardcoding) des sous-titres stylisés sous forme de fichier de métadonnées de sous-titres avancés (`.ass`) directement dans l'image vidéo via l'utilitaire binaire FFmpeg côté serveur.
* **Fonctionnalité clé 4 (Cabine de Vie Privée / RGPD) :** Module d'audit interne ("Mes données") permettant en un seul écran de visualiser la consommation d'IndexedDB, d'exporter toutes ses données personnelles (JSON structures de métadonnées + CSV complet d'historique de projet), d'ajuster des durées de rétention proactives, de supprimer les projets/feedbacks individuellement, de vider l'historique global ou de détruire de manière irréversible le compte utilisateur.

### B. Architecture Système & Flux de Données
L'application s'appuie sur une structure moderne et cloisonnée :
1. **Frontend (Vite + React) :**
   * Séquençage visuel des projets, lecteur vidéo interactif et éditeur de dalles de style.
   * **Web Worker d'Arrière-Plan (`fileWorker.ts`) :** Gère la conversion asynchrone des fichiers lourds en chaîne Base64 pour décharger le thread d'interface.
   * **Base de Données Locale Client (`IndexedDB` via `EcoSubDB`) :** Stocke l'historique complet des projets traités par l'utilisateur (segments temporels de transcription originaux et traduits, métadonnées, options esthétiques).
   * **BYOK (Bring Your Own Key) :** La clé d'API personnelle de calcul Gemini de l'utilisateur est stockée uniquement en local côté client (`LocalStorage`), ne transite jamais par les serveurs d'EcoSub AI, et est injectée directement depuis le navigateur de l'utilisateur vers le SDK officiel `@google/genai` pour négocier la transcription/traduction.
2. **Backend (Express Node.js hébergé sur Google Cloud Run) :**
   * **Upload Multipart (`multer`) :** Réception et stockage à l'emplacement `/uploads/` des vidéos brutes ou références.
   * **FFmpeg Engine (`ffmpeg-static`) :** Compilation des styles ASS en instructions de tracé vectoriel vidéo et incrustation native. Un sémaphore asynchrone limite à 2 processus parallèles maximum le travail de FFmpeg pour prévenir les surcharges CPU.
   * **Garbage Collector automatique (Clean Engine) :** Un timer d'arrière-plan inspecte les répertoires `/uploads/` et `/outputs/` toutes les 15 minutes et efface définitivement tous les fichiers médias (vidéos brutes, vidéos finales incrustées, métadonnées ASS) datant de plus d'une heure.
   * **Download Endpoint :** Route d'accès `/api/download/:filename` servant des en-têtes d'interprétation vidéo standard.
3. **Database & Auth (Firebase Platform) :**
   * **Authentification unifiée :** Firebase Authentication configurée avec l'identité d'authentification Google Sign-In.
   * **Base de Données Firestore :** Stockage distant des profils utilisateurs simplifiés et de la centralisation des retours utilisateurs (Collection de feedbacks restreinte par des politiques d'accès `firestore.rules` verrouillées sur l'UID Firebase).

---

## 🗂️ 2. Inventaire Juridique des Données Traitées

Le tableau ci-dessous dresse l'inventaire complet des données traitées par l'application :

| Nom de la donnée | Source | Finalité principale | Durée de conservation estimée | Niveau de sensibilité |
| :--- | :--- | :--- | :--- | :--- |
| **Identité Firebase (UID)** | Google Auth | Identifier l'utilisateur, lier les feedbacks partagés et gérer les sessions de connexion. | Jusqu'à suppression volontaire par l'utilisateur du compte. | **Faible** (Pseudo-anonyme technique) |
| **Nom d'affichage et Prénom** | Google Auth | Personnaliser l'affichage de l'interface et le profil. | Supprimé instantanément à la deconnexion ou purge du compte. | **Faible à Moyen** (Donnée d'identification) |
| **Adresse Email** | Google Auth | Joindre l'utilisateur pour le suivi des retours et support. | Jusqu'à suppression du compte. | **Moyen** (Donnée de communication) |
| **Photo de profil Google** | Google Auth | Personnalisation visuelle de l'icône de compte. | Session active (gérée en CDN Google). | **Faible** |
| **Clé d'API Gemini Studio** | LocalStorage | Négocier les requêtes d'analyse vidéo d'intelligence artificielle (système BYOK). | Illimitée en local, jusqu'à suppression manuelle ou purge ("Mes données"). | **Élevé** (Clé de facturation et de sécurité tiers) |
| **Vidéos brutes (Cible et Référence)** | Upload utilisateur | Permettre l'extraction de l'audio et l'analyse visuelle par le serveur. | Élimination automatique sur disque au bout d'une heure max (GC local). | **Élevé** (Contenu audiovisuel pouvant révéler visages et voix) |
| **Vidéos finales incrustées** | Traitement FFmpeg | Permettre le téléchargement par l'utilisateur du fichier de sortie. | Élimination automatique sur disque au bout d'une heure max (GC local). | **Élevé** (Contenu audiovisuel traité) |
| **Segments de sous-titres (Textes & Timestamps)** | Générés par Gemini AI | Conserver la transcription et la traduction dans l'historique utilisateur. | Illimitée dans l'IndexedDB locale du navigateur de l'utilisateur (ou 21j selon réglage). | **Moyen** (Transcription écrite du discours) |
| **Feedbacks et suggestions** | Saisis par l'utilisateur | Améliorer l'application. Transmis à Firestore. | Conservés jusqu'à la suppression du compte de l'utilisateur (purge cascade). | **Moyen** (Textes libres) |
| **Logs de sécurité RGPD locaux** | Enregistrés en IndexedDB | Garantir la traçabilité des actions sensibles (exportation, modification de clé). | Limités aux 30 dernières actions critiques, purgeable. | **Moyen** (Sûreté de compte) |
| **Logs techniques système** | Console serveur | Résoudre les incidents et attaques techniques (Adresses IP d'appels). | Gardés temporairement selon les paramètres par défaut de Cloud Run. | **Moyen** (Maintenance) |

---

## ⚡ 3. Identification des Risques Principaux du Système

### A. Risques liés à la Transmission d'Audio et de Vidéo (Voix & Visages)
* **Description :** Les fichiers vidéos téléchargés par les utilisateurs contiennent des éléments d'identification biométrique (visage et signature vocale).
* **Risques :**
  1. *Transfert transfrontalier :* La voix et/ou les images en Base64 sont transmises à des serveurs tiers Google (Google AI Studio/Gemini). Où sont physiquement hébergés ces serveurs ? Sont-ils soumis au droit européen ?
  2. *Propriété & Amélioration de Modèle :* Dans le cas du BYOK (Bring Your Own Key), les clauses de Google AI Studio pour les niveaux d'utilisation gratuits stipulent généralement que les données transmises (les vidéos) peuvent être analysées et réutilisées par des relecteurs humains et pour entraîner les futurs modèles. Les utilisateurs partagent à leur insu des vidéos potentiellement confidentielles.
  3. *Manque d'isolation des sessions :* La route de téléchargement `/api/download/:filename` s'appuie sur le nom généré par UUID v4. Bien que l'UUID soit hautement imprédictible, il n'y a pas de barrière d'authentification vérifiant si l'utilisateur qui télécharge la vidéo finale en est l'auteur légitime, ce qui expose l'application à un risque de fuite de données par force brute ou interception d'URL.

### B. Risques liés à l'IA Générative (Transcription & Traduction)
* **Description :** Le texte affiché en sous-titrage est généré par un modèle probabiliste sujet de manière inhérente à des hallucinations.
* **Risques :**
  1. *Contre-sens graves :* Risque de faux traduisant des dialogues d'une manière diffamatoire, injurieuse ou mensongère qui pourrait se retrouver définitivement incrustée sur une vidéo publiée.
  2. *Absence de filtrage automatisé :* L'application n'applique pas de contrôle de modération intermédiaire sur les textes transcrits par l'IA ou les invites de style.

### C. Risques liés aux Fichiers Importés & Sécurité Serveur
* **Description :** Le serveur Express utilise `ffmpeg` de manière locale et exécute les calculs de transcodage sur le conteneur Cloud Run.
* **Risques :**
  1. *Corruption de mémoire :* Un fichier d'invite vidéo contrefait peut exploiter des vulnérabilités de bibliothèque FFmpeg pour exécuter arbitrairement du code sur le serveur.
  2. *Déni de Service (DoS) :* Des uploads répétés de fichiers vidéo de 100 Mo peuvent saturer la RAM et le processeur de l'unique machine, malgré le sémaphore de concurrency configuré.

### D. Risques de Traitement de Données de Mineurs
* **Description :** L'outil cible les créateurs de contenu sur les réseaux sociaux d'audience jeune (TikTok, Shorts, Instagram).
* **Risques :**
  * Des adolescents peuvent uploader leurs propres visages et voix ou ceux de tiers mineurs sans supervision légale et sans validation de consentement parental.

---

## 📋 4. Grille de Détermination des Documents Légaux Requis

Afin de structurer le lancement commercial sécurisé de l'application, voici l'inventaire des nécessités réglementaires identifiées :

| Type de document légal | Justification réglementaire & technique | Niveau de nécessité |
| :--- | :--- | :--- |
| **Politique de Confidentialité** | Obligation de transparence RGPD (Art 13). Doit couvrir l'authentification Google, le stockage IndexedDB, le modèle BYOK de clé d'API, le GC de 1 heure des fichiers tiers et l'exportation unifiée. | **Indispensable** (Obligatoire) |
| **Conditions Générales d'Utilisation (CGU)** | Fixer les règles de propriété intellectuelle des contenus générés, exclure la responsabilité des hallucinations de transcription de l'IA et édicter les interdictions de hack de l'infrastructure d'incrustation. | **Indispensable** (Obligatoire) |
| **Politique et Guide d'Usage d'IA Générative** | Spécifier clairement aux utilisateurs que le modèle BYOK (Google AI Studio) est soumis aux conditions d'utilisation de Google de manière croisée, et décharger l'éditeur des anomalies de traduction. | **Fortement Recommandé** |
| **Règles d'Usage et de Rétention des Données (Privacy Policy Client)** | Document de pédagogie expliquant comment vider la base locale IndexedDB sans détruire l'installation autonome (PWA). | **Recommandé** |
| **Charte de Cookies / Consentement de tiers** | Configurer l'usage de traceurs de persistence Firebase Auth et gestion des cookies tiers exigés par les Iframes. | **À valider** (Selon le protocole de suivi) |

---

## 🔎 5. Dossier de Recherche Structuré pour Perplexity

### A. Synthèse d'Architecture & Technique
* **Technologie :** Single-Page Application en React intégrée dans une PWA Périphérique autonome, s'appuyant sur un serveur utilitaire Express de transcodage média Node.JS/FFmpeg.
* **Services Cloud :** Google Cloud Run (conteneur hébergeant le serveur temporaire sans disque de stockage persistant), Firebase Auth (Google Provider), Firebase Firestore (historique de support, feedbacks).
* **Mode IA (BYOK) :** Les appels IA s'exécutent via l'API Google AI Studio en utilisant les ressources financières directes (clés d'authentification passée) des utilisateurs eux-mêmes. EcoSub AI n'administre et ne facture aucun jeton d'intelligence artificielle en propre.
* **Traitement de fichier :** Les vidéos subsistent en mémoire et sur disque à la racine serveur pendant un cycle d'obsolescence strict inférieur à 60 minutes de rétention.

---

## 🎯 "QUESTIONS À POSER À PERPLEXITY"

Voici la liste exhaustive des requêtes d'approfondissement juridique à soumettre à l'agent de recherche Perplexity afin d'assurer une couverture de risques totale et indiscutable :

### 👤 1. Sur le Traitement Spécifique des Vidéos, de la Voix et des Visages (RGPD)
> **Requête de recherche :**
> *"Dans le cadre d'un service d'incrustation de sous-titres (SaaS) où les utilisateurs importent des vidéos contenant des visages et des voix identifiables pour traitement, de quelle manière le RGPD qualifie-t-il l’audio et l’image vidéo ? La voix est-elle systématiquement considérée comme une donnée biométrique nécessitant des mesures de sécurité de l'Article 9 ? De plus, est-il nécessaire d'implémenter un chiffrement par identifiant de session ou des barrières de sécurité restrictives sur la route publique de téléchargement `/api/download/:filename` utilisant un UUID v4 pour garantir une parfaite confidentialité au sens du RGPD ?"*

### 🔑 2. Sur la Responsabilité Légale du Modèle "Bring Your Own Key" (BYOK - Gemini)
> **Requête de recherche :**
> *"Un éditeur d'application web qui propose aux utilisateurs de connecter leur propre clé d'API personnelle Google AI Studio (Gemini) pour transcrire et analyser le style de sous-titres de leurs vidéos est-il qualifié de responsable de traitement de données (Controller) ou de sous-traitant (Processor) pour les transferts de données vers les serveurs de Google ? Quelles sont les incidences légales et réglementaires selon l'accord de sous-traitance de données de Google ? Comment informer l'utilisateur sur le fait que l'usage d'une clé Google AI Studio gratuite peut autoriser Google à entraîner ses modèles sur ses vidéos privées ?"*

### 🌍 3. Sur les Flux Transfrontaliers de Données Audiovisuelles
> **Requête de recherche :**
> *"Quand une plateforme transmet, depuis l'Union Européenne, des fichiers médias lourds convertis en Base64 via le SDK `@google/genai` vers les API distantes de Google, quelles clauses contractuelles types (CCT) ou mécanismes de transfert de données hors UE s'appliquent ? Est-ce de la responsabilité de l'application ou cela découle-t-il des conditions contractuelles de la clé d'API fournie par l'utilisateur final ?"*

### 🤖 4. Sur la Conformité face à l'EU AI Act
> **Requête de recherche :**
> *"Une application d'incrustation de sous-titres gérant de la transcription automatique et de la traduction d'audio par IA pour des vidéos de réseaux sociaux est-elle classée dans une catégorie de risque spécifique selon l'EU AI Act (Règlement européen sur l'Intelligence Artificielle de 2024) ? Quelles sont les obligations de transparence vis-à-vis des utilisateurs finaux concernant le fait que les textes sont générés et incrustés par IA ?"*

### 👶 5. Sur l'Exigence de Consentement des Mineurs (Réseaux Sociaux)
> **Requête de recherche :**
> *"Dans quelle mesure une application de sous-titrage vidéo, massivement utilisée par des créateurs de contenu jeunes (dont des mineurs de moins de 15/16 ans), doit-elle adapter sa vérification d'âge ou de consentement parental en Europe (RGPD) et aux États-Unis (COPPA) si elle ne stocke pas à long terme les vidéos (supprimées en une heure) mais utilise Google Auth et stocke localement l’historique des projets ?"*

### ⚖️ 6. Sur la Clause Exonératoire Contre le Risque d'Hallucinations d'IA (CGU)
> **Requête de recherche :**
> *"Rédige une structure de clause d'exonération de responsabilité robuste pour des conditions générales d'utilisation (CGU) protégeant un éditeur d'application de sous-titrage IA contre toute poursuite découlant de contresens, de traductions jugées offensantes ou diffamatoires générées automatiquement par l'IA et incrustées de manière définitive sur la vidéo d'un utilisateur."*

---

## 🛑 6. Arrêt de Protocole

Conformément à la directive de pré-audit réglementaire :
* Aucun document juridique (politique de confidentialité rédigée, mentions légales types) n'a été formulé arbitrairement dans l'espace de travail.
* Le dossier ci-dessus conserve une neutralité de constat de niveau technique de lead architecte.
* Le système reste en attente de la communication des résultats de requêtes d'approfondissement soumises à la diligence de recherche externe (Perplexity).
