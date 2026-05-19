"use client";

import { useEffect, useRef } from "react";

export default function PrismHeroScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0.72, y: 0.42 });

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const canvasContext = canvasElement.getContext("2d");
    if (!canvasContext) return;

    const canvasEl: HTMLCanvasElement = canvasElement;
    const ctx: CanvasRenderingContext2D = canvasContext;

    let frame = 0;
    let animationFrame = 0;

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvasEl.getBoundingClientRect();

      canvasEl.width = Math.floor(rect.width * ratio);
      canvasEl.height = Math.floor(rect.height * ratio);

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function drawBeam(
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      color: string,
      width: number,
      alpha: number
    ) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }

    function drawPrism(centerX: number, centerY: number, size: number) {
      const top = { x: centerX, y: centerY - size * 0.92 };
      const left = { x: centerX - size * 0.9, y: centerY + size * 0.56 };
      const right = { x: centerX + size * 0.92, y: centerY + size * 0.48 };
      const bottom = { x: centerX - size * 0.05, y: centerY + size * 1.08 };

      const metal = ctx.createLinearGradient(left.x, top.y, right.x, bottom.y);
      metal.addColorStop(0, "#07080d");
      metal.addColorStop(0.34, "#252938");
      metal.addColorStop(0.58, "#06070a");
      metal.addColorStop(1, "#363a48");

      ctx.save();
      ctx.shadowColor = "rgba(34, 211, 238, 0.32)";
      ctx.shadowBlur = 46;

      ctx.fillStyle = metal;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(right.x, right.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.lineTo(left.x, left.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(centerX - size * 0.1, centerY + size * 0.05);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.moveTo(centerX - size * 0.1, centerY + size * 0.05);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
      drawBeam(centerX - size * 0.1, centerY - size * 0.04, centerX + size * 0.74, centerY - size * 0.4, "#ff5cf4", 5, 0.8);
      drawBeam(centerX - size * 0.05, centerY + size * 0.28, centerX + size * 0.7, centerY + size * 0.5, "#ff7a3d", 5, 0.65);
      drawBeam(centerX - size * 0.45, centerY + size * 0.05, centerX + size * 0.1, centerY - size * 0.24, "#77f7ff", 3, 0.55);

      ctx.restore();
    }

    function draw() {
      const width = canvasEl.clientWidth;
      const height = canvasEl.clientHeight;
      const time = frame * 0.016;
      const pointer = pointerRef.current;

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(
        width * pointer.x,
        height * pointer.y,
        0,
        width * 0.58,
        height * 0.45,
        Math.max(width, height) * 0.85
      );
      bg.addColorStop(0, "rgba(34, 211, 238, 0.16)");
      bg.addColorStop(0.28, "rgba(217, 70, 239, 0.08)");
      bg.addColorStop(0.62, "rgba(6, 8, 14, 0.95)");
      bg.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      for (let x = -80; x < width + 80; x += 84) {
        ctx.beginPath();
        ctx.moveTo(x + Math.sin(time) * 4, 0);
        ctx.lineTo(x - height * 0.14, height);
        ctx.stroke();
      }
      ctx.restore();

      const prismX = width * (0.54 + (pointer.x - 0.5) * 0.05);
      const prismY = height * (0.52 + (pointer.y - 0.5) * 0.05);
      const prismSize = Math.min(width, height) * 0.14;

      drawBeam(-80, prismY - 30, prismX - prismSize * 0.62, prismY - 6, "#dce8ff", 2.5, 0.6);
      drawBeam(-120, prismY - 32, prismX - prismSize * 0.58, prismY - 8, "#ffffff", 6, 0.2);

      const colors = ["#ff2df7", "#ff5c8a", "#ff9e42", "#fff16b", "#6dff9d", "#38e7ff", "#8b5cf6"];
      colors.forEach((color, index) => {
        const offset = (index - 3) * 18 + Math.sin(time + index) * 4;
        drawBeam(
          prismX + prismSize * 0.46,
          prismY + offset * 0.1,
          width + 160,
          prismY - 120 + offset,
          color,
          14,
          0.42
        );
      });

      drawPrism(prismX, prismY, prismSize);

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const flare = ctx.createRadialGradient(
        prismX - prismSize * 0.84,
        prismY - 8,
        0,
        prismX - prismSize * 0.84,
        prismY - 8,
        prismSize * 1.6
      );
      flare.addColorStop(0, "rgba(255, 255, 255, 0.65)");
      flare.addColorStop(0.24, "rgba(34, 211, 238, 0.24)");
      flare.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = flare;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      frame += 1;
      animationFrame = window.requestAnimationFrame(draw);
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = canvasEl.getBoundingClientRect();
      pointerRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    canvasEl.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvasEl.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

