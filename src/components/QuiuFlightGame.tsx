"use client";

import Image from "next/image";
import type { FormEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type GameStatus = "ready" | "playing" | "gameover";
type ObstacleKind =
  | "censorship"
  | "harassment"
  | "erasure"
  | "misinformation"
  | "exclusion";

type Obstacle = {
  id: number;
  x: number;
  kind: ObstacleKind;
  hit: boolean;
  scored: boolean;
  destroyed: boolean;
};

type RainbowHeart = {
  id: number;
  x: number;
  y: number;
};

type SkyRainbow = {
  id: number;
  x: number;
  y: number;
};

type LeaderboardEntry = {
  name: string;
  score: number;
};

type JumpSparkle = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  size: number;
  glyph: "✦" | "•";
};

type GameModel = {
  status: GameStatus;
  playerX: number;
  height: number;
  velocity: number;
  lives: number;
  ammo: number;
  jumpsLeft: number;
  distance: number;
  obstacles: Obstacle[];
  projectiles: RainbowHeart[];
  rainbows: SkyRainbow[];
  sparkles: JumpSparkle[];
  spawnClock: number;
  nextSpawn: number;
  rainbowClock: number;
  nextRainbow: number;
  invulnerable: number;
};

type GameView = Omit<
  GameModel,
  "spawnClock" | "nextSpawn" | "rainbowClock" | "nextRainbow"
>;

const PLAYER_X = 18;
const PLAYER_WIDTH = 9;
const GROUND_OFFSET = 10;
const GRAVITY = 86;
const JUMP_VELOCITY = 62;
const BASE_SPEED = 23;

const OBSTACLE_DETAILS: Record<
  ObstacleKind,
  { label: string; symbol: string; width: number; height: number }
> = {
  censorship: { label: "Censorship", symbol: "▰", width: 10.5, height: 15 },
  harassment: { label: "Harassment", symbol: "!", width: 9, height: 18 },
  erasure: { label: "Erasure", symbol: "⌫", width: 10, height: 14 },
  misinformation: { label: "Misinformation", symbol: "?", width: 9.5, height: 17 },
  exclusion: { label: "Exclusion", symbol: "×", width: 9, height: 16 },
};

const OBSTACLE_KINDS = Object.keys(OBSTACLE_DETAILS) as ObstacleKind[];

function initialModel(status: GameStatus = "ready"): GameModel {
  return {
    status,
    playerX: PLAYER_X,
    height: 0,
    velocity: 0,
    lives: 3,
    ammo: 4,
    jumpsLeft: 2,
    distance: 0,
    obstacles: [],
    projectiles: [],
    rainbows: [],
    sparkles: [],
    spawnClock: 0,
    nextSpawn: 1.5,
    rainbowClock: 0,
    nextRainbow: 2.8,
    invulnerable: 0,
  };
}

function toView(model: GameModel): GameView {
  return {
    status: model.status,
    playerX: model.playerX,
    height: model.height,
    velocity: model.velocity,
    lives: model.lives,
    ammo: model.ammo,
    jumpsLeft: model.jumpsLeft,
    distance: model.distance,
    invulnerable: model.invulnerable,
    obstacles: model.obstacles.map((obstacle) => ({ ...obstacle })),
    projectiles: model.projectiles.map((projectile) => ({ ...projectile })),
    rainbows: model.rainbows.map((rainbow) => ({ ...rainbow })),
    sparkles: model.sparkles.map((sparkle) => ({ ...sparkle })),
  };
}

export default function QuiuFlightGame() {
  const modelRef = useRef<GameModel>(initialModel());
  const nextObstacleIdRef = useRef(1);
  const nextSparkleIdRef = useRef(1);
  const nextProjectileIdRef = useRef(1);
  const nextRainbowIdRef = useRef(1);
  const movementRef = useRef({ left: false, right: false });
  const lastFrameRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const [view, setView] = useState<GameView>(() => toView(initialModel()));
  const [best, setBest] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  const publish = useCallback(() => {
    setView(toView(modelRef.current));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("press-q-runner-leaderboard");
        if (!stored) return;

        const entries = JSON.parse(stored) as LeaderboardEntry[];
        const validEntries = entries
          .filter(
            (entry) =>
              typeof entry.name === "string" &&
              typeof entry.score === "number" &&
              Number.isFinite(entry.score),
          )
          .slice(0, 5);

        setLeaderboard(validEntries);
        setBest(validEntries[0]?.score ?? 0);
      } catch {
        window.localStorage.removeItem("press-q-runner-leaderboard");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const addJumpSparkles = useCallback(() => {
    const model = modelRef.current;
    const newSparkles = Array.from({ length: 11 }, (_, index): JumpSparkle => ({
      id: nextSparkleIdRef.current++,
      x: model.playerX + 1 + Math.random() * 5,
      y: model.height + 3 + Math.random() * 7,
      dx: -5 - Math.random() * 9,
      dy: 3 + Math.random() * 11,
      life: 0.45 + Math.random() * 0.35,
      size: 8 + Math.random() * 12,
      glyph: index % 3 === 0 ? "✦" : "•",
    }));

    model.sparkles.push(...newSparkles);
  }, []);

  const startGame = useCallback(() => {
    nextObstacleIdRef.current = 2;
    nextProjectileIdRef.current = 1;
    nextRainbowIdRef.current = 2;
    movementRef.current = { left: false, right: false };
    setScoreSaved(false);
    modelRef.current = {
      ...initialModel("playing"),
      velocity: JUMP_VELOCITY,
      jumpsLeft: 1,
      obstacles: [
        {
          id: 1,
          x: 101,
          kind: "censorship",
          hit: false,
          scored: false,
          destroyed: false,
        },
      ],
      rainbows: [
        {
          id: 1,
          x: 68,
          y: 23,
        },
      ],
    };
    addJumpSparkles();
    lastFrameRef.current = performance.now();
    publish();
  }, [addJumpSparkles, publish]);

  const jump = useCallback(() => {
    const model = modelRef.current;

    if (model.status !== "playing") {
      startGame();
      return;
    }

    if (model.jumpsLeft > 0) {
      model.velocity = JUMP_VELOCITY;
      model.jumpsLeft -= 1;
      addJumpSparkles();
    }
  }, [addJumpSparkles, startGame]);

  useEffect(() => {
    function handlePageSpace(event: globalThis.KeyboardEvent) {
      if (event.code !== "Space" || event.repeat) return;

      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, [contenteditable='true']",
        )
      ) {
        return;
      }

      event.preventDefault();
      jump();
    }

    window.addEventListener("keydown", handlePageSpace, { capture: true });
    return () => {
      window.removeEventListener("keydown", handlePageSpace, { capture: true });
    };
  }, [jump]);

  const fireRainbowHeart = useCallback(() => {
    const model = modelRef.current;

    if (model.status !== "playing" || model.ammo <= 0) return;

    model.ammo -= 1;
    model.projectiles.push({
      id: nextProjectileIdRef.current++,
      x: model.playerX + 4,
      y: Math.min(14, model.height + 7),
    });
    publish();
  }, [publish]);

  function saveScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    const name = playerName.trim().slice(0, 18);
    if (!name || modelRef.current.status !== "gameover") return;

    const score = Math.floor(modelRef.current.distance);
    const otherPlayers = leaderboard.filter(
      (entry) => entry.name.toLocaleLowerCase() !== name.toLocaleLowerCase(),
    );
    const previousScore = leaderboard.find(
      (entry) => entry.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )?.score;
    const nextLeaderboard = [
      ...otherPlayers,
      { name, score: Math.max(score, previousScore ?? 0) },
    ]
      .sort((first, second) => second.score - first.score)
      .slice(0, 5);

    setLeaderboard(nextLeaderboard);
    setBest(nextLeaderboard[0]?.score ?? score);
    setPlayerName(name);
    setScoreSaved(true);
    window.localStorage.setItem(
      "press-q-runner-leaderboard",
      JSON.stringify(nextLeaderboard),
    );
  }

  useEffect(() => {
    function finishGame() {
      const finalDistance = Math.floor(modelRef.current.distance);
      modelRef.current.status = "gameover";
      movementRef.current = { left: false, right: false };
      setBest((currentBest) => Math.max(currentBest, finalDistance));
    }

    function tick(now: number) {
      const model = modelRef.current;

      if (model.status === "playing") {
        const previous = lastFrameRef.current ?? now;
        const delta = Math.min((now - previous) / 1000, 0.04);
        lastFrameRef.current = now;
        const level = 1 + Math.floor(model.distance / 50);
        const worldSpeed = BASE_SPEED + Math.min(25, (level - 1) * 4.2);
        const horizontalDirection =
          Number(movementRef.current.right) - Number(movementRef.current.left);

        model.playerX = Math.max(
          10,
          Math.min(44, model.playerX + horizontalDirection * 34 * delta),
        );

        model.velocity -= GRAVITY * delta;
        model.height += model.velocity * delta;

        if (model.height <= 0) {
          model.height = 0;
          model.velocity = 0;
          model.jumpsLeft = 2;
        }

        model.distance += worldSpeed * delta * 0.42;
        model.spawnClock += delta;
        model.rainbowClock += delta;
        model.invulnerable = Math.max(0, model.invulnerable - delta);

        if (model.spawnClock >= model.nextSpawn) {
          const kind = OBSTACLE_KINDS[
            Math.floor(Math.random() * OBSTACLE_KINDS.length)
          ];
          model.spawnClock = 0;
          model.nextSpawn = Math.max(
            0.95,
            1.05 + Math.random() * 1.55 - (level - 1) * 0.035,
          );
          model.obstacles.push({
            id: nextObstacleIdRef.current++,
            x: 108,
            kind,
            hit: false,
            scored: false,
            destroyed: false,
          });
        }

        if (model.rainbowClock >= model.nextRainbow) {
          model.rainbowClock = 0;
          model.nextRainbow = 1.8 + Math.random() * 1.2;
          model.rainbows.push({
            id: nextRainbowIdRef.current++,
            x: 108,
            y: 18 + Math.random() * 12,
          });
        }

        model.obstacles = model.obstacles
          .map((obstacle) => ({
            ...obstacle,
            x: obstacle.x - worldSpeed * delta,
          }))
          .filter((obstacle) => obstacle.x > -16);

        model.rainbows = model.rainbows
          .map((rainbow) => ({
            ...rainbow,
            x: rainbow.x - worldSpeed * delta,
          }))
          .filter((rainbow) => rainbow.x > -10);

        model.projectiles = model.projectiles
          .map((projectile) => ({
            ...projectile,
            x: projectile.x + 58 * delta,
          }))
          .filter((projectile) => projectile.x < 112);

        model.sparkles = model.sparkles
          .map((sparkle) => ({
            ...sparkle,
            x: sparkle.x + sparkle.dx * delta,
            y: sparkle.y + sparkle.dy * delta,
            dy: sparkle.dy - 28 * delta,
            life: sparkle.life - delta,
          }))
          .filter((sparkle) => sparkle.life > 0);

        model.rainbows = model.rainbows.filter((rainbow) => {
          const touchesHorizontally = Math.abs(rainbow.x - model.playerX) < 7;
          const touchesVertically = Math.abs(rainbow.y - (model.height + 7)) < 9;

          if (touchesHorizontally && touchesVertically && model.ammo < 5) {
            model.ammo += 1;

            for (let index = 0; index < 12; index += 1) {
              model.sparkles.push({
                id: nextSparkleIdRef.current++,
                x: rainbow.x,
                y: rainbow.y,
                dx: -10 + Math.random() * 20,
                dy: 4 + Math.random() * 14,
                life: 0.45 + Math.random() * 0.4,
                size: 8 + Math.random() * 13,
                glyph: index % 3 === 0 ? "✦" : "•",
              });
            }

            return false;
          }

          return true;
        });

        const spentProjectiles = new Set<number>();

        for (const projectile of model.projectiles) {
          const target = model.obstacles.find((obstacle) => {
            if (obstacle.destroyed) return false;
            const details = OBSTACLE_DETAILS[obstacle.kind];
            return projectile.x + 2.5 >= obstacle.x && projectile.x <= obstacle.x + details.width;
          });

          if (target) {
            target.destroyed = true;
            spentProjectiles.add(projectile.id);

            for (let index = 0; index < 15; index += 1) {
              model.sparkles.push({
                id: nextSparkleIdRef.current++,
                x: target.x + 4,
                y: 7 + Math.random() * 12,
                dx: -12 + Math.random() * 24,
                dy: 4 + Math.random() * 16,
                life: 0.5 + Math.random() * 0.45,
                size: 8 + Math.random() * 15,
                glyph: index % 4 === 0 ? "✦" : "•",
              });
            }
          }
        }

        model.projectiles = model.projectiles.filter(
          (projectile) => !spentProjectiles.has(projectile.id),
        );

        for (const obstacle of model.obstacles) {
          const details = OBSTACLE_DETAILS[obstacle.kind];
          const overlapsHorizontally =
            model.playerX + PLAYER_WIDTH * 0.42 > obstacle.x &&
            model.playerX - PLAYER_WIDTH * 0.42 < obstacle.x + details.width;
          const isLowEnoughToHit = model.height < details.height - 5;

          if (
            overlapsHorizontally &&
            isLowEnoughToHit &&
            !obstacle.hit &&
            !obstacle.destroyed &&
            model.invulnerable <= 0
          ) {
            obstacle.hit = true;
            model.lives -= 1;
            model.invulnerable = 1.25;
            model.velocity = 25;
            model.height = Math.max(model.height, 3);

            if (model.lives <= 0) {
              finishGame();
              break;
            }
          }

          if (!obstacle.scored && obstacle.x + details.width < model.playerX) {
            obstacle.scored = true;
          }
        }

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
    if ((event.target as HTMLElement).closest("input, textarea, select, button")) {
      return;
    }

    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      movementRef.current.left = true;
    }

    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      movementRef.current.right = true;
    }

    if (
      (event.code === "Space" || event.code === "ArrowUp") &&
      !event.repeat &&
      !event.defaultPrevented
    ) {
      event.preventDefault();
      jump();
    }

    if ((event.code === "KeyX" || event.code === "KeyF") && !event.repeat) {
      event.preventDefault();
      fireRainbowHeart();
    }
  }

  function handleKeyUp(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("input, textarea, select, button")) {
      return;
    }

    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      movementRef.current.left = false;
    }

    if (event.code === "ArrowRight" || event.code === "KeyD") {
      movementRef.current.right = false;
    }
  }

  const distance = Math.floor(view.distance);
  const level = 1 + Math.floor(view.distance / 50);
  const tilt = view.height > 0 ? Math.max(-9, Math.min(11, view.velocity * 0.32)) : 0;

  return (
    <div className="space-game-shell quiu-runner-shell">
      <div className="quiu-runner-heading">
        <div>
          <h2>Quiu Run</h2>
        </div>

        <div className="quiu-runner-stats" aria-label={`${view.lives} lives and ${view.ammo} rainbow hearts remaining`}>
          <span className="quiu-runner-lives" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <span key={index} className={index < view.lives ? "is-active" : ""}>♥</span>
            ))}
          </span>
          <span className="runner-ammo-pill" aria-label={`${view.ammo} rainbow heart shots`}>
            <span aria-hidden="true">♥</span> {view.ammo}
          </span>
          <span className="space-score-pill runner-level-pill">Level {level}</span>
          <span className="space-score-pill">Distance {distance}</span>
          <span className="space-score-pill">Best {best}</span>
        </div>
      </div>

      <div
        className="quiu-runner-game"
        role="application"
        tabIndex={0}
        aria-label="Quiu Run minigame. Jump, move left and right, collect rainbows, and fire rainbow hearts at obstacles."
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => {
          movementRef.current = { left: false, right: false };
        }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.focus();
          jump();
        }}
      >
        <div className="runner-aurora runner-aurora--one" aria-hidden="true" />
        <div className="runner-aurora runner-aurora--two" aria-hidden="true" />
        <div className="runner-constellations" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
          <span /><span /><span />
        </div>
        <div className="runner-cloud runner-cloud--one" aria-hidden="true" />
        <div className="runner-cloud runner-cloud--two" aria-hidden="true" />
        <div className="runner-sky-sparkles" aria-hidden="true">
          <span>✦</span><span>✦</span><span>✦</span><span>✦</span>
        </div>

        {view.sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className="runner-jump-sparkle"
            style={{
              left: `${sparkle.x}%`,
              bottom: `${GROUND_OFFSET + sparkle.y}%`,
              fontSize: `${sparkle.size}px`,
              opacity: Math.min(1, sparkle.life * 2.4),
            }}
            aria-hidden="true"
          >
            {sparkle.glyph}
          </span>
        ))}

        {view.projectiles.map((projectile) => (
          <span
            key={projectile.id}
            className="runner-rainbow-heart"
            style={{
              left: `${projectile.x}%`,
              bottom: `${GROUND_OFFSET + projectile.y}%`,
            }}
            aria-hidden="true"
          >
            ♥
          </span>
        ))}

        {view.rainbows.map((rainbow) => (
          <span
            key={rainbow.id}
            className="runner-rainbow-pickup"
            style={{
              left: `${rainbow.x}%`,
              bottom: `${GROUND_OFFSET + rainbow.y}%`,
            }}
            aria-hidden="true"
          >
            <i />
            <small>+1</small>
          </span>
        ))}

        {view.obstacles.map((obstacle) => {
          const details = OBSTACLE_DETAILS[obstacle.kind];

          return (
            <div
              key={obstacle.id}
              className={`runner-obstacle runner-obstacle--${obstacle.kind}${
                obstacle.hit ? " is-hit" : ""
              }${obstacle.destroyed ? " is-destroyed" : ""}`}
              style={{
                left: `${obstacle.x}%`,
                width: `${details.width}%`,
                height: `${details.height}%`,
              }}
              aria-hidden="true"
            >
              <span className="runner-obstacle-label">{details.label}</span>
              <span className="runner-obstacle-symbol">{details.symbol}</span>
            </div>
          );
        })}

        <div
          className={`runner-player${view.invulnerable > 0 ? " is-hurt" : ""}`}
          style={{
            left: `${view.playerX}%`,
            bottom: `${GROUND_OFFSET + view.height}%`,
            width: `${PLAYER_WIDTH}%`,
            transform: `translateX(-50%) rotate(${tilt}deg)`,
          }}
          aria-hidden="true"
        >
          <span className="runner-player-aura" />
          <Image src="/press-q-icon.png" alt="" width={624} height={667} priority />
        </div>

        <div className="runner-ground" aria-hidden="true">
          <span />
        </div>

        {view.status !== "playing" ? (
          <div className="runner-overlay">
            <div
              className={`runner-overlay-card${view.status === "gameover" ? " is-gameover" : ""}`}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {view.status === "gameover" ? (
                <>
                  <div className="runner-sad-image">
                    <Image
                      src="/quiu-sad-transparent.png"
                      alt="A sad, injured Quiu"
                      width={1254}
                      height={1254}
                      className="runner-sad-sprite"
                      unoptimized
                    />
                  </div>
                  <div className="runner-gameover-summary">
                    <p className="runner-overlay-kicker">Distance · {distance}</p>
                    <p className="runner-overlay-title">Quiu needs another try</p>
                    <p className="runner-overlay-copy">
                      Three lives down — save your best score, then get back up.
                    </p>
                  </div>
                  <form className="runner-score-form" onSubmit={saveScore} autoComplete="off">
                    <label htmlFor="runner-player-name">Save your best score</label>
                    <div>
                      <input
                        id="runner-player-name"
                        value={playerName}
                        onChange={(event) => {
                          setPlayerName(event.target.value);
                          setScoreSaved(false);
                        }}
                        maxLength={18}
                        placeholder="Your name"
                        autoComplete="off"
                        required
                      />
                      <button type="submit">{scoreSaved ? "Saved" : "Save"}</button>
                    </div>
                  </form>
                  <div className="runner-leaderboard">
                    <div className="runner-leaderboard-title">
                      <span>Hall of Fame</span>
                      <small>Saved on this device</small>
                    </div>
                    {leaderboard.length > 0 ? (
                      <ol>
                        {leaderboard.map((entry, index) => (
                          <li key={entry.name.toLocaleLowerCase()}>
                            <span><b>{index + 1}</b>{entry.name}</span>
                            <strong>{entry.score}</strong>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="runner-empty-score">Be the first name on the board.</p>
                    )}
                    <button type="button" className="runner-restart-button" onClick={startGame}>
                      Try again
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="runner-overlay-kicker">Ready player Q?</p>
                  <p className="runner-overlay-title">Help Quiu keep queer stories moving</p>
                  <p className="runner-overlay-copy">
                    Double jump to collect rainbows, move with A/D or ←/→, and fire hearts with X.
                  </p>
                  <button type="button" className="runner-start-pill" onClick={startGame}>
                    Tap to start
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="runner-help">
          <span>Tap twice</span> for double jump · <span>X</span> to fire
        </div>
        <button
          type="button"
          className="runner-fire-button"
          aria-label={`Fire rainbow heart. ${view.ammo} shots remaining.`}
          disabled={view.status !== "playing" || view.ammo <= 0}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            fireRainbowHeart();
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true">♥</span>
          <small>{view.ammo}</small>
        </button>
        <div className="runner-move-controls" aria-label="Horizontal movement controls">
          <button
            type="button"
            aria-label="Move Quiu left"
            disabled={view.status !== "playing"}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              movementRef.current.left = true;
            }}
            onPointerUp={() => { movementRef.current.left = false; }}
            onPointerCancel={() => { movementRef.current.left = false; }}
            onPointerLeave={() => { movementRef.current.left = false; }}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Move Quiu right"
            disabled={view.status !== "playing"}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              movementRef.current.right = true;
            }}
            onPointerUp={() => { movementRef.current.right = false; }}
            onPointerCancel={() => { movementRef.current.right = false; }}
            onPointerLeave={() => { movementRef.current.right = false; }}
          >
            →
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {view.status === "gameover"
            ? `Game over. Final distance ${distance}.`
            : `${view.lives} lives and ${view.ammo} rainbow hearts remaining. Distance ${distance}.`}
        </p>
      </div>

      <p className="quiu-runner-caption">
        Jump over censorship, harassment, erasure, misinformation, and exclusion.
      </p>
    </div>
  );
}
