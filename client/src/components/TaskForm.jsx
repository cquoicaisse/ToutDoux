// ═══ Formulaire d'ajout / modification ═══
import { T, mono } from "../theme.js";

const inp = {
  width: "100%", padding: "11px 12px", borderRadius: 12,
  border: "1px solid rgba(56,189,248,0.22)", background: "rgba(5,10,18,0.8)",
  color: "#dbeafe", fontSize: 15.5, outline: "none",
};
const btn = { padding: "12px 18px", borderRadius: 12, fontSize: 15.5, fontWeight: 600, cursor: "pointer" };

export default function TaskForm({ editing, f, setF, onSubmit, onCancel }) {
  return (
    <div style={{
      marginTop: 20, background: T.panelHi, border: `1px solid ${T.line}`,
      borderRadius: 20, padding: 16, backdropFilter: "blur(10px)",
      animation: "cardIn .3s ease both",
    }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", color: T.cyan, marginBottom: 12 }}>
        {editing ? "▸ MODIFIER LA TÂCHE" : "▸ NOUVELLE TÂCHE"}
      </div>
      <input
        autoFocus value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="Nom de la tâche" style={inp}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <select value={f.ctx} onChange={(e) => setF({ ...f, ctx: e.target.value })} style={inp}>
          <option value="chambre">⌂ Retour maison</option>
          <option value="sortie">➤ Départ</option>
        </select>
        <input
          value={f.dur}
          onChange={(e) => setF({ ...f, dur: e.target.value.replace(/\D/g, "") })}
          placeholder="Durée (min) — optionnel" inputMode="numeric" style={inp}
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 15, color: T.muted }}>
        <input
          type="checkbox" checked={f.rec}
          onChange={(e) => setF({ ...f, rec: e.target.checked })}
          style={{ width: 15, height: 15, accentColor: T.cyan }}
        />
        Tâche récurrente (revient chaque jour)
      </label>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={onSubmit} style={{ ...btn, background: T.cyan, color: "#04121d", border: "none", flex: 1, boxShadow: `0 0 20px ${T.cyanGlow}` }}>
          {editing ? "Enregistrer" : "Ajouter la tâche"}
        </button>
        <button onClick={onCancel} style={{ ...btn, background: "transparent", color: T.muted, border: `1px solid ${T.line}` }}>
          Annuler
        </button>
      </div>
    </div>
  );
}
