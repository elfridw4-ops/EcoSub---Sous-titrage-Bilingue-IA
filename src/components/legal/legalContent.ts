export type LegalDocumentId = 'legal' | 'cgu' | 'privacy';

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  content: string;
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  legal: {
    title: 'Mentions Légales',
    lastUpdated: '17 Juin 2026',
    content: `## 1. Éditeur du service
EcoSub AI est un service édité à titre personnel.
Directeur de la publication : Horacio CHINKOUN
Contact : elfridw4@gmail.com

## 2. Hébergement
L'application est hébergée par Google Cloud Platform (Google Cloud Run / Firebase).
Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande.

## 3. Propriété intellectuelle
L'ensemble des éléments constituant l'interface de l'application EcoSub AI (graphismes, code source non-tiers, nom et logo) constituent des œuvres protégées. Toute reproduction est interdite. Les utilisateurs conservent l’intégralité de leurs droits sur les vidéos importées et sous-titrées via la plateforme.`
  },
  cgu: {
    title: 'Conditions Générales d\'Utilisation (CGU)',
    lastUpdated: '17 Juin 2026',
    content: `## 1. Objet
Les présentes CGU définissent les conditions dans lesquelles EcoSub AI met à disposition son service d'incrustation et stylisation de sous-titres assisté par IA.

## 2. Accès au service et Mode "Bring Your Own Key" (BYOK)
EcoSub AI est basé sur le modèle "Bring Your Own Key". L'utilisateur doit renseigner une clé API Google Gemini valide pour effectuer des opérations de sous-titrage. EcoSub AI ne facture aucun crédit d'IA. L'utilisateur est responsable des coûts éventuels liés à sa clé API en dehors du service.

## 3. Restriction d'âge
**L'accès à ce service est strictement interdit aux moins de 15 ans sans le consentement exprès des titulaires de l'autorité parentale.** Pour tout usage en dehors de l'Union européenne, y compris aux États-Unis (COPPA), l'âge minimum requis est de 13 ans sous protocole d'autorisation. 

## 4. CLAUSE D'EXONÉRATION DE RESPONSABILITÉ - GÉNÉRATION IA (Important)
### 4.1. Nature probabiliste de l'IA
L'utilisateur reconnaît que les sous-titres générés sont produits par un modèle d'intelligence artificielle probabiliste (Google Gemini via API) sujet à des limitations inhérentes (hallucinations possibles, contresens, erreurs de traduction pouvant s'avérer inadaptées, offensantes ou diffamatoires).

### 4.2. Exonération de responsabilité de l'éditeur
Sous réserve des obligations légales impératives, l'éditeur d'EcoSub AI est exonéré de toute responsabilité concernant :
a) **Contenu généré par IA** : Pour tout contresens, altération de sens, contenu offensant incrusté sur la vidéo.
b) **Exploitation** : Pour les dommages résultant de la publication des vidéos (incluant les pénalités de plateformes type TikTok/YouTube, préjudice moral, ou poursuites de tiers).

### 4.3. Responsabilité exclusive de l'utilisateur
L'utilisateur est **exclusivement responsable** du contenu final. Il s'engage formellement à relire et **vérifier manuellement** l'exactitude des transcriptions avant toute diffusion publique. **En aucun cas, un contenu ne devrait être publié sans vérification de ce que l'IA a généré.**

### 4.4. Avertissement obligatoire (Transparence EU AI Act)
AVERTISSEMENT : Les sous-titres sont générés d'une manière entièrement automatique par une intelligence artificielle de risque limité (AI Act) et peuvent par nature contenir des erreurs. Veuillez relire attentivement l'audio, la vidéo et les sous-titres.

## 5. Abus
Tout tentative de hack de l'infrastructure de traitement (notamment FFmpeg) entraînera des sanctions irréversibles et un signalement de l'adresse IP de provenance.
`
  },
  privacy: {
    title: 'Politique de Confidentialité',
    lastUpdated: '17 Juin 2026',
    content: `## 1. Responsable de Traitement
Horacio CHINKOUN édite la plateforme EcoSub AI et détermine les finalités d'usage en qualité de Responsable de Traitement.

## 2. Données collectées
Afin d'assurer le fonctionnement de notre service, nous collectons via Google Auth : Identifiant technique (UID), email, nom de profil, photo de profil. Nous collectons temporairement vos fichiers médias (vidéos). Vous fournissez également une clé d'API personnelle stockée en local.

## 3. Modèle "Bring Your Own Key" et Traitements distants (Google)
Ce service connecte votre navigateur aux serveurs de **Google AI Studio**.
⚠️ **Attention** : Si vous utilisez une clé API issue du tier gratuit (*free tier*) de Google AI Studio, Google s'autorise contractuellement à ce que **des relecteurs humains lisent ou écoutent les données afin d'entraîner ses futurs modèles d'IA**. Si votre vidéo contient des données très sensibles, veuillez vous retenir de l'upload ou utiliser un *compte Google Cloud Billing* payant que Google exclut de cet entraînement. EcoSub AI n'est pas lié contractuellement à Google concernant votre transfert Base64 ; ceci est un acte pris sous la responsabilité des conditions de votre clé API. Le transfert hors Union européenne potentiellement opéré par Google s'effectue sous le cadre légal des CCT / SCC Google.

## 4. Durées de conservation
- **Fichiers médias et vidéos** : Cycle de corbeille stricte (*Clean Engine* Garbage Collector). Les vidéos brutes sur nos serveurs et fichiers de métadonnées sont supprimées de façon irréversible en maximum **une heure**.
- **Historique et Base de données locale** : L'historique des projets, segments de texte et traductions est hébergé localement sur votre navigateur via la technologie IndexedDB. Vous maîtrisez sa destruction absolue via l'interface "Mes Données" ou au plus tard sous 21 jours par purge automatique optionnelle.
- **Identifiants** : Supprimés dès la requête de clôture du compte dans l'interface de confidentialité.

## 5. Droits de l'Utilisateur
Conformément au Règlement Général sur la Protection des Données (RGPD), un outil automatisé centralisé dans l'option "Gérer mes données" a été développé afin que vous puissiez jouir de droits d'accès inconditionnels. L'export JSON et CSV des données et l'effacement total sont offerts numériquement avec traitement immédiat.`
  }
};
