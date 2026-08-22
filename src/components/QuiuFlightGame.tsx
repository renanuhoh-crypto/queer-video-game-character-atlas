"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "ready" | "playing" | "gameover";
type Enemy = { id: number; x: number; y: number; hp: number; label: string; boss?: boolean };
type Shot = { id: number; x: number; y: number; enemy?: boolean };
type Power = { id: number; x: number; y: number; kind: "shield" | "multi" };
type Model = { status: Status; x: number; y: number; shield: number; score: number; wave: number; enemies: Enemy[]; shots: Shot[]; powers: Power[]; spawn: number; fire: number; kills: number; bossHp: number; bossMax: number; multi: number; flash: number };
const labels = ["CENSOR", "ERASURE", "HATE"];
const fresh = (): Model => ({ status: "ready", x: 50, y: 82, shield: 100, score: 0, wave: 1, enemies: [], shots: [], powers: [], spawn: 0, fire: 0, kills: 0, bossHp: 0, bossMax: 0, multi: 0, flash: 0 });

export default function QuiuFlightGame() {
  const model = useRef<Model>(fresh());
  const keys = useRef({ left: false, right: false, up: false, down: false, fire: false });
  const ids = useRef(1);
  const last = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const [view, setView] = useState<Model>(fresh);
  const [best, setBest] = useState(0);
  const publish = useCallback(() => setView({ ...model.current, enemies: [...model.current.enemies], shots: [...model.current.shots], powers: [...model.current.powers] }), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBest(Number(localStorage.getItem("press-q-ultimate-ride-best") || 0));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const shoot = useCallback(() => {
    const m = model.current;
    if (m.status !== "playing" || m.fire > 0) return;
    m.fire = m.multi > 0 ? .1 : .2;
    (m.multi > 0 ? [-3, 0, 3] : [0]).forEach((offset) => m.shots.push({ id: ids.current++, x: m.x + offset, y: m.y - 5 }));
  }, []);

  const start = useCallback(() => {
    model.current = { ...fresh(), status: "playing" };
    keys.current = { left: false, right: false, up: false, down: false, fire: false };
    last.current = null;
    publish();
  }, [publish]);

  useEffect(() => {
    function loop(time: number) {
      const m = model.current;
      const dt = Math.min((time - (last.current ?? time)) / 1000, .035);
      last.current = time;
      if (m.status === "playing") {
        const speed = 46 * dt;
        m.x = Math.max(6, Math.min(94, m.x + ((keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)) * speed));
        m.y = Math.max(14, Math.min(88, m.y + ((keys.current.down ? 1 : 0) - (keys.current.up ? 1 : 0)) * speed));
        m.fire = Math.max(0, m.fire - dt); m.multi = Math.max(0, m.multi - dt); m.flash = Math.max(0, m.flash - dt);
        if (keys.current.fire) shoot();
        m.spawn -= dt;
        if (m.spawn <= 0) {
          const boss = m.wave % 5 === 0;
          if (boss && !m.enemies.some((enemy) => enemy.boss)) {
            const hp = 14 + m.wave * 2;
            m.enemies.push({ id: ids.current++, x: 50, y: 8, hp, label: "ERASURE CORE", boss: true });
            m.bossHp = hp; m.bossMax = hp; m.spawn = 99;
          } else if (!boss) {
            const amount = Math.min(2 + Math.floor(m.wave / 2), 5);
            for (let i = 0; i < amount; i++) m.enemies.push({ id: ids.current++, x: 12 + Math.random() * 76, y: -8 - i * 7, hp: 1 + Math.floor(m.wave / 4), label: labels[Math.floor(Math.random() * labels.length)] });
            m.spawn = Math.max(.65, 1.5 - m.wave * .06);
          }
        }
        m.shots = m.shots.map((shot) => ({ ...shot, y: shot.y + (shot.enemy ? 33 : -66) * dt })).filter((shot) => shot.y > -8 && shot.y < 108);
        m.enemies.forEach((enemy) => {
          enemy.y += (enemy.boss ? 4 : 9 + m.wave * .55) * dt;
          if (enemy.boss) enemy.x = 50 + Math.sin(time / 650) * 31;
          if (Math.random() < (enemy.boss ? .018 : .0025 * m.wave) && enemy.y > 5) m.shots.push({ id: ids.current++, x: enemy.x, y: enemy.y + 5, enemy: true });
        });
        for (const shot of m.shots.filter((item) => !item.enemy)) for (const enemy of m.enemies) {
          if (Math.abs(shot.x - enemy.x) < (enemy.boss ? 10 : 5) && Math.abs(shot.y - enemy.y) < (enemy.boss ? 7 : 5)) {
            shot.y = -20; enemy.hp--; if (enemy.boss) m.bossHp = Math.max(0, enemy.hp);
            if (enemy.hp <= 0) { m.score += enemy.boss ? 2500 : 100 * m.wave; m.kills++; if (Math.random() < .18) m.powers.push({ id: ids.current++, x: enemy.x, y: enemy.y, kind: Math.random() > .5 ? "shield" : "multi" }); }
          }
        }
        m.enemies = m.enemies.filter((enemy) => enemy.hp > 0 && enemy.y < 104);
        const hitShot = m.shots.find((shot) => shot.enemy && Math.abs(shot.x - m.x) < 5 && Math.abs(shot.y - m.y) < 5);
        const hitEnemy = m.enemies.find((enemy) => Math.abs(enemy.x - m.x) < (enemy.boss ? 11 : 6) && Math.abs(enemy.y - m.y) < 7);
        if ((hitShot || hitEnemy) && m.flash <= 0) { m.shield -= 25; m.flash = 1; if (hitShot) hitShot.y = 120; }
        m.powers = m.powers.map((power) => ({ ...power, y: power.y + 15 * dt })).filter((power) => {
          if (Math.abs(power.x - m.x) < 6 && Math.abs(power.y - m.y) < 7) { if (power.kind === "shield") m.shield = Math.min(100, m.shield + 40); else m.multi = 8; m.score += 250; return false; }
          return power.y < 105;
        });
        const target = m.wave % 5 === 0 ? 1 : 10 + m.wave * 2;
        if (m.kills >= target) { m.wave++; m.kills = 0; m.spawn = .8; m.bossHp = 0; m.bossMax = 0; }
        if (m.shield <= 0) { m.status = "gameover"; const next = Math.max(best, m.score); setBest(next); localStorage.setItem("press-q-ultimate-ride-best", String(next)); }
        publish();
      }
      frame.current = requestAnimationFrame(loop);
    }
    frame.current = requestAnimationFrame(loop);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [best, publish, shoot]);

  useEffect(() => {
    const change = (event: KeyboardEvent, value: boolean) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "a"].includes(key)) keys.current.left = value;
      if (["arrowright", "d"].includes(key)) keys.current.right = value;
      if (["arrowup", "w"].includes(key)) keys.current.up = value;
      if (["arrowdown", "s"].includes(key)) keys.current.down = value;
      if ([" ", "x", "f"].includes(key)) { event.preventDefault(); keys.current.fire = value; if (value) shoot(); }
    };
    const down = (event: KeyboardEvent) => change(event, true), up = (event: KeyboardEvent) => change(event, false);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [shoot]);

  const hold = (key: keyof typeof keys.current, value: boolean) => { keys.current[key] = value; if (key === "fire" && value) shoot(); };
  return <section className="quiu-ride-shell">
    <div className={`quiu-ride-game${view.flash > 0 ? " is-hit" : ""}`} role="application" aria-label="Quiu Ultimate Ride arcade game">
      <div className="quiu-ride-stars" aria-hidden="true" /><div className="quiu-ride-crt" aria-hidden="true" />
      <header className="quiu-ride-hud"><div><small>Score</small><strong>{view.score}</strong></div><div><small>High score</small><strong>{best}</strong></div><div><small>Wave</small><strong>{view.wave}</strong></div><div><small>Shield</small><strong>{Math.max(0, view.shield)}%</strong></div></header>
      {view.bossMax > 0 ? <div className="quiu-ride-boss"><span style={{ width: `${(view.bossHp / view.bossMax) * 100}%` }} /></div> : null}
      {view.enemies.map((enemy) => <div key={enemy.id} className={`quiu-ride-enemy${enemy.boss ? " is-boss" : ""}`} style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}><span>{enemy.label}</span><i /></div>)}
      {view.shots.map((shot) => <i key={shot.id} className={`quiu-ride-shot${shot.enemy ? " is-enemy" : ""}`} style={{ left: `${shot.x}%`, top: `${shot.y}%` }}>{shot.enemy ? "◆" : "♥"}</i>)}
      {view.powers.map((power) => <div key={power.id} className={`quiu-ride-power is-${power.kind}`} style={{ left: `${power.x}%`, top: `${power.y}%` }}>{power.kind === "shield" ? "S" : "M"}</div>)}
      <div className={`quiu-ride-player${view.multi > 0 ? " is-powered" : ""}`} style={{ left: `${view.x}%`, top: `${view.y}%` }}><Image src={view.flash > 0 ? "/quiu-sad-transparent.png" : "/press-q-icon.png"} alt="" width={140} height={140} priority /></div>
      <div className="quiu-ride-pad">{(["up", "left", "down", "right"] as const).map((key) => <button key={key} aria-label={`Move ${key}`} onPointerDown={() => hold(key, true)} onPointerUp={() => hold(key, false)}>{({ up: "↑", left: "←", down: "↓", right: "→" })[key]}</button>)}</div>
      <button className="quiu-ride-fire" onPointerDown={() => hold("fire", true)} onPointerUp={() => hold("fire", false)} aria-label="Fire rainbow hearts">♥<small>Fire</small></button>
      {view.status !== "playing" ? <div className="quiu-ride-overlay"><h2>QUIU<br/><span>ULTIMATE RIDE</span></h2><p>{view.status === "gameover" ? `Signal lost · Score ${view.score}` : "Defend queer stories through escalating waves of censorship, erasure, and harassment."}</p><button type="button" onClick={start}>{view.status === "gameover" ? "Try again" : "Play game"}</button></div> : null}
    </div>
    <p className="quiu-ride-help">WASD / arrows move · Space, X, or F fires · M = multishot · S = shield</p>
  </section>;
}
