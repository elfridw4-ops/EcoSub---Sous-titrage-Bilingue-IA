# Mémoire Stratégique IA & Conception (AI Context) - EcoSub AI

Ce document constitue la mémoire stratégique du projet EcoSub AI. Il retrace les choix d'intelligence artificielle, d'UX, de SEO, les prompts clés ainsi que les hypothèses de conception retenues ou rejetées lors du cycle de développement.

---

## 🧠 1. Choix Technologiques d'Intelligence Artificielle

### A. Sélection du Modèle : Gemini 3.5 Flash
- **Décision** : Utilisation exclusive du modèle `gemini-3.5-flash` pour toutes les fonctionnalités d'analyse d'image (BYO-Style) et de transcription/traduction.
- **Pourquoi ce choix** :
  - **Coût & Latence** : Offre une vitesse de réponse exceptionnelle, essentielle pour un traitement interactif de fichiers vidéos, à une fraction du coût du modèle Pro.
  - **Fenêtre de Contexte Élargie** : Permet de traiter de longs segments audio ainsi que des images haute définition de référence sans saturation de jetons.
  - **Résilience** : Correction de l'erreur 404 de l'ancienne version dépréciée `gemini-1.5-flash`.
- **Alternative Rejetée** : `gemini-2.5-pro` (Rejeté car latence trop élevée au démarrage de l'inférence et quota gratuit trop restrictif pour le modèle BYOK standard).

### B. Architecture Bring Your Own Key (BYOK)
- **Décision** : Plus de clés d'API centralisées ou de quotas administrés par le serveur d'EcoSub AI. Chaque utilisateur utilise sa propre clé Google AI Studio.
- **Pourquoi ce choix** :
  - **Zéro Coût d'Infrastructure** : Évite à l'éditeur de payer pour la bande passante et le calcul de transcription d'utilisateurs tiers.
  - **Confidentialité et Indépendance** : La clé reste stockée localement dans le navigateur de l'utilisateur (`localStorage`) et ne transite jamais par les serveurs d'EcoSub.
- **Alternative Rejetée** : Clé API backend masquée avec paiement à l'usage (Rejeté à ce stade pour préserver le caractère gratuit, décentralisé et sans barrière de paiement de l'application).

---

## 📝 2. Prompts Clés Référents

### A. Prompt d'Analyse Audio & Transcription Bilingue (SRT/ASS Generation)
```text
Rôle : Expert linguiste et traducteur audiovisuel de haute précision.
Tâche : Transcrire l'audio de la vidéo fournie et générer des segments de sous-titres précis avec horodatage.
Contraintes de format :
- Détecter automatiquement si la langue parlée est le français ou l'anglais.
- Générer un fichier de sous-titres structuré en SRT ou ASS selon les styles requis.
- S'il y a demande de traduction bilingue croisée, fournir la langue d'origine en haut et la langue cible en bas, séparées par un saut de ligne.
- Ne pas inventer (halluciner) de dialogues s'il y a des blancs ou des silences.
- Proposer des coupes de phrases naturelles de moins de 42 caractères par ligne pour préserver le confort de lecture.
```

### B. Prompt de Copie de Style Visuel par Référence (BYO-Style)
```text
Rôle : Designer graphique expert en typographie et sous-titres vidéo.
Tâche : Analyser l'image ou l'échantillon vidéo de référence fourni.
Données à extraire :
- Couleur de remplissage (couleur primaire) au format hexadécimal (ex: #FF4D00).
- Couleur de contour (outline) et épaisseur en pixels.
- Police de caractères dominante (ou équivalence Google Fonts la plus proche).
- Présence d'effets visuels : ombres portées, bandes de fond (karaoké, style Netflix), alignements (bas, centre, haut).
Format de sortie : Retourner exclusivement un objet JSON valide correspondant à l'interface `SubtitleStyle`.
```

---

## 🎨 3. Choix d'Expérience Utilisateur (UX / UI)

### A. Le "Brutalisme Minimaliste" et le Contraste Orange Signal
- **Décision** : Interface claire, dominée par le blanc cassé (`#FDFCFB`) et le noir profond (`#141414`), contrastée par une touche unique d'orange dynamique (`#FF4D00`).
- **Pourquoi ce choix** : Crée un sentiment de produit utilitaire à haute performance (type Linear, Stripe) loin de l'effet "AI Slop" générique.
- **Alternative Rejetée** : Thème sombre spatial violet/bleu à dégradés (Rejeté car trop commun, distrayant et difficile à lire en usage prolongé).

### B. Sécurisation Proactive d'Iframe par Détection de Blocage de Cookies
- **Décision** : Bloquer visuellement l'upload si les cookies tiers sont restreints (fréquent dans les iframes de prévisualisation comme AI Studio) et afficher une bannière explicative dirigeant vers un onglet autonome.
- **Pourquoi ce choix** : Évite les échecs d'upload mystérieux ou les blocages système en cours de route.
- **Alternative Rejetée** : Laisser l'utilisateur essayer d'uploader et afficher une erreur de réseau brut (Rejeté car cela génère une grande frustration).

---

## 📈 4. Choix Structurels SEO

### A. Prerendering & Landing Page d'Évaluation Produit
- **Décision** : Mettre en œuvre une vraie Landing Page publique d'évaluation esthétique comme point d'entrée, reportant l'application d'édition à un dashboard.
- **Pourquoi ce choix** : Indexer la proposition de valeur de l'outil et maximiser la conversion longue traîne ("générateur sous-titres gratuit", "copier style sous-titre").

---

## 🛑 5. Fonctionnalités Abandonnées / Reportées

1. **Calculateur de Coûts d'API en Temps Réel** : Supprimé car le modèle BYOK délègue l'usage directement aux quotas de l'utilisateur, rendant l'historisation des coûts inutile pour l'éditeur d'EcoSub AI.
2. **Modération Automatique du Langage** : Reportée pour ne pas entraver la transcription artistique de vidéos à langage familier.
3. **Animations d'Entrée Textuelles Complexes** : Simplifiées au profit de transitions standard ASS de FFmpeg pour préserver la légèreté de compilation sur les serveurs d'incrustation.
