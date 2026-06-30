# Charte Graphique — EcoSub AI
> Brutalisme Minimaliste & Contraste Signal

**Version :** 1.0
**Thème :** Light (Brutalist)
**Dernière mise à jour :** 2026-06-29

---

## Table des matières
1. [Couleurs](#1-couleurs)
2. [Typographie](#2-typographie)
3. [Espacement](#3-espacement)
4. [Border Radius](#4-border-radius)
5. [Composants UI](#5-composants-ui)
6. [Logo](#6-logo)
7. [Iconographie](#7-iconographie)
8. [Surfaces & Élévation](#8-surfaces--élévation)
9. [Imagerie](#9-imagerie)
10. [Layout](#10-layout)
11. [Do's & Don'ts](#11-dos--donts)
12. [Accessibilité](#12-accessibilité)
13. [Tokens CSS — Quick Start](#13-tokens-css--quick-start)

---

## 1. Couleurs

Le système colorimétrique d'EcoSub AI est volontairement extrêmement restreint pour créer un effet de "Brutalisme Minimaliste". L'interface est presque exclusivement monochrome, réveillée par un unique orange vif utilisé comme signal d'action.

| Nom sémantique | Valeur hex exacte | Token CSS | Rôle primaire | Restrictions | Niveau d'autorité |
|---|---|---|---|---|---|
| **Signal Orange** | `#FF4D00` | `--color-signal-orange` | Unique couleur d'action, CTA primaire, icônes clés | Ne pas utiliser pour du texte long, éviter les dégradés. | Principale |
| **Signal Hover** | `#E64500` | `--color-signal-hover` | État de survol (hover) des boutons primaires | Utilisation exclusive pour les états interactifs. | Sémantique |
| **Deep Void** | `#141414` | `--color-deep-void` | Texte principal de l'application, éléments de branding forts | Ne pas utiliser comme couleur de fond principale (trop sombre). | Principale |
| **Canvas White** | `#FDFCFB` | `--color-canvas-white` | Fond global de l'application (blanc "cassé" chaud) | Ne pas utiliser dans les modales ou cartes (utiliser Pure White). | Principale |
| **Pure White** | `#FFFFFF` | `--color-pure-white` | Surfaces élevées (cartes, modales, header) | Ne pas utiliser comme fond d'application (fatigue visuelle). | Secondaire |
| **Ghost Black 5** | `rgba(0,0,0,0.05)` | `--color-ghost-5` | Bordures subtiles, fonds de survol secondaires | Interdit pour du texte (invisible). | Décorative |
| **Ghost Black 40**| `rgba(0,0,0,0.40)` | `--color-ghost-40` | Textes secondaires, légendes, placeholders | Ne pas utiliser pour des actions ou du texte de contenu (body). | Sémantique |
| **Success Green** | `#22C55E` | `--color-success` | Icônes de confidentialité (Privacy), statuts positifs | Réservé aux feedbacks positifs. | Sémantique |
| **Warning Amber** | `#F59E0B` | `--color-warning` | Icônes liées aux Cookies, alertes modérées | Ne pas utiliser en remplacement de l'Orange Signal. | Sémantique |

---

## 2. Typographie

L'application repose sur la police système sans-serif native pour garantir une vitesse de rendu optimale (zéro FOUT) et une intégration native (Brutalisme technologique).

| Nom de la police | Substituts | Poids utilisés | Rôle de chaque poids | Rationale |
|---|---|---|---|---|
| **System Sans** | Inter, San Francisco, Roboto | 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold), 800 (Extrabold) | Light: Marque "AI"<br>Medium: Boutons, UI<br>Bold: Titres<br>Extrabold: Hero | Approche pragmatique, lisibilité maximale, esthétique "outil pro" sans distraction. |
| **System Mono** | JetBrains Mono, Menlo | 400 (Regular) | Horodatages, données techniques, code | Apporte le côté "terminal / ingénierie" requis pour un outil de traitement vidéo. |

### Échelle typographique

| Rôle | Taille | Line-height | Letter-spacing | Token CSS | Règle de tracking |
|---|---|---|---|---|---|
| **Hero Display** | 72px (4.5rem) | 1.1 | -0.025em | `--text-hero` | `tracking-tight` pour souder les mots massifs et donner de l'impact. |
| **Heading H2** | 36px (2.25rem) | 1.2 | -0.025em | `--text-h2` | Compression légère pour les titres de section. |
| **Heading H3** | 20px (1.25rem) | 1.4 | 0em | `--text-h3` | Neutre, pour les titres de cartes (Features). |
| **Body** | 16px (1rem) | 1.625 | 0em | `--text-body` | `leading-relaxed` (1.625) pour aérer la lecture des longs paragraphes. |
| **Button / UI** | 14px (0.875rem)| 1.2 | 0em | `--text-ui` | Compact, souvent associé à une graisse `Medium` ou `Bold`. |
| **Caption / Badge** | 12px (0.75rem) | 1.5 | 0.05em | `--text-caption` | `tracking-wider` ou `widest` couplé à de l'uppercase pour assurer la lisibilité à petite taille. |
| **Micro Mono** | 10px (0.625rem)| 1.5 | 0em | `--text-micro` | Utilisé pour la date de mise à jour légale ou les métadonnées. |

---

## 3. Espacement

Le système d'espacement est basé sur une unité fondamentale de `4px` (système Tailwind standard).
La densité de l'application est **spacious** : on privilégie l'espace négatif (vide) pour diriger l'attention, plutôt que de créer des séparateurs visuels.

| Unité de base | Échelle complète | Densité | Paramètres de layout |
|---|---|---|---|
| **4px** (`1`) | 4, 8, 12, 16, 24, 32, 48, 64, 96px | **Spacious**. De grands espaces entre les sections (`py-24` = 96px) isolent conceptuellement chaque bloc d'information. | **max-width**: 896px (`max-w-4xl`) pour la lecture.<br>**section-gap**: 96px (`py-24`).<br>**element-gap**: 12px à 16px (`gap-3` ou `gap-4`). |

---

## 4. Border Radius

EcoSub AI utilise un système de border-radius très expressif qui contraste avec les bordures fines.

| Valeur par élément | Token CSS | Règle globale | Exceptions |
|---|---|---|---|
| **Boutons primaires, Badges** | `9999px` (pill) | `--radius-full` | La forme "Pill" appelle à l'action physique et différencie l'interactif du conteneur. | Boutons dans le header (souvent arrondis standard si text-only). |
| **Grandes Cartes (Features)** | `24px` (3xl) | `--radius-3xl` | Les conteneurs majeurs de contenu ont un arrondi très doux et amical. | - |
| **Modales & Petites Cartes** | `16px` (2xl) | `--radius-2xl` | Utilisé pour `LegalModal` et les FAQ. | Sur mobile, la LegalModal prend tout l'écran (`rounded-none`). |
| **Icônes / Avatars carrés** | `12px` (xl) | `--radius-xl` | Pour les conteneurs d'icônes à l'intérieur des cartes. | Les avatars utilisateur sont `rounded-full`. |

---

## 5. Composants UI

### Primary Action Button (CTA)
| Champ | Description |
|---|---|
| **Rôle** | Action principale de conversion (Upload, Start, J'ai compris) |
| **Background** | `--color-signal-orange` (`#FF4D00`) |
| **Couleur texte** | `--color-pure-white` (`#FFFFFF`) |
| **Taille / Poids**| 14px / Bold |
| **Casse / Track** | none / 0em |
| **Padding** | 10px top/bottom, 24px left/right (`px-6 py-2.5`) |
| **Border-radius** | pill (`9999px`) |
| **Border / Ombre**| none / `shadow-lg shadow-[#FF4D00]/20` |

*États :*
- **Hover** : Background devient `--color-signal-hover` (`#E64500`).
- **Active** : Scale `0.95` (`active:scale-95`).
- **Focus-visible** : `ring-2 ring-offset-2 ring-gray-900`.
- **Disabled** : `opacity-50 cursor-not-allowed`.

### Secondary Ghost Button
| Champ | Description |
|---|---|
| **Rôle** | Actions secondaires (Fermer, Icônes de profil, Navigation) |
| **Background** | Transparent |
| **Couleur texte** | `--color-ghost-40` (`rgba(0,0,0,0.40)`) |
| **Taille / Poids**| 14px / Medium |
| **Casse / Track** | none / 0em |
| **Padding** | 8px (`p-2`) |
| **Border-radius** | pill (`9999px`) |
| **Border / Ombre**| none / none |

*États :*
- **Hover** : Background devient `--color-ghost-5` (`bg-black/5`), Texte devient `--color-signal-orange`.
- **Active** : `⚠️ NON DÉFINI` (Défaut du navigateur).
- **Focus-visible** : `outline-none` (remplacé par le hover effect visuellement).

### Legal Content Modal
| Champ | Description |
|---|---|
| **Rôle** | Affichage des documents légaux (CGU, Cookies, etc.) |
| **Background** | `--color-pure-white` |
| **Border-radius** | `16px` (`sm:rounded-2xl`) sur desktop, `0px` sur mobile |
| **Border** | none |
| **Ombre** | `shadow-2xl` |
| **Structure** | Dual-Pane (Sommaire à gauche fond `bg-gray-50/50` border-r `border-gray-100`, Contenu à droite) |

---

## 6. Logo

| Champ | Description |
|---|---|
| **Variantes** | Principale : Typographique. |
| **Couleurs** | Texte : `--color-deep-void` (`#141414`). |
| **Stylisation** | "EcoSub" en `font-bold`, suivi de "AI" en `font-light italic`. |
| **Tailles rec.** | Header : 18px (`text-lg sm:text-xl`). |
| **Zone protect.** | Minimum 16px tout autour. |
| **Fonds autor.** | Uniquement sur `--color-canvas-white` ou `--color-pure-white`. |
| **Interdictions** | Ne jamais colorer le texte en orange, ne jamais modifier la casse ("ecosub ai" interdit). |

---

## 7. Iconographie

| Champ | Description |
|---|---|
| **Style** | Outline (contour simple). |
| **Stroke** | Épaisseur exacte de `2px` (standard Lucide). |
| **Tailles** | `w-4 h-4` (16px) pour les métadonnées, `w-5 h-5` (20px) pour les boutons/nav, `w-6 h-6` (24px) ou `w-8 h-8` (32px) pour les Features. |
| **Couleurs** | `--color-signal-orange` pour l'illustration des fonctionnalités clés, `--color-ghost-40` pour les icônes utilitaires (fermer, profil). |
| **Source** | Bibliothèque `lucide-react`. |
| **Règle d'usage** | Une icône interactive sans texte doit impérativement avoir un fond de survol (`bg-black/5`) délimitant sa zone de clic (touch target de 44px minimum). |

---

## 8. Surfaces & Élévation

Le système d'élévation d'EcoSub AI refuse les ombres portées complexes (à l'exception de l'accentuation de l'orange et des modales) au profit de bordures ultra-fines de contraste.

| Niveaux de surface | Couleur | Philosophie d'élévation | Règle |
|---|---|---|---|
| **Level 0 (Canvas)** | `--color-canvas-white` (`#FDFCFB`) | Fond plat. | Le socle de la page. |
| **Level 1 (Cards)** | `--color-pure-white` (`#FFFFFF`) | Élévation par le contraste de bordure : `border border-black/5`. | Crée une surface de contenu lisible sans flotter (ancrage physique). |
| **Level 2 (Modals)** | `--color-pure-white` | Ombre maximale (`shadow-2xl`) + fond assombri (`bg-black/45 backdrop-blur-sm`). | Coupure totale avec le contexte inférieur. Attention exclusive requise. |

---

## 9. Imagerie

| Champ | Description |
|---|---|
| **Types autorisés** | Mockups d'interface abstraits, placeholders colorés (`bg-gray-800`), aucune imagerie réaliste. |
| **Style** | Minimaliste technologique, vectoriel ou blocs structurels. |
| **Restrictions** | **INTERDICTION STRICTE** d'utiliser des photographies de stock (personnes souriantes, bureaux). Cela détruit l'esthétique d'outil professionnel ("Brutalisme"). |
| **Traitement** | Contours `border-gray-700` et ombres `shadow-2xl` pour séparer les aperçus d'interface de l'arrière-plan. |

---

## 10. Layout

| Champ | Description |
|---|---|
| **Système de grille** | Flexbox et CSS Grid hybride (ex: `grid-cols-1 md:grid-cols-3` pour les features). |
| **Max-width** | `max-w-4xl` (896px) pour la lisibilité textuelle parfaite. `max-w-7xl` pour les UI larges. |
| **Breakpoints** | `sm`: 640px (Mobile L) / `md`: 768px (Tablet) / `lg`: 1024px (Desktop). |
| **Comportements** | Le menu "Sommaire" des documents légaux passe d'une Sidebar (`w-64` sur `md`) à une barre horizontale scrollable sur mobile. |
| **Philosophie** | Contenu toujours centré sur une colonne unique fluide, jamais plaqué contre les bords de l'écran (`px-4` minimum en permanence). |

---

## 11. Do's & Don'ts

✅ **DO : Utiliser le Deep Void (`#141414`) au lieu du noir absolu (`#000000`).**
*Pourquoi :* Le contraste sur fond blanc est légèrement adouci, réduisant la fatigue oculaire lors de la lecture d'interfaces textuelles denses.

✅ **DO : Limiter l'utilisation du Signal Orange aux CTA et éléments clés.**
*Pourquoi :* C'est une couleur d'alerte forte. Si tout est orange, plus rien n'attire l'attention.

✅ **DO : Utiliser `tracking-tight` sur les très grands titres.**
*Pourquoi :* À grande échelle, l'espacement naturel des lettres crée des "trous" visuels. Resserrer l'approche donne une masse architecturale au texte.

✅ **DO : Appliquer un `backdrop-blur-sm` derrière les modales.**
*Pourquoi :* Garde le contexte de l'application visible tout en focalisant l'attention sur l'action bloquante.

✅ **DO : Prévoir un `touch-target` de 44px sur mobile.**
*Pourquoi :* Un icône de 16px est impossible à tapoter précisément sur un écran tactile sans un padding généreux.

✅ **DO : Grouper les informations légales avec une opacité réduite (`text-black/40`).**
*Pourquoi :* Ne pas parasiter la charge cognitive de l'outil avec des mentions secondaires.

✅ **DO : Utiliser l'animation de translation (`slide-in-from-bottom-4`) pour l'apparition des modales.**
*Pourquoi :* L'animation physique donne l'impression que la carte est un objet matériel qui "monte" dans les mains de l'utilisateur.

❌ **DON'T : Utiliser des polices de caractères fantaisistes (Serif, Script).**
*Pourquoi :* L'application est un outil technique (FFmpeg, IA). Une typographie non-système brise la promesse de performance brute.

❌ **DON'T : Ajouter des bordures épaisses ou colorées aux cartes.**
*Pourquoi :* L'élévation s'obtient par une bordure ultra-fine `border-black/5`. Des bordures fortes alourdiraient le design brutaliste.

❌ **DON'T : Aligner du texte long au centre (text-center).**
*Pourquoi :* Le centrage rend le point de retour à la ligne imprévisible pour l'œil, détruisant le confort de lecture au-delà de 3 lignes.

❌ **DON'T : Utiliser des ombres portées (`shadow-md`) sur des éléments plats d'interface.**
*Pourquoi :* En dehors des boutons primaires et des fenêtres volantes (Modales), la surface Canvas doit rester parfaitement plate.

❌ **DON'T : Nommer l'application avec des termes techniques ronflants sur l'interface.**
*Pourquoi :* Règle anti-AI-slop. Pas de "Super AI Subtitle Chronos Generator". Juste "EcoSub AI".

❌ **DON'T : Supprimer l'outline de focus (`focus:outline-none`) sans le remplacer par un effet visuel équivalent.**
*Pourquoi :* Rupture de l'accessibilité pour la navigation au clavier.

❌ **DON'T : Utiliser des dégradés de couleurs (gradients) pour les fonds ou les textes.**
*Pourquoi :* L'identité de la marque repose sur la solidité et le brutalisme de couleurs unies aplaties (Flat Design).

---

## 12. Accessibilité

| Champ | Description |
|---|---|
| **Contrastes calculés** | Signal Orange (`#FF4D00`) sur Pure White (`#FFFFFF`) = Ratio ~3.1:1 (⚠️ Limite WCAG AA pour les grands textes, mais justifié par l'usage en fond de bouton avec texte blanc où le contraste Orange/Blanc est validé). Deep Void sur Canvas White = >14:1 (AAA). |
| **Niveau cible** | WCAG 2.1 niveau AA. |
| **Combinaisons à risque** | Ghost Black 40 (`rgba(0,0,0,0.4)`) sur fond gris (`gray-50`). À réserver exclusivement aux textes non essentiels (dates, placeholders). |
| **Focus visible** | Les boutons primaires intègrent `focus:ring-2 focus:ring-offset-2 focus:ring-gray-900`. |
| **Motion** | L'attribut `animate-in` de tailwind-animate respecte implicitement les préférences du système, mais peut nécessiter un flag strict en production. |
| **Texte alternatif** | Les icônes décoratives n'ont pas de texte, mais les boutons purement iconographiques doivent utiliser un attribut `aria-label` ou `title`. |

---

## 13. Tokens CSS — Quick Start

L'application utilisant Tailwind CSS, la configuration se fait principalement via des classes utilitaires directes, mais les variables suivantes conceptualisent le système à intégrer si abstraction nécessaire :

```css
:root {
  /* Couleurs de base */
  --color-signal-orange: #FF4D00;
  --color-signal-hover: #E64500;
  --color-deep-void: #141414;
  --color-canvas-white: #FDFCFB;
  --color-pure-white: #FFFFFF;
  
  /* Utilitaires de contraste */
  --color-ghost-5: rgba(0, 0, 0, 0.05);
  --color-ghost-40: rgba(0, 0, 0, 0.40);

  /* Sémantique métier */
  --color-success: #22C55E;
  --color-warning: #F59E0B;

  /* Typographie (px scaling) */
  --text-hero: 72px;
  --text-h2: 36px;
  --text-h3: 20px;
  --text-body: 16px;
  --text-ui: 14px;
  --text-caption: 12px;
  --text-micro: 10px;

  /* Border Radius */
  --radius-full: 9999px;
  --radius-3xl: 24px;
  --radius-2xl: 16px;
  --radius-xl: 12px;
}
```

*Note: La configuration Tailwind actuelle exploite directement les classes arbitraires (ex: `bg-[#FF4D00]`) pour une vélocité maximale de prototypage. Il est recommandé de transférer ces tokens dans le dictionnaire `theme.extend.colors` du fichier `tailwind.config.js` lors du passage à l'échelle de l'équipe UI.*

---

## Éléments à définir

- [ ] État `Active` (feedback au clic) du bouton secondaire (Ghost Button).
- [ ] Comportement exact et design du focus state (focus-visible) pour les champs de saisie (`input` / `textarea`).
- [ ] Variante visuelle claire pour l'état `Disabled` sur les cartes interactives.
- [ ] Spécification des assets pour les logos de plateforme sociale (tailles et couleurs des logos externes).
