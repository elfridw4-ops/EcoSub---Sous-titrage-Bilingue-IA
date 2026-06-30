# Guide de Déploiement et d'Exploitation (Deployment Guide) - EcoSub AI

Ce document présente la méthodologie complète pour compiler, héberger, sécuriser et superviser l'application EcoSub AI lors de son passage en environnement de production de niveau entreprise.

---

## 📐 1. Hébergement Conseillé : Google Cloud Run

EcoSub AI effectuant des tâches intensives d'encodage et d'incrustation vidéo (FFmpeg), l'architecture en conteneur sans état est idéale pour absorber les pics de charge :

- **Plateforme cible** : Google Cloud Run.
- **Pourquoi ce choix** :
  - **Mise à l'échelle automatique (Scale-to-Zero)** : Permet de ne payer que pour les secondes où l'application traite activement des vidéos. Le service s'éteint s'il n'y a pas de trafic (facturation nulle).
  - **Gestion de la RAM / CPU** : Permet d'allouer précisément la puissance requise pour FFmpeg (recommandé : minimum 2 CPU et 2 Go de mémoire RAM par instance).
  - **Prise en charge de Docker** : Idéal pour embarquer les dépendances binaires de FFmpeg.

---

## 🚀 2. Instructions de Compilation (Build Production)

Pour déployer l'application, suivez les étapes de compilation standard :

1. Nettoyez les anciennes compilations :
   ```bash
   npm run clean
   ```
2. Compilez le frontend de production statique (qui sera servi par le backend Express une fois déployé) :
   ```bash
   npm run build
   ```
3. Les fichiers optimisés sont générés dans le dossier `/dist`.

---

## 🔒 3. Sécurisation, Nom de Domaine et HTTPS

Pour assurer la confidentialité des transferts de vidéos et des clés API BYOK :

- **HTTPS Strict (SSL/TLS)** : Obligatoire pour utiliser les fonctionnalités PWA, l'accès sécurisé à IndexedDB locale et le service de Web Worker. Google Cloud Run fournit automatiquement des certificats SSL managés gratuits.
- **Configuration du Nom de Domaine** :
  1. Achetez le nom de domaine cible (ex: `ecosub.ai`).
  2. Associez le domaine à votre service Cloud Run via le panneau de gestion DNS Google Cloud en ajoutant les enregistrements de type `CNAME` et `A` demandés.
  3. Renseignez la variable d'environnement `APP_URL="https://ecosub.ai"` dans la configuration de votre conteneur de production.

---

## 📈 4. Surveillance, Monitoring et Sauvegardes

- **Supervision du CPU / RAM** : Configurez des alertes d'utilisation de ressources dans Google Cloud Monitoring pour identifier si la limite de concurrence FFmpeg (sémaphore de 2 processus max) doit être ajustée ou si les instances Cloud Run saturent.
- **Logs d'Erreurs** : Les logs d'erreurs d'incrustation vidéo et de requêtes rejetées sont envoyés directement dans Cloud Logging pour une traçabilité optimale en cas d'attaque par déni de service (DoS).
- **Politique de Sauvegarde (Zéro Base de Données)** : 
  - L'application d'incrustation étant entièrement décentralisée et sans état (stateless), elle n'exige aucune base de données de production relationnelle critique à sauvegarder, éliminant les risques de panne ou de perte de données d'activité de l'utilisateur.
  - Seule la collection Firebase Firestore de feedbacks et le système Firebase Auth d'identités doivent être configurés avec des politiques d'accès verrouillées.
