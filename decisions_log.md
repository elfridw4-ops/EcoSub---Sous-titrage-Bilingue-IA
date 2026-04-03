# Decisions Log - EcoSub AI

## Utilisation d'IndexedDB pour le stockage vidéo
- **Date** : 2026-03-19
- **Contexte** : L'utilisateur ne veut pas de stockage serveur pour les vidéos générées pour des raisons de coût et de confidentialité.
- **Décision** : Utiliser IndexedDB pour stocker les Blobs vidéo de manière persistante dans le navigateur.
- **Alternatives envisagées** : Blob URLs (temporaires uniquement), LocalStorage (limité à 5Mo).
- **Conséquences** : Permet de conserver les vidéos après rafraîchissement, mais dépend de l'espace disque disponible du navigateur.

## Migration de la clé API vers le Backend
- **Date** : 2026-03-19
- **Contexte** : Sécuriser la clé Gemini et éviter que l'utilisateur n'ait à la saisir manuellement.
- **Décision** : Utiliser les variables d'environnement côté serveur.
- **Alternatives envisagées** : Saisie manuelle côté client (conservée comme option de secours).
- **Conséquences** : Meilleure sécurité et UX simplifiée.

## Passage à XMLHttpRequest pour l'upload
- **Date** : 2026-03-19
- **Contexte** : L'API `fetch` native ne permet pas de suivre la progression de l'upload (uniquement du download).
- **Décision** : Utiliser `XMLHttpRequest` avec l'événement `upload.onprogress`.
- **Alternatives envisagées** : Bibliothèques tierces comme Axios (évité pour limiter les dépendances).
- **Conséquences** : Permet d'afficher une barre de progression réelle à l'utilisateur.

## Suppression des Emojis
- **Date** : 2026-03-19
- **Contexte** : Demande de l'utilisateur pour un rendu plus sobre.
- **Décision** : Retirer toute logique liée aux emojis dans le prompt et l'UI.
- **Alternatives envisagées** : Option désactivable (rejeté pour simplifier).
- **Conséquences** : Interface plus épurée et professionnelle.
