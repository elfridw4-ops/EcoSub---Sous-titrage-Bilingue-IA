# Cahier des Charges - EcoSub AI

## Invite initiale
"Créer une application de sous-titrage automatique bilingue (Français/Anglais) utilisant l'IA Gemini, avec une interface élégante et intuitive." (Reconstitué selon l'objectif du projet).

## Exigences fonctionnelles
- **Upload de vidéo** : Support des fichiers jusqu'à 50Mo.
- **Vidéo de référence** : Possibilité d'uploader une vidéo pour copier son style de sous-titres.
- **Traitement IA** : Transcription, traduction et détection de langue automatiques.
- **Modes de sous-titrage** : Bilingue, Original uniquement, Traduction uniquement.
- **Éditeur de style** : Personnalisation des couleurs, polices, tailles et alignements.
- **Stockage local** : Conservation des vidéos dans le navigateur de l'utilisateur.
- **Historique** : Suivi des générations pour les utilisateurs connectés.

## Exigences non fonctionnelles
- **Performances** : Traitement vidéo rapide via FFmpeg côté serveur.
- **Sécurité** : Protection des clés API (backend), authentification Firebase.
- **Évolutivité** : Architecture modulaire permettant d'ajouter de nouvelles langues ou styles.
- **Expérience Utilisateur** : Interface responsive, animations fluides (Motion), retours d'état clairs.

## Contraintes
- **Navigateur** : Restrictions sur les cookies tiers dans les iframes (nécessite un workaround ou ouverture dans un nouvel onglet).
- **Stockage** : Limites de stockage d'IndexedDB selon le navigateur.
- **Coûts** : Utilisation des quotas gratuits de Gemini et Firebase.
