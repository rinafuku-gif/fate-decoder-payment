"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Programmatic sound generation using Web Audio API
let audioCtx: AudioContext | null = null;

function getAudioCtx() {
  if (!audioCtx && typeof window !== "undefined") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playTap() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

export function playReveal() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.5);
  });
}

export function playTransition() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

// Ambient background — gentle low hum with subtle shimmer
export function useAmbient() {
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode } | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;

    if (nodesRef.current) {
      nodesRef.current.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      setTimeout(() => {
        nodesRef.current?.osc.stop();
        nodesRef.current?.lfo.stop();
        nodesRef.current = null;
      }, 600);
      setPlaying(false);
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
    lfoGain.gain.setValueAtTime(8, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 1);

    osc.start();
    lfo.start();
    nodesRef.current = { osc, gain, lfo };
    setPlaying(true);
  }, []);

  useEffect(() => {
    return () => {
      if (nodesRef.current) {
        try { nodesRef.current.osc.stop(); nodesRef.current.lfo.stop(); } catch {}
      }
    };
  }, []);

  return { playing, toggle };
}

// Sound toggle button
export default function SoundToggle() {
  const { playing, toggle } = useAmbient();
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 transition-colors text-xs"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
      title={playing ? "サウンドOFF" : "サウンドON"}
    >
      {playing ? "♪" : "♪̸"}
    </button>
  );
}
