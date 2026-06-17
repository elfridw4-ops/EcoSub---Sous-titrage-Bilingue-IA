# Charte Graphique & Identité Visuelle - EcoSub AI

Ce document détaille la charte graphique de l'application EcoSub AI, ses composants, ses polices d'écriture, ses couleurs et son style d'interface utilisateur pour garantir la cohérence et l'esthétique du design.

---

## 🎨 1. Ton Visuel & Identité de Marque

EcoSub AI adopte une identité visuelle **ultra-épurée, sportive et professionnelle**. Elle rappelle l'élégance minimaliste suisse mélangée à un contraste technologique chaleureux.

- **Mots-clés de marque** : Réactivité, Précision, Légèreté, Clarté brute, Sobriété.
- **Principe fondamental** : *Craftsmanship over Defaults* — Pas de dégradés extravagants ou d'ombres floues inutiles. Le blanc cassé et le charbon profond dominent, rehaussés par une unique touche d'orange vif dynamique.

---

## 🎨 2. Palette de Couleurs

### A. Couleurs Principales & Neutres
| Couleur | Code Hex | Nuance / Usage | Rôle dans l'interface |
| :--- | :--- | :--- | :--- |
| **Orange Signal** | `#FF4D00` | Accent Principal | Boutons d'action prioritaires, surbrillance d'états actifs, curseurs. |
| **Noir Pur** | `#000000` | Texte & Titres | Lecture, contrastes forts, bordures suisses nettes. |
| **Charbon Profond** | `#1F2937` | Sous-titrage, Arrière-plans | Raccords de design, cartes inactives, textes secondaires. |
| **Gris Brume** | `#F3F4F6` | Fonds de cartes, dalles | Sections secondaires, arrière-plans doux et confortables. |
| **Blanc Pur** | `#FFFFFF` | Contenants | Cartes principales, fond d'applications. |

### B. Couleurs Sémantiques (Statuts & États)
| Statut | Code Hex | Usage |
| :--- | :--- | :--- |
| **Succès** | `#10B981` (Emeraude) | État valide de clé API, Mode admin activé, Téléchargements terminés. |
| **Alerte / Warning** | `#F59E0B` (Ambre) | Limites de générations journalières atteintes, rappel d'identification. |
| **Erreur** | `#EF4444` (Rouge) | Fichiers incorrects, réseau bloqué, erreurs d'appels FFmpeg. |

---

## 📐 3. Typographie

Pour l'applet, nous importons les familles typographiques depuis Google Fonts de manière ordonnée pour garantir des temps d'affichage parfaits (Web Vitals) :

- **Police Principale (UI & Texte)** : `Inter` (sans-serif)
  - *Pourquoi* : Très lisible sur petits écrans, neutre et moderne.
- **Police Display & Titres** : `Space Grotesk` ou `Outfit` (sans-serif)
  - *Pourquoi* : Donne une dynamique technique et géométrique sans alourdir.
- **Police Monospace (Codes & Statuts)** : `JetBrains Mono`
  - *Pourquoi* : Utilisée pour les indicateurs techniques d'état et l'affichage des logs ou durées précises (SRT/ASS).

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}
```

---

## 🎬 4. Logo & Variantes

Le logotype d'EcoSub AI allie le symbole du cinéma (le clap 🎬) ou une icône graphique moderne à l'énergie de l'accent Orange Signal.

### A. Spécifications Réelles & Fichiers Sources (Audit Technique)
- **Fichier Source Unique** : `/src/assets/images/ecosub_ai_icon_1781617390402.jpg`. Il s'agit d'un fichier image plat (JPEG) de taille réduite sur fond blanc opaque, qui sert de référence visuelle d'origine pour l'iconographie de l'application.
- **Fichiers Vectoriels ou Sources AI/Figma/PSD** : **Aucun présent dans le dépôt**. Il n'y a pas de fichier `.svg`, `.ai`, `.psd` ou `.fig`. La charte graphique est donc documentée de manière descriptive à partir des intégrations CSS et des dérivés d'images.
- **Génération PWA** : Des icônes de substitution haute définition pour l'installabilité progressive ont été générées et stockées sous :
  - Par défaut : `/public/icons/` regroupe l'ensemble complet des icônes générées :
    - `favicon.ico` (32×32)
    - `icon-16x16.png`, `icon-32x32.png`, `icon-48x48.png` (Icônes barres d'outils et de favoris de navigateur)
    - `icon-72x72.png`, `icon-96x96.png`, `icon-128x128.png` (Raccourcis système)
    - `icon-192x192.png`, `icon-256x256.png` (Icône Splash screen de démarrage d'Android et iOS)
    - `icon-384x384.png`, `icon-512x512.png` (Affichages haute-densité retina et installation sur Desktop)
  - Des métadonnées d'images pour le partage social (Social Sharing Cards) sont également intégrées pour Open Graph et Twitter Cards à l'aide de l'image de partage standardisée.
- **Éléments graphiques (Disque / Glyphe CJK/文 / Ombres)** :
  - *Couleur exacte du disque* : Le disque principal ou l'icône de l'application s'appuie sur le code couleur primaire **Orange Signal** (`#FF4D00`).
  - *Caractère CJK / Glyphe* : Il n'y a pas de tracé de glyphe type `文` codé en brut dans le code source de l'interface (une icône `<Sparkles>` de chez `lucide-react` est préférée dans les headers ). Si l'image de référence inclut un caractère type `文` (traduction), celui-ci est fusionné statiquement dans le composé d'image source et n'est pas instancié textuellement dans l'application.
  - *Effets, contours et ombres* : L'icône dans l'UI utilise des transitions de survol avec rotations légères (`transform hover:rotate-12 transition-transform`) et des ombres douces de type `shadow-lg shadow-[#FF4D00]/25` ou `shadow-lg shadow-[#FF4D00]/20` sur fond blanc cassé.

### B. Configuration de l'Application (Manifest & Metadata)
- **Nom de l'application (Manifest XML/JSON)** :
  - *Nom Complet* : `EcoSub AI - Sous-titrage et Traduction IA`
  - *Nom Court* : `EcoSub AI`
- **Couleurs de Thème Mobiles** :
  - *Theme Color* (Barres systèmes type Android) : `#FDFCFB` (couleur claire très proche du blanc cassé naturel)
  - *Background Color* (Splash screen, zone de chargement initiale) : `#FDFCFB`
- **État de Production** :
  - L'application dispose d'une URL canonique documentée `https://ecosub.ai`.
  - Elle est actuellement déployée dans des environnements d'aperçu et de développement sécurisés par la plateforme via l'URL `https://ais-pre-52xdkcj2m33euadjfahqxo-156867150624.europe-west1.run.app`.

### C. Contraintes d'usage
- Ne jamais déformer le logo verticalement ou horizontalement.
- Respecter une zone de protection inviolable tout autour égale à 25% de sa hauteur totale.
- La taille minimale recommandée en affichage numérique est de `32px` de hauteur.

---

## 🕹️ 5. Style de l'Interface Utilisateur (UI) & Composants

Les principes d'interface suivent une approche **brutaliste raffinée** :
- **Bordures** : Traits fins et précis de `1px` avec une opacité noire (`border-black/10`).
- **Arrondis** : Très généreux sur les éléments interactifs (`rounded-2xl` pour les zones de dépôt, `rounded-xl` pour les boutons).
- **Ombres** : Absentes ou extrêmement subtiles (`shadow-sm`) pour conserver un rendu plat, net, et fluide.
- **Micro-transitions** :
  - Surbrillance au survol (`hover:border-[#FF4D00]/30`)
  - Réduction de taille au clic pour une sensation tactile (`active:scale-95`)
  - Apparition et disparition via `motion` (AnimatePresence) pour abolir tout saut visuel discordant.

---

## 💎 6. Iconographie

- **Outil** : Toutes les icônes de l'application proviennent exclusivement de la bibliothèque **Lucide-React** pour garantir une unité esthétique absolue.
- **Règles d'utilisation** :
  - Les traits d'icônes ont une épaisseur (stroke-width) constante de `2px`.
  - Pas d'icônes multicolores en dehors du code couleur sémantique établi.
  - Toujours accompagner les icônes d'un texte descriptif clair pour assurer l'accessibilité aux lecteurs d'écran.
