"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

const COLORS = ["#6f7fff", "#65e4f2", "#ff6fae"];

export default function PressQTubesBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasElement = canvas;
    const host = canvas.parentElement;
    if (!host) return;
    const hostElement = host;

    const context = canvasElement.getContext("2d");
    if (!context) return;
    const drawingContext = context;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const pointer = { x: 0.72, y: 0.34, active: false };
    const trails: Point[][] = [[], [], []];
    let frame = 0;
    let animationId = 0;
    let width = 1;
    let height = 1;

    function resize() {
      const rect = hostElement.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvasElement.width = Math.round(width * ratio);
      canvasElement.height = Math.round(height * ratio);
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;
      drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      trails.forEach((trail) => trail.splice(0));
    }

    function onPointerMove(event: PointerEvent) {
      const rect = hostElement.getBoundingClientRect();
      pointer.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointer.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      pointer.active = true;
    }

    function drawTrail(points: Point[], color: string, index: number) {
      if (points.length < 3) return;
      const gradient = drawingContext.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `${color}00`);
      gradient.addColorStop(0.42, `${color}9f`);
      gradient.addColorStop(1, `${color}08`);

      drawingContext.beginPath();
      drawingContext.moveTo(points[0].x, points[0].y);
      for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
        const point = points[pointIndex];
        const next = points[pointIndex + 1];
        drawingContext.quadraticCurveTo(
          point.x,
          point.y,
          (point.x + next.x) / 2,
          (point.y + next.y) / 2,
        );
      }
      drawingContext.strokeStyle = gradient;
      drawingContext.lineWidth = 3.5 - index * 0.45;
      drawingContext.lineCap = "round";
      drawingContext.shadowBlur = 24;
      drawingContext.shadowColor = color;
      drawingContext.stroke();
      drawingContext.shadowBlur = 0;
    }

    function draw() {
      frame += reducedMotion ? 0 : 1;
      drawingContext.clearRect(0, 0, width, height);

      trails.forEach((trail, index) => {
        const phase = index * 2.15;
        const targetX = pointer.active
          ? pointer.x * width
          : width * (0.72 + Math.sin(frame * 0.006 + phase) * 0.1);
        const targetY = pointer.active
          ? pointer.y * height
          : height * (0.34 + Math.cos(frame * 0.004 + phase) * 0.13);
        const head = trail.at(-1) || {
          x: -80 - index * 70,
          y: height * (0.28 + index * 0.2),
        };
        const wobbleX = Math.sin(frame * 0.018 + phase) * (22 + index * 8);
        const wobbleY = Math.cos(frame * 0.014 + phase) * (28 + index * 9);
        const next = {
          x: head.x + (targetX + wobbleX - head.x) * (0.018 + index * 0.003),
          y: head.y + (targetY + wobbleY - head.y) * (0.018 + index * 0.002),
        };
        trail.push(next);
        if (trail.length > 105) trail.shift();
        drawTrail(trail, COLORS[index], index);
      });

      if (!reducedMotion) animationId = requestAnimationFrame(draw);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(hostElement);
    hostElement.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      hostElement.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pressq-tubes-canvas pointer-events-none absolute inset-0 z-[1] h-full w-full"
      aria-hidden="true"
    />
  );
}
