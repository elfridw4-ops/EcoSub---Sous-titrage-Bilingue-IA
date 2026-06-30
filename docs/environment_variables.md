# Inventaire et Configuration des Variables d'Environnement (Environment Variables) - EcoSub AI

Ce document présente l'intégralité des variables d'environnement et paramètres système utilisés par l'application EcoSub AI, leur utilité, leur criticité, ainsi que les instructions de sécurisation des secrets.

---

## 📐 1. Récapitulatif des Variables d'Environnement

L'application s'appuie sur une structure épurée et sécurisée. La clé de calcul d'intelligence artificielle étant déléguée directement au navigateur de l'utilisateur final (modèle Bring Your Own Key - BYOK), le serveur Express n'exige que peu de variables d'environnement persistantes :

| Variable | Description | Type / Format | Obligatoire | Valeur par Défaut / Exemple |
| :--- | :--- | :--- | :--- | :--- |
| `APP_URL` | L'URL absolue où l'application est hébergée. Utilisée pour générer les balises sémantiques canoniques et Open Graph de partage social. | Chaîne de caractères (URL) | **Oui** (en production) | `"https://ecosub.ai"` |
| `PORT` | Le port réseau sur lequel le serveur Express démarre et écoute les requêtes HTTP d'incrustation vidéo. | Nombre entier (Port réseau) | Non | `3000` (imposé par Cloud Run) |
| `NODE_ENV` | Définit l'environnement d'exécution de l'application pour activer ou désactiver les outils de développement (Vite HMR). | Énumération (`development`, `production`) | Non | `"production"` |

---

## 🔒 2. Gestion et Sécurisation de la Clé API Gemini (BYOK)

### A. Pourquoi la Clé API n'est pas déclarée dans les Variables d'Environnement du Serveur ?
- **Sécurité et Transparence** : Pour éviter tout risque de vol de secrets, de fuite de clés ou de surconsommation financière par des tiers sur le compte de l'éditeur d'EcoSub AI.
- **Fonctionnement Client** : La clé d'API personnelle de calcul Gemini de l'utilisateur est stockée de manière sécurisée en local dans son propre navigateur (`localStorage`) et est injectée directement depuis son terminal vers le SDK officiel `@google/genai` pour négocier la transcription.

---

## ⚡ 3. Guide de Configuration pour le Déploiement

Lorsque vous déployez le conteneur sur **Google Cloud Run** ou tout autre hébergeur compatible :

1. Déclarez la variable `APP_URL` dans les paramètres de variables d'environnement de votre service Cloud Run :
   ```env
   APP_URL="https://votredomaine.com"
   ```
2. Laissez l'infrastructure injecter automatiquement la variable `PORT=3000` au démarrage du conteneur.
3. Ne committez jamais de fichier `.env` contenant de vrais secrets dans votre dépôt Git public ou partagé. Référez-vous toujours au fichier modèle `/.env.example`.
