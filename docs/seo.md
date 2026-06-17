# Stratégie Référencement Naturel (SEO) - EcoSub AI

Ce document présente la stratégie SEO technique, de contenu et structurelle de l'application EcoSub AI, optimisée pour le marché du sous-titrage et de la traduction vidéo assistée par intelligence artificielle.

---

## 🚀 1. Optimisations SEO Techniques

### A. Meta-données et Balises HTML d'En-tête (`<head>`)
Nous avons injecté les balises d'en-tête suivantes dans `index.html` pour garantir une indexation parfaite et un affichage optimal sur les moteurs de recherche et les canaux de partage (Open Graph / Twitter Cards) :

- **Langue de la page** : `@html lang="fr"` pour cibler prioritairement le public francophone avec des capacités d'extension multilingue (`hreflang`).
- **Balise Title unique** : `EcoSub AI - Générateur de sous-titres automatiques et incrustation vidéo` (limité à 64 caractères).
- **Meta-description captivante** : `Générez et incrustez des sous-titres professionnels sur vos vidéos en quelques secondes grâce à l'IA de Gemini. Copie de style par référence assurée.` (154 caractères).
- **Robots** : `index, follow` pour autoriser l'indexation globale et la découverte des sous-pages.

### B. Balises Open Graph & Twitter Cards
Pour dynamiser le trafic en provenance des réseaux sociaux (LinkedIn, X/Twitter, Facebook, etc.) :

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="EcoSub AI - Incrustation et Génération de Sous-Titres par IA" />
<meta property="og:description" content="Générez, personnalisez et incrustez des sous-titres sur vos vidéos en un temps record." />
<meta property="og:image" content="https://ecosub.ai/og-image.jpg" />
<meta property="og:url" content="https://ecosub.ai" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="EcoSub AI - Générateur de Sous-Titres" />
<meta name="twitter:description" content="Sous-titrage intelligent et copie de style vidéo par référence." />
```

### C. Données Structurées JSON-LD (Schema.org)
Pour maximiser les chances d'apparaître sous forme de "rich snippets" (extraits enrichis) de type SoftwareApplication ou WebApplication :

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "EcoSub AI",
  "operatingSystem": "All",
  "applicationCategory": "MultimediaApplication",
  "description": "Générateur de sous-titres automatique utilisant l'IA pour transcrire, traduire et incruster des styles complexes de sous-titres sur des fichiers vidéo.",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "EUR"
  },
  "browserRequirements": "Requires JavaScript. Requires HTML5."
}
```

---

## 🎯 2. Recherche et Ciblage de Mots-clés

### Mots-clés Principaux (Volume élevé, Difficulté moyenne à forte)
| Mot-clé | Intent de Recherche | Volume estimé (FR) | Cible |
| :--- | :--- | :--- | :--- |
| `generateur sous titre` | Transactionnel / Outil | 8 100/mois | Créateurs de contenu |
| `sous titre video automatique` | Informationnel / Outil | 5 400/mois | Community managers |
| `incrustation sous titre` | Technique | 2 900/mois | Monteurs vidéo |
| `sous titres srt automatique` | Outil précis | 1 600/mois | YouTubers / Tiktokeurs |

### Mots-clés Secondaires (Longue Traîne - Forte conversion)
- `generer sous titre avec ia`
- `copier style de sous titre reference`
- `sous titrage automatique gemini ia`
- `incrustation permanente sous-titres mp4`
- `sous-titrer gratuitement une video en ligne`

---

## 📐 3. Structure de Pages Optimisée (Sitemap structurel)

Pour une indexation fluide et maximiser le "PageRank" interne :

1. **Page d'Accueil / Landing Page (`/`)**
   - **Rôle** : Conversion immédiate (glisser-déposer de la vidéo), présentation des fonctionnalités de copie de style automatique et exemples visuels.
   - **H1** : "Générateur de sous-titres automatiques par Intelligence Artificielle".
   - **H2** : "Importez votre vidéo, sélectionnez votre style, incrustez en un clic".

2. **Dashboard Utilisateur (`/dashboard / historique`)**
   - **Rôle** : Accès rapide aux anciennes générations enregistrées localement (IndexedDB) pour une réutilisation rapide sans requêtes réseau excessives.
   - **SEO** : Non indexé (`noindex, nofollow`) pour protéger la confidentialité des données utilisateurs.

3. **Guide Technique et Centre d'Aide (`/guides / faq`)**
   - **Rôle** : Capter le trafic de longue traîne ("Comment incruster des sous-titres sur MP4 ?", "Qu'est-ce qu'une clé API Gemini ?").

---

## ✍️ 4. Exemples Précis de Balisage (On-Page SEO)

### Landing Page SEO Block :
```html
<header>
  <h1 class="text-3xl font-bold">EcoSub AI : Le Meilleur Générateur de Sous-Titres Automatiques</h1>
  <p class="text-md">L'outil de transcription vidéo ultime boosté par l'intelligence artificielle Gemini.</p>
</header>

<section>
  <h2>Comment fonctionne le sous-titrage automatique ?</h2>
  <div class="grid">
    <div>
      <h3>1. Glissez-déposez votre vidéo</h3>
      <p>Glissez votre fichier vidéo MP4 ou MOV directement dans la zone de téléchargement.</p>
    </div>
    <div>
      <h3>2. Choisissez ou copiez un style</h3>
      <p>Sélectionnez un preset intégré (YouTube Classic, Netflix, Modern Green) ou utilisez notre outil exclusif de copie de style par référence.</p>
    </div>
    <div>
      <h3>3. Récupérez votre vidéo incrustée</h3>
      <p>Téléchargez votre vidéo finale avec les sous-titres encodés de manière permanente.</p>
    </div>
  </div>
</section>
```

---

## 📉 5. Bonnes Pratiques SEO sur le Long Terme

1. **Optimisation Core Web Vitals** :
   - Temps d'interactivité : Réduit grâce au **Web Worker** pour la conversion Base64, évitant de bloquer le thread principal.
   - Cumulative Layout Shift (CLS) : Rendu fluide et stable des zones de dépôt fichiers et de l'éditeur de style via des transitions contenues dans `motion/react`.

2. **Gestion des Liens Morts et du Poids des Médias** :
   - Nettoyage côté serveur (`cleanupOldFiles`) à intervalles réguliers de 15 min pour garantir des performances optimales et aucune erreur de serveur saturé.

3. **Attributs Accessibilité (Alt & Aria-labels)** :
   - Chaque bouton interactif d'édition de style et de configuration de clé possède un `id` unique, un libellé clair, et des attributs contrastés facilitant le référencement mobile d'indexation.
