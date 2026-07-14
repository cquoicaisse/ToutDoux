// ═══ Séquence de boot — le petit moment cinéma au lancement ═══
import { useEffect, useState } from "react";
import { T, mono } from "../theme.js";

const SEQ = [
  "▸ Liaison NFC ........... OK",
  "▸ Chargement des tâches . OK",
  "▸ Interface ............. PRÊTE",
];

export default function BootScreen({ onDone }) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { onDone(); return; }
    const timers = SEQ.map((l, i) =>
      setTimeout(() => setLines((p) => [...p, l]), 280 * (i + 1))
    );
    const end = setTimeout(onDone, 280 * SEQ.length + 700);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); };
  }, [onDone]);

  return (
    <div onClick={onDone} style={{
      position: "fixed", inset: 0, zIndex: 50, background: T.bg,
      display: "grid", placeItems: "center", cursor: "pointer",
      animation: `bootFade 0.4s ease ${0.28 * 3 + 0.45}s forwards`,
    }}>
      <div>
        <div style={{
          fontFamily: mono, fontSize: 13, letterSpacing: "0.35em", color: T.cyan,
          textShadow: `0 0 18px ${T.cyanGlow}`, marginBottom: 18, textAlign: "center",
        }}>
          T O U T D O U X
        </div>
        <div style={{ fontFamily: mono, fontSize: 12, color: T.muted, lineHeight: 2 }}>
          {lines.map((l, i) => <div key={i} style={{ animation: "lineIn .25s ease both" }}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
