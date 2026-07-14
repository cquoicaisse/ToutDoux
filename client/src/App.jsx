// ═══════════════════════════════════════════════════════════
//  ToutDoux — interface principale
//  Philosophie : les tâches existent, elles ne s'imposent pas.
//  Pas de coche, pas de score : ce dont on s'est occupé se
//  dissout. Le cœur liquide s'apaise, c'est le seul témoin.
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { T, mono, sans } from "./theme.js";
import { fetchTasks, createTask, updateTask, deleteTask, fetchGreeting } from "./api.js";
import LiquidCore from "./components/LiquidCore.jsx";
import RadarBackground from "./components/RadarBackground.jsx";
import BootScreen from "./components/BootScreen.jsx";
import TaskCard from "./components/TaskCard.jsx";
import TaskForm from "./components/TaskForm.jsx";

const EMPTY_FORM = { name: "", ctx: "chambre", rec: false, dur: "" };

export default function App() {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState("chambre");
  const [booted, setBooted] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState(EMPTY_FORM);
  const [clock, setClock] = useState(new Date());
  const [dissolvingId, setDissolvingId] = useState(null);
  const [undoTask, setUndoTask] = useState(null);
  const undoTimer = useRef(null);
  const [greeting, setGreeting] = useState(null);

  // Horloge HUD
  useEffect(() => {
    const i = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // ?vue=chambre|sortie — le tag NFC choisit le contexte
  useEffect(() => {
    const v = new URLSearchParams(location.search).get("vue");
    if (v === "chambre" || v === "sortie") setView(v);
  }, []);

  // Chargement initial (la remise à zéro quotidienne est gérée côté serveur)
  const reload = useCallback(async () => {
    try {
      setTasks(await fetchTasks());
      setError(false);
    } catch {
      setError(true);
      setTasks([]);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  // Message d'accueil généré localement par Ollama (repli silencieux si absent)
  useEffect(() => {
    let alive = true;
    setGreeting(null);
    fetchGreeting(view)
      .then((r) => { if (alive) setGreeting(r.text); })
      .catch(() => {});
    return () => { alive = false; };
  }, [view]);

  const changeView = (v) => {
    if (v === view) return;
    setSwitching(true);
    setTimeout(() => { setView(v); setSwitching(false); }, 180);
  };

  // ═══ Dissolution : la tâche s'efface, sans coche ni score ═══
  const dissolve = (id) => {
    if (dissolvingId) return;
    setDissolvingId(id);
    setTimeout(async () => {
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: true } : t)));
      setDissolvingId(null);
      setUndoTask(id);
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndoTask(null), 5000);
      try { await updateTask(id, { done: true }); } catch { reload(); }
    }, 480);
  };

  const undo = async () => {
    const id = undoTask;
    setUndoTask(null);
    clearTimeout(undoTimer.current);
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: false } : t)));
    try { await updateTask(id, { done: false }); } catch { reload(); }
  };

  const remove = async (id) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    try { await deleteTask(id); } catch { reload(); }
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setF({ name: t.name, ctx: t.ctx, rec: t.recurring, dur: t.duration ?? "" });
    setFormOpen(true);
  };
  const openNew = () => {
    setEditId(null);
    setF({ ...EMPTY_FORM, ctx: view });
    setFormOpen(true);
  };

  const submit = async () => {
    if (!f.name.trim()) return;
    const duration = f.dur === "" ? null : Math.max(1, parseInt(f.dur, 10) || 1);
    const payload = { name: f.name.trim(), ctx: f.ctx, recurring: f.rec, duration };
    setFormOpen(false);
    try {
      if (editId) {
        const upd = await updateTask(editId, payload);
        setTasks((p) => p.map((t) => (t.id === editId ? upd : t)));
      } else {
        const created = await createTask(payload);
        setTasks((p) => [...p, created]);
      }
    } catch { reload(); }
  };

  if (!tasks) return <div style={{ minHeight: "100vh", background: T.bg }} />;

  const shown = tasks.filter((t) => t.ctx === view);
  const todo = shown.filter((t) => !t.done);
  const doneCount = shown.length - todo.length;
  const totalMin = todo.filter((t) => t.duration).reduce((s, t) => s + t.duration, 0);
  const unest = todo.filter((t) => !t.duration).length;

  const dateStr = clock.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = clock.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: sans, position: "relative", overflow: "hidden", display: "flex" }}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        input, select { font-family: inherit; }
        @keyframes bootFade { to { opacity: 0; visibility: hidden; } }
        @keyframes lineIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes dissolveOut {
          0%   { opacity: 1; transform: none; filter: blur(0); }
          35%  { border-color: rgba(52,211,153,0.7); box-shadow: 0 0 26px rgba(52,211,153,0.25); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.96); filter: blur(6px); }
        }
        .task-dissolve { animation: dissolveOut .5s cubic-bezier(.4,0,.7,1) forwards !important; pointer-events: none; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .task-card { animation: cardIn .45s cubic-bezier(.22,1,.36,1) both; transition: border-color .2s, transform .2s, box-shadow .2s; }
        .task-card:hover { border-color: ${T.lineHi}; transform: translateY(-1px); box-shadow: 0 4px 24px rgba(56,189,248,0.08); }
        .view-wrap { transition: opacity .18s ease, transform .18s ease; }
        .view-out { opacity: 0; transform: translateX(-12px); }
        .hud-btn { transition: all .2s; }
        .hud-btn:hover { border-color: ${T.lineHi} !important; }
        @media (prefers-reduced-motion: reduce) { *, .task-card, .view-wrap { animation: none !important; transition: none !important; } }
      `}</style>

      {!booted && <BootScreen onDone={() => setBooted(true)} />}
      <RadarBackground />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 760, margin: "auto", padding: "40px 24px" }}>

        {/* ═══ Cœur liquide — s'apaise quand la journée se vide ═══ */}
        <div style={{ paddingTop: 18 }}>
          <LiquidCore activity={shown.length ? todo.length / shown.length : 0} />
        </div>

        {/* ═══ En-tête HUD ═══ */}
        <header style={{ padding: "10px 4px 16px" }}>
          <div style={{ fontFamily: mono, fontSize: 13, letterSpacing: "0.2em", color: T.cyan, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.cyan, boxShadow: `0 0 8px ${T.cyan}`, animation: "pulse 2.4s infinite" }} />
            {dateStr}
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 700, letterSpacing: "-0.01em", textShadow: `0 0 30px ${T.cyanGlow}` }}>
            {view === "chambre" ? "De retour à la maison" : "Avant de sortir"}
          </h1>
          <div style={{ fontFamily: mono, fontSize: 14, color: T.muted, marginTop: 7 }}>
            {timeStr}
            {todo.length > 0 && (
              <>
                {"  ·  "}
                {totalMin > 0 && `≈ ${totalMin} min estimées`}
                {totalMin > 0 && unest > 0 && " · "}
                {unest > 0 && `${unest} sans estimation`}
              </>
            )}
          </div>
        </header>

        {error && (
          <div style={{ fontFamily: mono, fontSize: 12, color: "#fca5a5", border: "1px solid rgba(252,165,165,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
            Serveur injoignable — vérifier que ToutDoux tourne, puis recharger.
          </div>
        )}

        {/* ═══ Mot d'accueil de l'IA locale ═══ */}
        {greeting && (
          <div style={{
            display: "flex", gap: 11, alignItems: "flex-start",
            background: "rgba(139,124,246,0.07)", border: `1px solid rgba(139,124,246,0.25)`,
            borderRadius: 14, padding: "12px 15px", marginBottom: 18,
            backdropFilter: "blur(8px)", animation: "cardIn .5s ease both",
          }}>
            <span style={{ color: T.violet, fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", flexShrink: 0, marginTop: 2 }}>◇</span>
            <span style={{ fontSize: 15.5, color: T.text, lineHeight: 1.55, fontStyle: "italic" }}>{greeting}</span>
          </div>
        )}

        {/* ═══ Sélecteur de contexte ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { k: "chambre", label: "RETOUR MAISON", icon: "⌂" },
            { k: "sortie", label: "DÉPART", icon: "➤" },
          ].map((v) => (
            <button key={v.k} onClick={() => changeView(v.k)} className="hud-btn" style={{
              padding: "13px 10px", borderRadius: 999,
              border: `1px solid ${view === v.k ? T.lineHi : T.line}`,
              background: view === v.k ? "rgba(56,189,248,0.10)" : T.panel,
              color: view === v.k ? T.cyan : T.muted,
              fontFamily: mono, fontSize: 13.5, letterSpacing: "0.14em", fontWeight: 600,
              boxShadow: view === v.k ? `0 0 18px ${T.cyanGlow}, inset 0 0 18px rgba(56,189,248,0.06)` : "none",
              backdropFilter: "blur(8px)",
            }}>
              {v.icon}  {v.label}
            </button>
          ))}
        </div>

        {/* ═══ Liste ═══ */}
        <div className={`view-wrap ${switching ? "view-out" : ""}`}>
          {todo.length === 0 && (
            <div style={{ textAlign: "center", color: T.muted, padding: "56px 0", fontFamily: mono, fontSize: 15, lineHeight: 2 }}>
              {doneCount > 0 ? (
                <>TOUT EST CALME<br /><span style={{ opacity: 0.6, fontSize: 13 }}>le reste de la journée t'appartient</span></>
              ) : (
                "— AUCUNE TÂCHE DANS CE CONTEXTE —"
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {todo.map((t, i) => (
              <TaskCard key={t.id} t={t} i={i} dissolving={dissolvingId === t.id}
                onDissolve={dissolve} onEdit={openEdit} onRemove={remove} />
            ))}
          </div>
        </div>

        {/* ═══ Formulaire / bouton d'ajout ═══ */}
        {formOpen ? (
          <TaskForm editing={!!editId} f={f} setF={setF} onSubmit={submit} onCancel={() => setFormOpen(false)} />
        ) : (
          <button onClick={openNew} className="hud-btn" style={{
            marginTop: 20, width: "100%", background: T.panel, color: T.cyan,
            border: `1px dashed ${T.line}`, padding: 13, fontFamily: mono,
            fontSize: 13.5, letterSpacing: "0.14em", fontWeight: 600,
            borderRadius: 12, backdropFilter: "blur(8px)",
          }}>
            + AJOUTER UNE TÂCHE
          </button>
        )}
      </div>

      {/* ═══ Annulation discrète ═══ */}
      {undoTask && (
        <div style={{
          position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)",
          zIndex: 10, display: "flex", alignItems: "center", gap: 14,
          background: T.panelHi, border: `1px solid ${T.line}`, borderRadius: 999,
          padding: "9px 18px", backdropFilter: "blur(10px)",
          fontFamily: mono, fontSize: 12, color: T.muted,
          animation: "cardIn .3s ease both",
        }}>
          <span>Tâche effacée</span>
          <button onClick={undo} style={{
            background: "transparent", border: "none", color: T.cyan,
            fontFamily: mono, fontSize: 12, letterSpacing: "0.08em", padding: 0,
          }}>
            ANNULER
          </button>
        </div>
      )}
    </div>
  );
}
