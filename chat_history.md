# Chat History - EcoSub AI

[2026-03-19]
Utilisateur :
je veux pouvoir utiliser l'app sans collé a chaque fois ma clé api donc met la dans le backend

Assistant :
J'ai intégré la clé API Gemini directement dans le backend. L'application utilise désormais `process.env.GEMINI_API_KEY` par défaut.

---

[2026-03-19]
Utilisateur :
Add more robust error handling for the file download process. Specifically, if fetching the file from the server fails, provide a more informative error message to the user and potentially offer a fallback to opening the URL in a new tab.

STOCKAGE LOCAL DES VIDÉOS
Les vidéos générées ne doivent pas être stockées sur un serveur, cloud ou base de données externe.
Le stockage doit être effectué côté utilisateur dans le navigateur.

Assistant :
J'ai implémenté le stockage local via IndexedDB et amélioré la gestion des erreurs. Les vidéos sont maintenant sauvegardées dans le navigateur de l'utilisateur.

---

[2026-03-19]
Utilisateur :
Fix the following errors:
Process error: Problème de cookies de sécurité...

Assistant :
J'ai corrigé les appels `fetch` en supprimant `credentials: 'include'` et ajouté une bannière d'avertissement spécifique pour les iframes afin de guider l'utilisateur.

---

[2026-03-19]
Utilisateur :
Supprimer toutes référence au emoji dans l'App et dans les slides de présentations

Assistant :
Toutes les références aux emojis ont été supprimées du prompt IA, de l'interface et de l'onboarding.

---

[2026-03-19]
Utilisateur :
Add a visual progress bar to show the upload progress of the video file.

Assistant :
J'ai remplacé `fetch` par `XMLHttpRequest` pour suivre la progression de l'upload et ajouté une barre de progression visuelle dans l'interface de chargement.
