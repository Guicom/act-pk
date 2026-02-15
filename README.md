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

## Tests manuels

Deux navigateurs/onglets : créer une session, rejoindre via le lien, ajouter/réordonner/passer des stories, voter (Fibonacci ou ?), révélation quand tous ont voté, « Story suivante ».
