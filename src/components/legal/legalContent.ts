export type LegalDocumentId = 'legal' | 'cgu' | 'privacy' | 'cookies';

export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  legal: {
    title: 'Mentions Légales',
    lastUpdated: '25 Juin 2026',
    sections: [
      {
        id: 'editor',
        title: '1. Éditeur du Service',
        content: `EcoSub AI est une plateforme web éditée à titre personnel, dans le cadre d'une initiative technologique privée visant à démocratiser le sous-titrage sémantique et la stylisation augmentée par intelligence artificielle.

* **Directeur de la publication et Créateur :** Horacio CHINKOUN
* **Contact électronique :** elfridw4@gmail.com
* **Statut :** Éditeur indépendant / Développeur Particulier

Pour toute question d'ordre légal ou réglementaire, veuillez adresser vos demandes à [elfridw4@gmail.com](mailto:elfridw4@gmail.com).`
      },
      {
        id: 'hosting',
        title: '2. Hébergement de l\'Infrastructure',
        content: `L'architecture serveur, le déploiement cloud (via Cloud Run) et les services d'authentification et de base de données (Firebase) de l'application sont hébergés et infogérés par :

**Google Cloud Platform EMEA**
Google Ireland Limited
Gordon House, Barrow Street
Dublin 4, Irlande
[Contact hébergeur](https://cloud.google.com/contact)`
      },
      {
        id: 'intellectual',
        title: '3. Propriété Intellectuelle et Droits d\'Auteur',
        content: `L'ensemble de l'interface fonctionnelle et esthétique, l'architecture logicielle, les bases de code front-end et back-end (hors dépendances open source), ainsi que les éléments graphiques constitutifs (logo, identité visuelle, agencement des composants) sont la propriété exclusive de l'éditeur de la plateforme. 

**3.1. Droit sur la plateforme :** Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, de ces éléments est strictement interdite sans l'accord exprès par écrit de l'éditeur. Cette représentation ou reproduction constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.

**3.2. Droit sur vos fichiers :** Les utilisateurs conservent l'intégralité de leurs droits de propriété intellectuelle sur les fichiers de référence et les vidéos importées sur la plateforme. EcoSub AI n'acquiert aucun droit de propriété sur votre contenu de création.`
      },
      {
        id: 'liability',
        title: '4. Limitation de Responsabilité',
        content: `L'éditeur décline toute responsabilité quant à l'utilisation qui pourrait être faite des informations et des contenus présents sur EcoSub AI. L'éditeur ne saurait être tenu pour responsable des dommages directs et indirects causés au matériel de l'utilisateur lors de l'accès à l'application.

L'application EcoSub AI peut nécessiter des modifications, des mises à jour régulières ou subir des interruptions temporaires pour des raisons de maintenance technique ou d'évolution des modèles d'intelligence artificielle, sans qu'aucun dédommagement ne puisse être exigé par les utilisateurs.`
      },
      {
        id: 'law',
        title: '5. Droit Applicable et Juridiction Compétente',
        content: `Les présentes mentions légales sont soumises au droit français et aux réglementations de l'Union Européenne applicables aux services de communication en ligne. En cas de litige n'ayant pu faire l'objet d'un accord amiable, seuls les tribunaux français seront jugés compétents, sous réserve d'une attribution de compétence spécifique découlant d'un texte de loi particulier.`
      }
    ]
  },
  cgu: {
    title: "Conditions Générales d'Utilisation",
    lastUpdated: '25 Juin 2026',
    sections: [
      {
        id: 'object',
        title: '1. Objet des CGU',
        content: `Les présentes Conditions Générales d'Utilisation définissent les dispositions et les contraintes applicables lors de l'utilisation d'EcoSub AI, un service innovant d'incrustation vidéo et de stylisation de sous-titres basé sur l'intégration du modèle d'Intelligence Artificielle Google Gemini.`
      },
      {
        id: 'byok',
        title: '2. Accès au Service & Modèle BYOK',
        content: `L'originalité technique et légale d'EcoSub AI repose sur son modèle décentralisé dit **« Bring Your Own Key »** (Apportez Votre Propre Clé).

* **Aucune facturation interne :** EcoSub AI ne facture aucun crédit d'utilisation pour le traitement par l'Intelligence Artificielle.
* **Délégation de fourniture d'API :** L'utilisateur a la stricte obligation de renseigner sa propre clé API Google AI (Gemini) valide provenant de son compte Google AI Studio.
* **Responsabilité financière :** Les éventuels frais d'usage appliqués par Google pour l'utilisation de cette clé (dépassant le quota gratuit offert) sont à l'entière charge de l'utilisateur. La clé est stockée uniquement en local et de manière sécurisée.`
      },
      {
        id: 'capacity',
        title: '3. Âge et Capacité Juridique',
        content: `Afin de se conformer conjointement aux exigences européennes (RGPD/Code du Numérique) et internationales en matière de protection des mineurs en ligne :

* **L'accès à ce service est formellement interdit aux personnes de moins de 15 ans** (sur le territoire européen) sans recueil formel d'un consentement par les titulaires de l'autorité parentale.
* Pour tout utilisateur soumis aux règles internationales (**COPPA**), l'accès aux moins de 13 ans est irrévocablement interdit.

*En utilisant cette application, vous déclarez sur l'honneur avoir la capacité juridique requise et l'âge de la majorité numérique de votre territoire.*`
      },
      {
        id: 'ai-liability',
        title: '4. Clause d\'Exonération Liée à l\'IA',
        content: `### 4.1. Nature probabiliste de l'IA (Hallucinations)
L'utilisateur est informé et accepte explicitement que les textes, transcriptions temporelles et traductions générées par EcoSub AI sont produits sous la direction probabiliste d'un modèle d'IA générative (Google Gemini). Par nature, ce modèle est soumis à des limitations (phénomène d'hallucinations), pouvant inventer des propos, décaler les horodatages, ou produire des formulations inadaptées ou erronées.

### 4.2. Exonération totale de responsabilité de l'éditeur
Dans les limites du droit applicable, l'éditeur d'EcoSub AI se dégage de toute responsabilité légale, morale ou financière concernant :
* **La justesse du texte :** Contresens traductifs, formulations inappropriées issues du traitement de l'audio, ou éléments indésirables incrustés sur la vidéo finale.
* **L'exploitation commerciale et pénale :** Tout préjudice découlant de la diffusion ou l'exploitation publique de la vidéo sous-titrée sur vos plateformes (YouTube, TikTok, Instagram, etc.).

### 4.3. Obligation manuelle de vérification par l'utilisateur
L'utilisateur est **l'unique garant et directeur de publication** de la vidéo produite :
* L'utilisateur s'engage formellement à relire et éditer les transcriptions à l'aide de l'outil interactif d'EcoSub AI **avant** d'appliquer l'incrustation physique et de télécharger ou diffuser la vidéo finale.

### 4.4. Conformité au Règlement Européen sur l'IA (EU AI Act)
Les médias textuels manipulés au sein d'EcoSub AI sont générés ou assistés de manière interactive par un système d'Intelligence Artificielle présentant des risques limités au sens de l'EU AI Act, exigeant une transparence quant à son utilisation.`
      },
      {
        id: 'abuse',
        title: '5. Abus Informatiques et Atteintes au Serveur',
        content: `Toute tentative de sabotage ou de manipulation malveillante des flux d'information de l'application fera l'objet de poursuites pénales :

* **Interdiction stricte :** Le contournement de l'interface, l'exploitation malveillante de l'outil FFmpeg via des fichiers corrompus, ou l'exécution de commandes non autorisées visant à surcharger le conteneur Cloud Run de l'éditeur.
* **Sanctions :** Blocage instantané de l'accès, suppression de session et signalement de l'adresse IP aux autorités judiciaires compétentes.`
      }
    ]
  },
  privacy: {
    title: 'Politique de Confidentialité',
    lastUpdated: '25 Juin 2026',
    sections: [
      {
        id: 'controller',
        title: '1. Responsable de Traitement',
        content: `Monsieur **Horacio CHINKOUN** agit en qualité de Responsable de Traitement concernant les données techniques et personnelles confiées à la plateforme EcoSub AI, conformément au RGPD et aux législations locales sur l'économie numérique.`
      },
      {
        id: 'data-inventory',
        title: '2. Données Personnelles Collectées',
        content: `Afin de faire fonctionner l'application, nous collectons les données minimales suivantes :

| Donnée | Source | Finalité principale | Rétention |
|---|---|---|---|
| **Identifiants Sociaux** | Google Sign-In | Connexion, synchronisation et protection de session. | Jusqu'à suppression du compte |
| **Vidéos & Audios** | Upload de l'utilisateur | Extraction de l'audio pour transcription et incrustation. | **1 heure maximum (Suppression Auto)** |
| **Clé API Gemini** | Saisie manuelle (BYOK) | Communication directe avec Google AI Studio. | Chiffrement Local uniquement |

*Aucune adresse physique, aucun moyen de paiement et aucun document officiel d'identité ne sont demandés ou stockés par EcoSub AI.*`
      },
      {
        id: 'byok-transit',
        title: '3. Flux de Données & Modèle BYOK',
        content: `L'application opère selon un modèle d'intermédiation directe (BYOK) avec les services de Google AI Studio.

⚠️ **ATTENTION AUX SÉCURITÉS GOOGLE (Free Tier VS Paid) :**
* Si vous configurez une clé API d'un compte gratuit Google AI Studio, les conditions d'utilisation de Google l'autorisent à stocker et faire analyser vos contenus (audio, vidéo, invite) par des opérateurs humains pour entraîner ses futurs modèles.
* Si vos contenus contiennent des informations hautement confidentielles, d'ordre médical, bancaire ou sous brevet, nous vous recommandons formellement d'utiliser une clé liée à un projet Google Cloud Platform (GCP) avec facturation activée (*Google Cloud API Key Pay-as-you-go*), pour laquelle Google exclut explicitement tout enregistrement ou examen humain à des fins d'entraînement.`
      },
      {
        id: 'retention',
        title: '4. Politique d\'Effacement Strict',
        content: `Notre architecture est conçue selon le principe du respect de la vie privée dès la conception (*Privacy by Design*) :

* **Élimination instantanée des vidéos :** Toutes les vidéos chargées sur notre serveur Cloud Run sont systématiquement et définitivement supprimées de la mémoire physique et du stockage temporaire du serveur au maximum **1 heure** après leur téléversement, par un script automatisé d'effacement périodique.
* **Sécurité de votre clé API :** Votre clé API Gemini est conservée sous forme sécurisée et chiffrée uniquement au sein de la base locale de stockage de votre propre navigateur (*LocalStorage*). Elle ne transite jamais et n'est jamais sauvegardée sur nos serveurs.
* **Base de données locale (IndexedDB) :** Vos projets de sous-titrage locaux sont enregistrés dans l'espace de stockage de votre navigateur. Vous pouvez activer une option de purge automatique après 21 jours d'inactivité depuis la console d'administration de vos données.`
      },
      {
        id: 'rights',
        title: '5. Exercice de vos Droits (RGPD)',
        content: `Conformément au RGPD, vous disposez d'outils en libre-service instantanés dans le panneau **« Gérer mes données »** :

1. **Droit à l'accès et à la portabilité :** Export immédiat et structuré de l'ensemble de votre historique de projet au format standardisé JSON et d'un tableau CSV.
2. **Droit à l'oubli total et instantané :** Un bouton unique permet de purger instantanément toutes les informations de votre navigateur (clés d'API, IndexedDB) et d'anonymiser irréversiblement votre compte utilisateur sur nos serveurs Firebase.`
      }
    ]
  },
  cookies: {
    title: 'Politique Relative aux Cookies',
    lastUpdated: '25 Juin 2026',
    sections: [
      {
        id: 'definition',
        title: '1. Qu\'est-ce qu\'un Cookie ou un Traceur ?',
        content: `Un cookie, un pixel ou une clé de stockage local est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) lors de la consultation d'un site internet. Il permet de retenir des préférences ou de maintenir votre session utilisateur active.`
      },
      {
        id: 'types',
        title: '2. Traceurs et Technologies Utilisés',
        content: `EcoSub AI est engagé dans un respect absolu de votre vie privée. De ce fait :

* **Aucun cookie publicitaire :** Nous n'utilisons aucun traceur publicitaire, ciblage marketing ou outil d'analyse comportementale de tierces parties.
* **Pas de cookies de profilage :** Vos habitudes de navigation ne sont jamais revendues ou analysées.
* **Traceurs exclusivement techniques (Essentiels) :**
  * **Firebase Auth Token :** Clé de session cryptée et sécurisée permettant de maintenir votre authentification active de manière sécurisée.
  * **LocalStorage :** Utilisé pour mémoriser localement votre clé API Gemini (uniquement si vous avez choisi de la sauvegarder) et votre statut de visite pour éviter d'afficher le tutoriel à chaque fois.
  * **IndexedDB :** Base de données interne au navigateur utilisée pour sauvegarder vos projets de sous-titrage hors-ligne de manière ultra-sécurisée.`
      },
      {
        id: 'iframe-consent',
        title: '3. Cas Particulier de l\'Intégration en Iframe',
        content: `Lorsqu'EcoSub AI est utilisé au sein d'un espace de démonstration ou d'un cadre intégré (*Iframe*), certains navigateurs modernes (tels que Safari ou Chrome en mode de navigation privée) bloquent les traceurs et cookies dits "tiers" par défaut :

* **Notre approche :** L'application a été programmée de manière résiliente et sans état (Stateless) pour ne pas dépendre du stockage de cookies réseau tiers pour ses fonctionnalités essentielles de sous-titrage.
* **Sécurité :** L'utilisation de Firebase Authentication peut néanmoins nécessiter d'autoriser les cookies de session Firebase pour la liaison de compte.`
      },
      {
        id: 'management',
        title: '4. Comment Gérer vos Consentements et Données ?',
        content: `Parce que nous n'utilisons aucun traceur de marketing ou d'analyse comportementale non essentiel, le dépôt préalable d'un bandeau d'acceptation de traceurs publicitaires n'est pas requis selon la CNIL et les directives européennes.

Cependant, vous gardez un contrôle total :
* Vous pouvez purger toutes les données stockées localement par l'application (LocalStorage et IndexedDB) d'un seul clic à l'aide de l'outil **« Supprimer toutes mes données »** accessible dans l'interface de gestion.
* Vous pouvez paramétrer votre navigateur web pour rejeter tout type de stockage persistant.`
      }
    ]
  }
};
