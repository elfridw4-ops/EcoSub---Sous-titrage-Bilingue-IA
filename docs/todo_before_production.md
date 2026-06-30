# Checklist de Mise en Production (TODO Before Production) - EcoSub AI

Ce document constitue la feuille de route et la liste de contrôle (checklist) obligatoire à valider et signer par les leads techniques et responsables conformité avant tout déploiement final d'EcoSub AI en environnement de production de niveau entreprise.

---

## 📐 1. Sécurité et Gestion des Données (Security & Data)

- [ ] **Validation des Clés d'API BYOK** : S'assurer que le stockage du `localStorage` contenant la clé API de l'utilisateur final est isolé et inaccessible par des attaques de type Cross-Site Scripting (XSS).
- [ ] **Nettoyage automatique du Serveur (GC)** : Confirmer que la tâche de Garbage Collection d'arrière-plan s'exécute toutes les 15 minutes et supprime définitivement tous les fichiers médias d'upload et d'output vieux de plus d'une heure.
- [ ] **Limiteur de Concurrence FFmpeg** : Vérifier que le sémaphore asynchrone est configuré pour rejeter ou mettre en file d'attente les requêtes d'incrustation au-delà de 2 tâches simultanées pour prévenir les pannes DoS par épuisement CPU.

---

## 🔒 2. Authentification et Autorisations (Auth & Access Control)

- [ ] **Règles de Sécurité Firestore** : Valider que les règles `firestore.rules` verrouillent complètement l'écriture et la suppression de feedbacks à leur UID Firebase auteur, interdisant toute modification non autorisée.
- [ ] **Isolation des Comptes** : S'assurer qu'un utilisateur déconnecté ne peut plus accéder aux métadonnées ou historiques de feedbacks stockés sur Firestore.

---

## 🌍 3. SEO et Partages Sociaux (SEO & Open Graph)

- [ ] **Vérification de l'URL Canonique** : S'assurer que la variable d'environnement `APP_URL` est renseignée avec la valeur de production `"https://ecosub.ai"` dans la configuration de déploiement.
- [ ] **Indexation des Robots** : Confirmer que la page d'accueil possède bien la balise `index, follow` pour autoriser le référencement naturel.

---

## 📱 4. PWA et Performance Hors Ligne (PWA & Performance)

- [ ] **Installabilité PWA** : Valider l'installabilité via l'outil d'évaluation Lighthouse de Chrome, en s'assurant qu'un score >= 90/100 est atteint.
- [ ] **Service Worker Caching** : Vérifier que les icônes multi-résolution, les polices de caractères Google Fonts et les fichiers JS/CSS principaux sont mis en cache correctement pour supporter l'expérience autonome hors ligne.

---

## ⚖️ 5. Conformité Juridique et Transparence (Legal & Compliance)

- [ ] **Point de Contact d'Aide Légale** : S'assurer que l'adresse e-mail `elfridw4@gmail.com` est visible et opérationnelle sur tous les documents légaux.
- [ ] **Cabinet de Transparence RGPD** : Tester de bout en bout l'option de destruction de compte du module "Mes données" pour confirmer qu'elle purge de manière irréversible le localStorage, IndexedDB local, Firebase Auth, et Firestore `/users` et `/feedbacks`.
- [ ] **Décharge d'Hallucinations d'IA** : Vérifier que la clause déchargeant l'éditeur d'EcoSub AI de toute responsabilité vis-à-vis des anomalies ou contre-sens de transcription/traduction générés par l'IA Gemini est bien visible dans la section CGU du site.
