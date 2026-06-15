import { useEffect, useRef } from "react";

export function JungleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function drawLeaf(
      x: number,
      y: number,
      size: number,
      angle: number,
      alpha: number,
      color: string
    ) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(size * 0.4, -size * 0.3, size * 0.8, -size * 0.1, size, 0);
      ctx.bezierCurveTo(size * 0.8, size * 0.1, size * 0.4, size * 0.3, 0, 0);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    function drawVine(
      x: number,
      yStart: number,
      yEnd: number,
      wiggle: number,
      alpha: number
    ) {
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#2d6635";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, yStart);
      const segments = 12;
      for (let i = 1; i <= segments; i++) {
        const progress = i / segments;
        const cy = yStart + (yEnd - yStart) * progress;
        const cx = x + Math.sin(progress * Math.PI * 3 + wiggle) * 18;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.restore();
    }

    const leaves: {
      x: number; y: number; size: number; baseAngle: number;
      speed: number; phase: number; color: string; alpha: number;
    }[] = [];

    for (let i = 0; i < 30; i++) {
      const colors = [
        "rgba(45,102,53,0.5)",
        "rgba(61,128,69,0.4)",
        "rgba(82,164,91,0.3)",
        "rgba(140,198,63,0.25)",
        "rgba(30,61,35,0.6)",
      ];
      leaves.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 30 + Math.random() * 80,
        baseAngle: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.15 + Math.random() * 0.25,
      });
    }

    const vines: { x: number; phase: number; alpha: number }[] = [];
    for (let i = 0; i < 6; i++) {
      vines.push({
        x: (window.innerWidth / 5) * i + Math.random() * (window.innerWidth / 5),
        phase: Math.random() * Math.PI * 2,
        alpha: 0.1 + Math.random() * 0.15,
      });
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radial ambient light
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      );
      grad.addColorStop(0, "rgba(45,102,53,0.06)");
      grad.addColorStop(0.5, "rgba(7,19,9,0)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vines
      vines.forEach((v) => {
        drawVine(
          v.x + Math.sin(t * 0.3 + v.phase) * 8,
          0,
          canvas.height,
          t * 0.4 + v.phase,
          v.alpha
        );
      });

      // Leaves
      leaves.forEach((leaf) => {
        if (leaf.y > canvas.height * 0.68) return;

        const sway = Math.sin(t * leaf.speed + leaf.phase) * 0.3;
        drawLeaf(
          leaf.x + Math.sin(t * leaf.speed * 0.5 + leaf.phase) * 4,
          leaf.y + Math.cos(t * leaf.speed * 0.3 + leaf.phase) * 3,
          leaf.size,
          leaf.baseAngle + sway,
          leaf.alpha,
          leaf.color
        );
      });

      // Fog overlay at bottom
      const fogGrad = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
      fogGrad.addColorStop(0, "rgba(7,19,9,0)");
      fogGrad.addColorStop(1, "rgba(7,19,9,0.4)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

      t += 0.008;
      animFrame = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{ opacity: 0.22 }}
    />
  );
}
