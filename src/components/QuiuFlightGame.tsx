"use client";

import Image from "next/image";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type GameStatus = "ready" | "playing" | "gameover";

type Obstacle = {
  id: number;
  x: number;
  gapCenter: number;
  scored: boolean;
};

type GameModel = {
  status: GameStatus;
  y: number;
  velocity: number;
  score: number;
  obstacles: Obstacle[];
  spawnClock: number;
};

type GameView = Pick<
  GameModel,
  "status" | "y" | "velocity" | "score" | "obstacles"
>;

const PLAYER_X = 22;
const PLAYER_RADIUS = 4.25;
const OBSTACLE_WIDTH = 11.5;
const GAP_HEIGHT = 34;
const GRAVITY = 49;
const FLAP_VELOCITY = -18.5;
const WORLD_SPEED = 20;

function initialModel(status: GameStatus = "ready"): GameModel {
  return {
    status,
    y: 47,
    velocity: 0,
    score: 0,
    obstacles: [],
    spawnClock: 0,
  };
}

function toView(model: GameModel): GameView {
  return {
    status: model.status,
    y: model.y,
    velocity: model.velocity,
    score: model.score,
    obstacles: model.obstacles.map((obstacle) => ({ ...obstacle })),
  };
}

export default function QuiuFlightGame() {
  const modelRef = useRef<GameModel>(initialModel());
  const nextObstacleIdRef = useRef(1);
  const lastFrameRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const [view, setView] = useState<GameView>(() => toView(initialModel()));
  const [best, setBest] = useState(0);

  const publish = useCallback(() => {
    setView(toView(modelRef.current));
  }, []);

  const startGame = useCallback(() => {
    nextObstacleIdRef.current = 2;
    modelRef.current = {
      ...initialModel("playing"),
      velocity: FLAP_VELOCITY,
      obstacles: [
        {
          id: 1,
          x: 102,
          gapCenter: 48,
          scored: false,
        },
      ],
    };
    lastFrameRef.current = performance.now();
    publish();
  }, [publish]);

  const flap = useCallback(() => {
    if (modelRef.current.status !== "playing") {
      startGame();
      return;
    }

    modelRef.current.velocity = FLAP_VELOCITY;
  }, [startGame]);

  useEffect(() => {
    function finishGame() {
      const score = modelRef.current.score;
      modelRef.current.status = "gameover";
      setBest((currentBest) => Math.max(currentBest, score));
    }

    function tick(now: number) {
      const model = modelRef.current;

      if (model.status === "playing") {
        const previous = lastFrameRef.current ?? now;
        const delta = Math.min((now - previous) / 1000, 0.04);
        lastFrameRef.current = now;

        model.velocity += GRAVITY * delta;
        model.y += model.velocity * delta;
        model.spawnClock += delta;

        if (model.spawnClock >= 1.75) {
          model.spawnClock = 0;
          model.obstacles.push({
            id: nextObstacleIdRef.current++,
            x: 108,
            gapCenter: 31 + Math.random() * 38,
            scored: false,
          });
        }

        model.obstacles = model.obstacles
          .map((obstacle) => ({
            ...obstacle,
            x: obstacle.x - WORLD_SPEED * delta,
          }))
          .filter((obstacle) => obstacle.x > -OBSTACLE_WIDTH - 2);

        model.obstacles.forEach((obstacle) => {
          if (!obstacle.scored && obstacle.x + OBSTACLE_WIDTH < PLAYER_X) {
            obstacle.scored = true;
            model.score += 1;
          }
        });

        const playerTop = model.y - PLAYER_RADIUS;
        const playerBottom = model.y + PLAYER_RADIUS;
        const playerLeft = PLAYER_X - PLAYER_RADIUS;
        const playerRight = PLAYER_X + PLAYER_RADIUS;
        const hitBoundary = playerTop <= 2 || playerBottom >= 98;
        const hitObstacle = model.obstacles.some((obstacle) => {
          const overlapsHorizontally =
            playerRight > obstacle.x &&
            playerLeft < obstacle.x + OBSTACLE_WIDTH;
          const gapTop = obstacle.gapCenter - GAP_HEIGHT / 2;
          const gapBottom = obstacle.gapCenter + GAP_HEIGHT / 2;

          return overlapsHorizontally &&
            (playerTop < gapTop || playerBottom > gapBottom);
        });

        if (hitBoundary || hitObstacle) finishGame();
        publish();
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [publish]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      flap();
    }
  }

  const rotation = Math.max(-18, Math.min(36, view.velocity * 1.7));

  return (
    <div className="space-game-shell">
      <div className="mb-3 flex items-center justify-between gap-3 px-2 text-white">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
            Playable header · beta
          </p>
          <h2 className="mt-1 text-lg font-black sm:text-xl">Quiu Flight</h2>
        </div>
        <div className="flex gap-2 text-xs font-black">
          <span className="space-score-pill">Score {view.score}</span>
          <span className="space-score-pill">Best {best}</span>
        </div>
      </div>

      <div
        className="quiu-flight-game relative isolate cursor-pointer select-none overflow-hidden"
        role="application"
        tabIndex={0}
        aria-label="Quiu Flight minigame. Press Space, Arrow Up, click, or tap to fly through the portals."
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.focus();
          flap();
        }}
      >
        <div className="flight-stars" aria-hidden="true" />
        <div className="flight-orbit flight-orbit--one" aria-hidden="true" />
        <div className="flight-orbit flight-orbit--two" aria-hidden="true" />
        <div className="flight-moon" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        {view.obstacles.map((obstacle) => {
          const gapTop = obstacle.gapCenter - GAP_HEIGHT / 2;
          const gapBottom = obstacle.gapCenter + GAP_HEIGHT / 2;

          return (
            <div
              key={obstacle.id}
              className="flight-obstacle"
              style={{ left: `${obstacle.x}%`, width: `${OBSTACLE_WIDTH}%` }}
              aria-hidden="true"
            >
              <span className="flight-obstacle-top" style={{ height: `${gapTop}%` }} />
              <span
                className="flight-obstacle-bottom"
                style={{ top: `${gapBottom}%`, height: `${100 - gapBottom}%` }}
              />
            </div>
          );
        })}

        <div
          className="flight-player"
          style={{
            left: `${PLAYER_X}%`,
            top: `${view.y}%`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
          aria-hidden="true"
        >
          <Image src="/press-q-icon.png" alt="" width={624} height={667} priority />
        </div>

        {view.status !== "playing" ? (
          <div className="flight-overlay">
            <div className="flight-overlay-card">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c6d1ff]">
                {view.status === "ready" ? "Ready player Q?" : `Final score · ${view.score}`}
              </p>
              <p className="mt-2 text-xl font-black text-white sm:text-2xl">
                {view.status === "ready" ? "Tap to launch Quiu" : "Fly again?"}
              </p>
              <p className="mt-2 text-xs font-bold leading-relaxed text-white/65 sm:text-sm">
                Click, tap, Space, or ↑ to flap.
              </p>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#111638]/55 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/65 backdrop-blur-md sm:text-[10px]">
          Avoid the portals · keep exploring
        </div>
      </div>
    </div>
  );
}
