// ═══ Fond radar animé — grille + ligne de balayage (canvas 2D léger) ═══
import { useEffect, useRef } from "react";

export default function RadarBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    let raf, t = 0;
    const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
    resize();
    addEventListener("resize", resize);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(56,189,248,0.05)";
      ctx.lineWidth = 1;
      const g = 48;
      for (let x = 0; x < w; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      if (!reduced) {
        const sy = (t * 0.6) % (h + 200) - 100;
        const grad = ctx.createLinearGradient(0, sy - 80, 0, sy);
        grad.addColorStop(0, "rgba(56,189,248,0)");
        grad.addColorStop(1, "rgba(56,189,248,0.07)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, sy - 80, w, 80);
        ctx.fillStyle = "rgba(56,189,248,0.18)";
        ctx.fillRect(0, sy, w, 1.5);
        t++;
        raf = requestAnimationFrame(draw);
      }
    };
    draw();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.9 }} />;
}
