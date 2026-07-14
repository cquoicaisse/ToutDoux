// ═══ Carte de tâche — pas de coche : on tape, elle se dissout ═══
import { T, mono } from "../theme.js";

const iconBtn = {
  background: "transparent", border: "none", color: "#64809f",
  fontSize: 16, padding: "4px 6px", borderRadius: 10, cursor: "pointer",
};

export default function TaskCard({ t, i, dissolving, onDissolve, onEdit, onRemove }) {
  return (
    <div
      className={`task-card ${dissolving ? "task-dissolve" : ""}`}
      onClick={() => onDissolve(t.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onDissolve(t.id)}
      aria-label={`${t.name} — appuyer pour effacer`}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: T.panel, border: `1px solid ${T.line}`,
        borderLeft: `3px solid ${T.cyan}`,
        borderRadius: 16, padding: "17px 18px",
        backdropFilter: "blur(8px)", animationDelay: `${i * 0.05}s`,
        cursor: "pointer", userSelect: "none",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.name}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4, fontFamily: mono, fontSize: 12.5, color: T.muted }}>
          <span>{t.recurring ? "↻ QUOTIDIENNE" : "◆ PONCTUELLE"}</span>
          {t.duration && <span style={{ color: T.cyan }}>{t.duration} MIN</span>}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} aria-label="Modifier" style={iconBtn}>✎</button>
      <button onClick={(e) => { e.stopPropagation(); onRemove(t.id); }} aria-label="Supprimer" style={iconBtn}>✕</button>
    </div>
  );
}
