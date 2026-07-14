// ═══════════════════════════════════════════════════════════
//  ToutDoux — serveur local
//  API REST des tâches (SQLite) + service de l'interface web
// ═══════════════════════════════════════════════════════════
import express from "express";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// ─── Base de données : un simple fichier, sauvegardable en une copie ───
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "toutdoux.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    ctx        TEXT    NOT NULL DEFAULT 'chambre',   -- 'chambre' | 'sortie'
    recurring  INTEGER NOT NULL DEFAULT 0,           -- 0/1
    duration   INTEGER,                              -- minutes, NULL = pas d'estimation
    done_on    TEXT,                                 -- 'YYYY-MM-DD', NULL = à faire
    created_at TEXT    NOT NULL DEFAULT (date('now','localtime'))
  );
`);

// Premier lancement : quelques exemples pour ne pas démarrer sur du vide
if (db.prepare("SELECT COUNT(*) AS n FROM tasks").get().n === 0) {
  const seed = db.prepare(
    "INSERT INTO tasks (name, ctx, recurring, duration) VALUES (?, ?, ?, ?)"
  );
  seed.run("Vider le lave-vaisselle", "chambre", 1, 10);
  seed.run("Session lab GOAD", "chambre", 1, 45);
  seed.run("Clés + badge du travail", "sortie", 1, null);
  seed.run("Gourde remplie", "sortie", 1, null);
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Ménage quotidien : les ponctuelles effacées avant aujourd'hui disparaissent.
// Les récurrentes n'ont rien à faire : "faite" = done_on égale à aujourd'hui,
// donc demain elles redeviennent actives toutes seules.
function housekeeping() {
  db.prepare(
    "DELETE FROM tasks WHERE recurring = 0 AND done_on IS NOT NULL AND done_on < ?"
  ).run(today());
}

const toClient = (r) => ({
  id: r.id,
  name: r.name,
  ctx: r.ctx,
  recurring: !!r.recurring,
  duration: r.duration,
  done: r.done_on === today(),
});

// ─── API ───
const app = express();
app.use(express.json());

app.get("/api/tasks", (req, res) => {
  housekeeping();
  const rows = req.query.ctx
    ? db.prepare("SELECT * FROM tasks WHERE ctx = ? ORDER BY created_at").all(req.query.ctx)
    : db.prepare("SELECT * FROM tasks ORDER BY created_at").all();
  res.json(rows.map(toClient));
});

app.post("/api/tasks", (req, res) => {
  const { name, ctx = "chambre", recurring = false, duration = null } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "name requis" });
  if (!["chambre", "sortie"].includes(ctx)) return res.status(400).json({ error: "ctx invalide" });
  const info = db
    .prepare("INSERT INTO tasks (name, ctx, recurring, duration) VALUES (?, ?, ?, ?)")
    .run(name.trim(), ctx, recurring ? 1 : 0, duration ?? null);
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(toClient(row));
});

app.patch("/api/tasks/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "introuvable" });

  const b = req.body || {};
  const name = b.name !== undefined ? String(b.name).trim() : row.name;
  const ctx = b.ctx !== undefined ? b.ctx : row.ctx;
  const recurring = b.recurring !== undefined ? (b.recurring ? 1 : 0) : row.recurring;
  const duration = b.duration !== undefined ? b.duration : row.duration;
  let done_on = row.done_on;
  if (b.done === true) done_on = today();     // dissolution
  if (b.done === false) done_on = null;       // annulation

  if (!["chambre", "sortie"].includes(ctx)) return res.status(400).json({ error: "ctx invalide" });

  db.prepare(
    "UPDATE tasks SET name = ?, ctx = ?, recurring = ?, duration = ?, done_on = ? WHERE id = ?"
  ).run(name, ctx, recurring, duration ?? null, done_on, row.id);

  res.json(toClient(db.prepare("SELECT * FROM tasks WHERE id = ?").get(row.id)));
});

app.delete("/api/tasks/:id", (req, res) => {
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "introuvable" });
  res.status(204).end();
});

// ─── Couche IA locale (Ollama) — 100 % sur le PC, aucune donnée ne sort ───
// Ollama expose son API sur http://localhost:11434. On lui envoie les tâches
// du moment et on lui demande un mot d'accueil bref, jamais culpabilisant.
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

app.get("/api/greeting", async (req, res) => {
  const ctx = req.query.ctx === "sortie" ? "sortie" : "chambre";
  housekeeping();
  const rows = db
    .prepare("SELECT * FROM tasks WHERE ctx = ? ORDER BY created_at")
    .all(ctx)
    .map(toClient)
    .filter((t) => !t.done);

  // Repli neutre si Ollama n'est pas lancé : l'appli ne casse jamais pour autant.
  const fallback =
    ctx === "sortie"
      ? "Avant de filer, un dernier coup d'œil."
      : "De retour. Voilà ce qui t'attend, à ton rythme.";

  if (rows.length === 0) {
    return res.json({ text: ctx === "sortie" ? "Rien à vérifier, bonne journée." : "Rien de prévu. Souffle un peu." });
  }

  const liste = rows
    .map((t) => `- ${t.name}${t.duration ? ` (${t.duration} min)` : ""}`)
    .join("\n");

  const lieu =
    ctx === "sortie"
      ? "L'utilisateur s'apprête à sortir de chez lui."
      : "L'utilisateur vient de rentrer chez lui.";

  const prompt = `${lieu} Voici ses tâches du moment :
${liste}

Écris UNE phrase d'accueil en français (25 mots max), chaleureuse et détendue.
Tu peux suggérer par quoi commencer, en privilégiant une tâche courte pour lancer la dynamique.
Ne liste pas tout. N'donne pas d'ordre, ne culpabilise pas. C'est une aide, pas un patron.`;

  try {
    const r = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 80 },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`Ollama ${r.status}`);
    const data = await r.json();
    res.json({ text: (data.response || fallback).trim() });
  } catch (e) {
    // Ollama absent / modèle non installé : on renvoie le repli, jamais d'erreur bloquante.
    res.json({ text: fallback, offline: true });
  }
});

// ─── Interface web (client compilé) ───
const dist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ToutDoux prêt : http://localhost:${PORT}`);
  console.log(`Depuis l'iPhone (même Wi-Fi) : http://IP-DU-PC:${PORT}`);
});
