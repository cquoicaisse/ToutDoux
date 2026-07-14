# ToutDoux

Assistant anti-procrastination **local** et **doux**. Des tâches contextuelles qui apparaissent quand tu scannes un tag NFC, une interface façon « JARVIS lite », et une IA locale (Ollama) qui t'accueille sans jamais te commander.

Philosophie : les tâches *existent*, elles ne s'imposent pas. Pas de coche façon liste de courses, pas de score. Ce dont tu t'es occupé se **dissout**. Le cœur liquide s'apaise, c'est le seul témoin de ta journée.

Tout tourne sur ton PC. Aucune donnée ne part ailleurs.

---

## Architecture

```
Tag NFC (iPhone) ──► Raccourcis iOS ──► Wake-on-LAN ──► le PC démarre
                                                            │
                          au démarrage : serveur Node + Firefox sur la page
                                                            │
   ┌────────────────────────────────────────────────────────┐
   │  Serveur local (Node/Express, port 3000)                │
   │   • API des tâches ─────────► SQLite (server/data)      │
   │   • /api/greeting ──────────► Ollama (port 11434)       │
   │   • sert l'interface web (client compilé)               │
   └────────────────────────────────────────────────────────┘
```

- **Interface** : React + Vite, cœur métal liquide en React Three Fiber.
- **Serveur** : Express, base **SQLite** (un simple fichier, sauvegardable en une copie).
- **IA** : **Ollama** en local pour un mot d'accueil contextuel. Optionnel — si Ollama n'est pas lancé, l'appli fonctionne normalement avec un message de repli.

---

## Prérequis

- **Node.js 18+** (`node --version`)
- **Ollama** installé, avec un petit modèle. Recommandé pour débuter :
  ```
  ollama pull llama3.2
  ```

---

## Installation

```bash
git clone https://github.com/cquoicaisse/ToutDoux.git
cd ToutDoux
npm run setup      # installe serveur + client, puis compile l'interface
```

`npm run setup` enchaîne : dépendances du serveur, dépendances du client, build du client.

## Lancer

```bash
npm start
```

Puis ouvre **http://localhost:3000**.

Depuis l'iPhone (même Wi-Fi) : **http://IP-DU-PC:3000** — trouve l'IP du PC avec `ipconfig` (Windows) sur la carte Ethernet, ligne « Adresse IPv4 ».

Les paramètres d'URL sélectionnent le contexte, c'est ce que les tags NFC utiliseront :
- `http://localhost:3000/?vue=chambre` — de retour à la maison
- `http://localhost:3000/?vue=sortie` — avant de sortir

---

## Configuration Ollama (optionnelle)

Par défaut le serveur interroge `http://localhost:11434` avec le modèle `llama3.2`.
Pour changer de modèle sans toucher au code, définis des variables d'environnement avant `npm start` :

```bash
# Windows (cmd)
set OLLAMA_MODEL=mistral
npm start
```

Variables disponibles : `OLLAMA_MODEL`, `OLLAMA_URL`, `PORT`.

---

## Démarrage automatique sous Windows

Deux scripts dans `scripts/` :

- **`toutdoux-start.bat`** — démarre le serveur (fenêtre réduite) puis ouvre Firefox sur la page.
- **`toutdoux-stop.bat`** — arrête le serveur.

Pour un lancement au démarrage de session :

1. `Win + R` → `shell:startup`
2. Crée un raccourci vers `scripts/toutdoux-start.bat`.

> Adapte le chemin de Firefox dans le `.bat` si besoin. Pour le plein écran, remplace `firefox.exe` par `firefox.exe -kiosk` (sortie : `Alt+F4`).

---

## Structure du projet

```
ToutDoux/
├── server/
│   ├── index.js          API tâches + endpoint IA + service du client
│   └── data/             base SQLite (créée au 1er lancement, ignorée par git)
├── client/
│   ├── src/
│   │   ├── App.jsx           orchestration
│   │   ├── api.js            appels à l'API locale
│   │   ├── theme.js          design tokens
│   │   └── components/
│   │       ├── LiquidCore.jsx      cœur métal liquide (R3F + shaders)
│   │       ├── RadarBackground.jsx fond radar animé
│   │       ├── BootScreen.jsx      séquence de démarrage
│   │       ├── TaskCard.jsx        carte de tâche (dissolution)
│   │       └── TaskForm.jsx        ajout / modification
│   └── dist/             interface compilée (générée par le build)
└── scripts/              .bat de démarrage/arrêt Windows
```

## Développement

```bash
npm run dev:server     # API sur :3000
npm run dev:client     # Vite sur :5173 (proxy /api vers :3000)
```

---

## Sur les épaules de

Le cœur liquide s'inspire des techniques de [collidingScopes/liquid-logo](https://github.com/collidingScopes/liquid-logo) (licence MIT) : bruit simplex pour la déformation organique, rendu métallique. Rendu 3D via [React Three Fiber](https://r3f.docs.pmnd.rs/).

## Pistes d'évolution

- Contexte « travail » supplémentaire.
- Gamification ambiante (dans le cœur, pas en compteur).
- Écran de monitoring dédié (Raspberry Pi en mode kiosque sur la même URL).
- Accès hors domicile (Tailscale) ou bascule vers un VPS.
- IA plus présente : résumé de journée, regroupement de tâches, suggestions de moments.
