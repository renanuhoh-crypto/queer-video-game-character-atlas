"use client";

import Image from "next/image";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "ready" | "playing" | "gameover";
type Enemy = { id: number; x: number; baseX: number; y: number; hp: number; label: string; sprite: number; hit?: number; shooting?: number; boss?: boolean };
type Shot = { id: number; x: number; y: number; enemy?: boolean; fireball?: boolean; ammo?: 1 | 2; age?: number };
type Power = { id: number; x: number; y: number; kind: "shield" | "super" };
type Spark = { id: number; x: number; y: number; dx: number; life: number; glyph: "✦" | "★" | "·"; trail?: boolean };
type Explosion = { id: number; x: number; y: number; life: number; boss?: boolean };
type Score = { name: string; score: number };
type Model = { status: Status; x: number; y: number; direction: "idle" | "left" | "right"; shield: number; score: number; wave: number; enemies: Enemy[]; shots: Shot[]; powers: Power[]; sparks: Spark[]; explosions: Explosion[]; spawn: number; fire: number; trailClock: number; kills: number; bossHp: number; bossMax: number; multi: number; flash: number; levelFlash: number };
const labels = ["CENSOR", "ERASURE", "HATE"];
const RENDER_INTERVAL = 1000 / 30;
const MAX_SHOTS = 80;
const MAX_SPARKS = 48;
const MAX_EXPLOSIONS = 10;
const MAX_POWERS = 8;
const fresh = (): Model => ({ status: "ready", x: 50, y: 82, direction: "idle", shield: 100, score: 0, wave: 1, enemies: [], shots: [], powers: [], sparks: [], explosions: [], spawn: 0, fire: 0, trailClock: 0, kills: 0, bossHp: 0, bossMax: 0, multi: 0, flash: 0, levelFlash: 0 });

export default function QuiuFlightGame() {
  const model = useRef<Model>(fresh());
  const keys = useRef({ left: false, right: false, fire: false });
  const ids = useRef(1);
  const last = useRef<number | null>(null);
  const lastPublished = useRef(0);
  const frame = useRef<number | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const audioVoices = useRef(0);
  const soundEnabled = useRef(true);
  const [view, setView] = useState<Model>(fresh);
  const [best, setBest] = useState(0);
  const [scores, setScores] = useState<Score[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const publish = useCallback(() => setView({ ...model.current, enemies: [...model.current.enemies], shots: [...model.current.shots], powers: [...model.current.powers], sparks: [...model.current.sparks], explosions: [...model.current.explosions] }), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBest(Number(localStorage.getItem("press-q-ultimate-ride-best") || 0));
      try {
        const stored = JSON.parse(localStorage.getItem("press-q-runner-leaderboard") || "[]") as Score[];
        setScores(stored.filter((entry) => entry.name && Number.isFinite(entry.score)).slice(0, 5));
      } catch { setScores([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", volume = .05) => {
    if (!soundEnabled.current || !audio.current || audioVoices.current >= 8) return;
    const oscillator = audio.current.createOscillator();
    const gain = audio.current.createGain();
    audioVoices.current++;
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.current.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.current.destination);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
      audioVoices.current = Math.max(0, audioVoices.current - 1);
    }, { once: true });
    oscillator.start(); oscillator.stop(audio.current.currentTime + duration);
  }, []);

  const shoot = useCallback(() => {
    const m = model.current;
    if (m.status !== "playing" || m.fire > 0 || m.shots.length >= MAX_SHOTS) return;
    m.fire = m.multi > 0 ? .1 : .2;
    for (const offset of m.multi > 0 ? [-3, 0, 3] : [0]) {
      if (m.shots.length >= MAX_SHOTS) break;
      m.shots.push({ id: ids.current++, x: m.x + offset, y: m.y - 5 });
    }
    playTone(760, .055, "sawtooth", .035);
  }, [playTone]);

  const start = useCallback(() => {
    audio.current ??= new AudioContext();
    void audio.current.resume();
    model.current = { ...fresh(), status: "playing" };
    keys.current = { left: false, right: false, fire: false };
    last.current = null;
    lastPublished.current = performance.now();
    publish();
    setScoreSaved(false);
  }, [publish]);

  useEffect(() => {
    function loop(time: number) {
      const m = model.current;
      const dt = Math.min((time - (last.current ?? time)) / 1000, .05);
      last.current = time;
      if (document.hidden) {
        frame.current = requestAnimationFrame(loop);
        return;
      }
      if (m.status === "playing") {
        const speed = 46 * dt;
        const horizontal = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
        m.direction = horizontal < 0 ? "left" : horizontal > 0 ? "right" : "idle";
        m.x = Math.max(6, Math.min(94, m.x + horizontal * speed));
        m.trailClock -= dt;
        if (horizontal !== 0 && m.trailClock <= 0) {
          m.trailClock = .1;
          m.sparks.push({ id: ids.current++, x: m.x - horizontal * 4 + (Math.random() - .5) * 3, y: m.y + 1 + (Math.random() - .5) * 5, dx: -horizontal * (7 + Math.random() * 8), life: .5 + Math.random() * .35, glyph: (["✦", "★", "·"] as const)[Math.floor(Math.random() * 3)], trail: true });
        }
        m.fire = Math.max(0, m.fire - dt); m.multi = Math.max(0, m.multi - dt); m.flash = Math.max(0, m.flash - dt); m.levelFlash = Math.max(0, m.levelFlash - dt);
        m.enemies.forEach((enemy) => { enemy.hit = Math.max(0, (enemy.hit || 0) - dt); enemy.shooting = Math.max(0, (enemy.shooting || 0) - dt); });
        for (const spark of m.sparks) { spark.x += spark.dx * dt; spark.y -= 22 * dt; spark.life -= dt; }
        m.sparks = m.sparks.filter((spark) => spark.life > 0).slice(-MAX_SPARKS);
        for (const explosion of m.explosions) explosion.life -= dt;
        m.explosions = m.explosions.filter((explosion) => explosion.life > 0).slice(-MAX_EXPLOSIONS);
        if (keys.current.fire || m.multi > 0) shoot();
        m.spawn -= dt;
        const waveTarget = m.wave % 5 === 0 ? 1 : 10 + m.wave * 2;
        if (m.spawn <= 0 && m.kills + m.enemies.length < waveTarget) {
          const boss = m.wave % 5 === 0;
          if (boss && !m.enemies.some((enemy) => enemy.boss)) {
            const hp = 40 + m.wave * 8;
            m.enemies = [{ id: ids.current++, x: 50, baseX: 50, y: 12, hp, label: "TRUMP BOSS", sprite: 0, boss: true }];
            m.shots = []; m.powers = [];
            playTone(110, .7, "sawtooth", .11);
            m.bossHp = hp; m.bossMax = hp; m.spawn = 99;
          } else if (!boss) {
            const level = Math.floor((m.wave - 1) / 5) + 1;
            const remaining = waveTarget - m.kills - m.enemies.length;
            const amount = Math.min(2 + Math.floor(m.wave / 2) + level - 1, 7, remaining);
            for (let i = 0; i < amount; i++) {
              const x = 12 + Math.random() * 76;
              m.enemies.push({ id: ids.current++, x, baseX: x, y: -8 - i * 7, hp: level + Math.floor(m.wave / 4), label: labels[Math.floor(Math.random() * labels.length)], sprite: (m.wave * 2 + i) % 12 });
            }
            m.spawn = Math.max(.65, 1.5 - m.wave * .06);
          }
        }
        for (const shot of m.shots) {
          shot.age = (shot.age || 0) + dt;
          if (shot.ammo && shot.age >= .16) shot.ammo = 2;
          shot.y += (shot.enemy ? 33 : -66) * dt;
        }
        m.shots = m.shots.filter((shot) => shot.y > -8 && shot.y < 108).slice(-MAX_SHOTS);
        m.enemies.forEach((enemy) => {
          if (!enemy.boss) enemy.y += (9 + m.wave * .55) * dt;
          if (enemy.boss) enemy.x = 50 + Math.sin(time / 650) * 31;
          else if (m.wave % 3 === 2) enemy.x = Math.max(7, Math.min(93, enemy.baseX + Math.sin(time / 520 + enemy.id) * 18));
          else if (m.wave % 3 === 0) enemy.x = Math.max(7, Math.min(93, enemy.baseX + Math.sin(time / 310 + enemy.id * .55) * 9));
          if (m.shots.length < MAX_SHOTS && Math.random() < (enemy.boss ? 1.08 : .15 * m.wave) * dt && enemy.y > 5) {
            enemy.shooting = .28;
            m.shots.push({ id: ids.current++, x: enemy.x, y: enemy.y + 5, enemy: true, ammo: 1, age: 0 });
          }
          if (enemy.boss && m.shots.length < MAX_SHOTS && Math.random() < .21 * dt) {
            m.shots.push({ id: ids.current++, x: enemy.x, y: enemy.y + 7, enemy: true, fireball: true });
            playTone(72, .55, "sawtooth", .13);
          }
        });
        for (const shot of m.shots) {
          if (shot.enemy || shot.y < -8) continue;
          for (const enemy of m.enemies) {
            if (enemy.hp <= 0) continue;
            if (Math.abs(shot.x - enemy.x) < (enemy.boss ? 10 : 5) && Math.abs(shot.y - enemy.y) < (enemy.boss ? 7 : 5)) {
              shot.y = -20;
              enemy.hp--;
              enemy.hit = .22;
              const destroyed = enemy.hp === 0;
              playTone(destroyed ? 150 : 330, destroyed ? .18 : .055, destroyed ? "square" : "triangle", destroyed ? .09 : .025);
              for (let spark = 0; spark < 5; spark++) m.sparks.push({ id: ids.current++, x: enemy.x, y: enemy.y, dx: (Math.random() - .5) * 24, life: .45 + Math.random() * .3, glyph: (["✦", "★", "·"] as const)[spark % 3] });
              if (enemy.boss) m.bossHp = Math.max(0, enemy.hp);
              if (destroyed) {
                m.score += enemy.boss ? 2500 : 100 * m.wave;
                m.kills++;
                m.explosions.push({ id: ids.current++, x: enemy.x, y: enemy.y, life: enemy.boss ? .9 : .58, boss: enemy.boss });
                if (m.powers.length < MAX_POWERS && Math.random() < .18) m.powers.push({ id: ids.current++, x: enemy.x, y: enemy.y, kind: Math.random() > .5 ? "shield" : "super" });
              }
              break;
            }
          }
        }
        m.sparks = m.sparks.slice(-MAX_SPARKS);
        m.explosions = m.explosions.slice(-MAX_EXPLOSIONS);
        m.enemies = m.enemies.filter((enemy) => enemy.hp > 0 && enemy.y < 104);
        const hitShot = m.shots.find((shot) => shot.enemy && Math.abs(shot.x - m.x) < (shot.fireball ? 9 : 5) && Math.abs(shot.y - m.y) < (shot.fireball ? 9 : 5));
        const hitEnemy = m.enemies.find((enemy) => Math.abs(enemy.x - m.x) < (enemy.boss ? 11 : 6) && Math.abs(enemy.y - m.y) < 7);
        if ((hitShot || hitEnemy) && m.flash <= 0) { m.shield -= hitShot?.fireball ? 50 : 25; m.flash = 1; if (hitShot) hitShot.y = 120; }
        for (const power of m.powers) power.y += 15 * dt;
        m.powers = m.powers.filter((power) => {
          if (Math.abs(power.x - m.x) < 6 && Math.abs(power.y - m.y) < 7) { if (power.kind === "shield") m.shield = Math.min(100, m.shield + 40); else m.multi = 8; m.score += 250; playTone(power.kind === "super" ? 980 : 620, .32, "sine", .1); return false; }
          return power.y < 105;
        });
        if (m.kills >= waveTarget && m.enemies.length === 0) { const bossDefeated = m.wave % 5 === 0; m.wave++; m.kills = 0; m.spawn = .8; m.bossHp = 0; m.bossMax = 0; m.shots = []; if (bossDefeated) { m.levelFlash = 2.6; m.shield = Math.min(100, m.shield + 35); playTone(880, .65, "sine", .12); } }
        if (m.shield <= 0) { m.status = "gameover"; playTone(90, .8, "sawtooth", .12); const next = Math.max(best, m.score); setBest(next); localStorage.setItem("press-q-ultimate-ride-best", String(next)); }
        if (m.status !== "playing" || time - lastPublished.current >= RENDER_INTERVAL) {
          lastPublished.current = time;
          publish();
        }
      }
      frame.current = requestAnimationFrame(loop);
    }
    frame.current = requestAnimationFrame(loop);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [best, playTone, publish, shoot]);

  useEffect(() => {
    const change = (event: KeyboardEvent, value: boolean) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "a"].includes(key)) keys.current.left = value;
      if (["arrowright", "d"].includes(key)) keys.current.right = value;
      if (key === " ") { event.preventDefault(); keys.current.fire = value; if (value) shoot(); }
    };
    const down = (event: KeyboardEvent) => change(event, true), up = (event: KeyboardEvent) => change(event, false);
    const releaseControls = () => {
      keys.current = { left: false, right: false, fire: false };
      last.current = null;
    };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseControls);
    document.addEventListener("visibilitychange", releaseControls);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseControls);
      document.removeEventListener("visibilitychange", releaseControls);
    };
  }, [shoot]);

  const hold = (key: keyof typeof keys.current, value: boolean) => { keys.current[key] = value; if (key === "fire" && value) shoot(); };
  const beginHold = (event: ReactPointerEvent<HTMLButtonElement>, key: keyof typeof keys.current) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    hold(key, true);
  };
  const endHold = (event: ReactPointerEvent<HTMLButtonElement>, key: keyof typeof keys.current) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    hold(key, false);
  };
  const saveScore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = playerName.trim();
    if (!name) return;
    const next = [...scores.filter((entry) => entry.name.toLowerCase() !== name.toLowerCase()), { name, score: view.score }]
      .sort((a, b) => b.score - a.score).slice(0, 5);
    setScores(next); setScoreSaved(true);
    localStorage.setItem("press-q-runner-leaderboard", JSON.stringify(next));
  };
  const playerSprite = view.status === "ready"
    ? "/quiu-ready.png"
    : view.shield <= 10
      ? "/quiu-destroyed.png"
      : view.flash > 0
        ? "/quiu-hurt.png"
        : view.direction === "left"
          ? "/quiu-flying-right.png"
          : view.direction === "right"
            ? "/quiu-flying-left.png"
            : "/quiu-flying-idle.png";
  return <section className="quiu-ride-shell">
    <div className={`quiu-ride-game level-${Math.floor((view.wave - 1) / 5) + 1}${view.flash > 0 ? " is-hit" : ""}`} role="application" aria-label="Quiu Ultimate Ride arcade game" onPointerDown={(event) => { if (view.status === "playing" && !(event.target as HTMLElement).closest("button")) shoot(); }}>
      <div className="quiu-ride-galaxy quiu-ride-galaxy--far" aria-hidden="true" />
      <div className="quiu-ride-planet quiu-ride-planet--one" aria-hidden="true"><i /></div>
      <div className="quiu-ride-planet quiu-ride-planet--two" aria-hidden="true" />
      <div className="quiu-ride-planet quiu-ride-planet--three" aria-hidden="true" />
      <div className="quiu-ride-meteors" aria-hidden="true"><i/><i/><i/></div>
      <div className="quiu-ride-aurora quiu-ride-aurora--one" aria-hidden="true" /><div className="quiu-ride-aurora quiu-ride-aurora--two" aria-hidden="true" />
      <div className="quiu-ride-stars" aria-hidden="true" /><div className="quiu-ride-crt" aria-hidden="true" />
      <header className="quiu-ride-hud"><div><small>Score</small><strong>{view.score}</strong></div><div><small>Level</small><strong>{Math.floor((view.wave - 1) / 5) + 1}</strong></div><div><small>Wave</small><strong>{((view.wave - 1) % 5) + 1}/5</strong></div><div className="quiu-ride-shield"><small>Shield</small><strong>{Math.max(0, view.shield)}%</strong><i><span style={{width:`${Math.max(0,view.shield)}%`}}/></i></div></header>
      {view.bossMax > 0 ? <div className="quiu-ride-boss"><span style={{ width: `${(view.bossHp / view.bossMax) * 100}%` }} /></div> : null}
      {view.enemies.map((enemy) => {
        const bossRatio = enemy.boss ? Math.max(0, enemy.hp / view.bossMax) : 1;
        const bossFrame = bossRatio > .8 ? 0 : bossRatio > .62 ? 2 : bossRatio > .44 ? 4 : bossRatio > .25 ? 5 : bossRatio > .08 ? 6 : 7;
        const frame = enemy.boss ? bossFrame : enemy.sprite;
        return <div key={enemy.id} className={`quiu-ride-enemy${enemy.boss ? " is-boss is-trump" : ""}${enemy.hit ? " is-hit" : ""}${enemy.shooting ? " is-shooting" : ""}`} style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}><span>{enemy.label}</span><b className={enemy.boss ? "quiu-ride-boss-sprite" : "quiu-ride-enemy-sprite"} style={enemy.boss ? {backgroundPosition:`${(frame % 4) * 33.333}% ${Math.floor(frame / 4) * 100}%`} : {backgroundImage:`url("${enemy.shooting ? "/enemy1-shooting.png" : "/enemy1-idle.png"}")`}} /></div>;
      })}
      {view.shots.map((shot) => <i key={shot.id} className={`quiu-ride-shot${shot.enemy ? " is-enemy" : " is-quiu-shot"}${shot.fireball ? " is-fireball" : ""}${shot.ammo ? ` is-ammo-${shot.ammo}` : ""}`} style={{ left: `${shot.x}%`, top: `${shot.y}%` }}>{shot.fireball ? "●" : shot.enemy && !shot.ammo ? "◆" : ""}</i>)}
      {view.sparks.map((spark) => <i key={spark.id} className={`quiu-ride-impact-star${spark.trail ? " is-trail" : ""}`} style={{left:`${spark.x}%`,top:`${spark.y}%`,opacity:spark.life/.85}}>{spark.glyph}</i>)}
      {view.explosions.map((explosion) => <i key={explosion.id} className={`quiu-ride-explosion${explosion.boss ? " is-boss" : ""}`} style={{left:`${explosion.x}%`,top:`${explosion.y}%`}} />)}
      {view.powers.map((power) => <div key={power.id} className={`quiu-ride-power is-${power.kind}`} style={{ left: `${power.x}%`, top: `${power.y}%` }}><i>{power.kind === "shield" ? "S" : "Q✦"}</i>{power.kind === "super" ? <><strong>+5 shots</strong><small>Super Queer Machine Gun</small></> : null}</div>)}
      <div className={`quiu-ride-player${view.multi > 0 ? " is-powered" : ""}`} style={{ left: `${view.x}%`, top: `${view.y}%` }}>
        {view.multi > 0 ? <span className="quiu-ride-rainbow-aura" aria-hidden="true" /> : null}
        <span
          className="quiu-ride-player-sprite"
          style={{backgroundImage:`url("${playerSprite}")`}}
          aria-hidden="true"
        />
      </div>
      <div className="quiu-ride-pad">{(["left", "right"] as const).map((key) => <button type="button" key={key} aria-label={`Move ${key}`} onPointerDown={(event) => beginHold(event, key)} onPointerUp={(event) => endHold(event, key)} onPointerCancel={(event) => endHold(event, key)} onLostPointerCapture={() => hold(key, false)}><span aria-hidden="true">{key === "left" ? "←" : "→"}</span><small>{key}</small></button>)}</div>
      <button type="button" className="quiu-ride-fire" onPointerDown={(event) => beginHold(event, "fire")} onPointerUp={(event) => endHold(event, "fire")} onPointerCancel={(event) => endHold(event, "fire")} onLostPointerCapture={() => hold("fire", false)} aria-label="Fire rainbow hearts"><span aria-hidden="true">♥</span><small>Fire</small></button>
      <button className="quiu-ride-sound" type="button" onPointerDown={(event)=>event.stopPropagation()} onClick={() => { const next=!soundOn; setSoundOn(next); soundEnabled.current=next; if(next){ audio.current ??= new AudioContext(); void audio.current.resume(); playTone(540,.14); } }}>Sound: {soundOn ? "on" : "off"}</button>
      {view.levelFlash > 0 ? <div className="quiu-ride-level-up" role="status"><small>Trump Boss defeated</small><strong>Level {Math.floor((view.wave - 1) / 5) + 1}</strong><span>Stronger waves incoming</span></div> : null}
      {view.status !== "playing" ? <div className="quiu-ride-overlay"><Image className="quiu-ride-logo" src="/quiu-ultimate-ride-logo.png" alt="Quiu Ultimate Ride" width={1664} height={936} priority sizes="(max-width: 640px) 92vw, 50rem"/><p>{view.status === "gameover" ? `Signal lost · Score ${view.score}` : "Defend queer stories through escalating waves of censorship, erasure, and harassment."}</p>
        {view.status === "gameover" ? <><form className="quiu-ride-score-form" onSubmit={saveScore}><input value={playerName} onChange={(event) => { setPlayerName(event.target.value); setScoreSaved(false); }} maxLength={18} placeholder="Your name" required/><button type="submit">{scoreSaved ? "Saved" : "Save score"}</button></form><ol className="quiu-ride-leaderboard">{scores.map((entry,index)=><li key={entry.name.toLowerCase()}><span>{index+1}. {entry.name}</span><strong>{entry.score}</strong></li>)}</ol></> : null}
        <button type="button" onClick={start}>{view.status === "gameover" ? "Try again" : "Play game"}</button></div> : null}
      </div>
    {view.status === "playing" ? <div className="quiu-ride-mobile-controls" aria-label="Mobile game controls" onContextMenu={(event) => event.preventDefault()}>
      <div className="quiu-ride-mobile-directions">
        {(["left", "right"] as const).map((key) => <button type="button" key={key} aria-label={`Move ${key}`} onPointerDown={(event) => beginHold(event, key)} onPointerUp={(event) => endHold(event, key)} onPointerCancel={(event) => endHold(event, key)} onLostPointerCapture={() => hold(key, false)}><span aria-hidden="true">{key === "left" ? "←" : "→"}</span><small>{key}</small></button>)}
      </div>
      <button type="button" className="quiu-ride-mobile-fire" aria-label="Fire rainbow hearts" onPointerDown={(event) => beginHold(event, "fire")} onPointerUp={(event) => endHold(event, "fire")} onPointerCancel={(event) => endHold(event, "fire")} onLostPointerCapture={() => hold("fire", false)}><span aria-hidden="true">♥</span><small>Fire</small></button>
    </div> : null}
    <p className="quiu-ride-help">A/D or ←/→ moves · Mouse click or Space fires Quiu’s heart cannon · Super Q = 8s automatic triple fire</p>
  </section>;
}
