# Planning Poker

Session de sprint en temps réel avec vote à cartes (Fibonacci). Création de session, backlog partagé, vote et révélations en direct via WebSockets.

## Prérequis

- Node.js 20+
- npm

## Démarrage

1. **Backend** (API + Socket.IO) :
   ```bash
   cd backend && npm install && npm run dev
   ```
   Serveur sur `http://localhost:3000`

2. **Frontend** (Vite + React) :
   ```bash
   cd frontend && npm install && npm run dev
   ```
   App sur `http://localhost:5173` (proxy `/api` et `/socket.io` vers le backend)

3. Ouvrir http://localhost:5173 : créer une session, copier le lien d’invitation, ouvrir un second onglet pour rejoindre avec un nom, ajouter des stories, voter et révéler.

## Structure

- `backend/` — Express, Socket.IO, store en mémoire (`src/store.js`, `src/index.js`)
- `frontend/` — Vite, React, React Router, Socket.IO client (`src/pages/`, `src/components/`)

## Déploiement (Vercel + backend externe)

Vercel ne fait tourner que le **frontend** (site statique). L’API et les WebSockets (Socket.IO) doivent tourner sur un **backend séparé** (Railway, Render, Fly.io, etc.).

1. **Déployer le backend** ailleurs (ex. Railway) :
   - Créer un projet, connecter le repo, définir le **root** sur `backend` (ou le dossier qui contient `package.json` du backend).
   - Exposer le port fourni par l’hébergeur (souvent `process.env.PORT`).
   - Noter l’URL publique du backend (ex. `https://planning-poker-backend.railway.app`).

2. **Déployer le frontend sur Vercel** :
   - Importer le repo, définir le **Root Directory** sur `frontend`.
   - Build : `npm run build` (déjà le défaut si `package.json` est dans `frontend`).
   - **Variable d’environnement** : ajouter `VITE_API_ORIGIN` = URL du backend (sans slash final), ex. `https://planning-poker-backend.railway.app`.
   - Redéployer pour que la variable soit prise en compte.

3. **CORS** : le backend autorise déjà toutes les origines (`cors({ origin: true })`). Si tu restreins plus tard, ajouter l’URL Vercel du frontend.

Sans `VITE_API_ORIGIN`, le frontend appelle la même origine (Vercel) : il n’y a pas d’API ni de Socket.IO là, donc « Créer un sprint planning » échoue. Avec `VITE_API_ORIGIN` pointant vers ton backend, tout fonctionne.

## Tests manuels

Deux navigateurs/onglets : créer une session, rejoindre via le lien, ajouter/réordonner/passer des stories, voter (Fibonacci ou ?), révélation quand tous ont voté, « Story suivante ».
