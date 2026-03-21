"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import StarField from "@/components/StarField";
import TypeWriter from "@/components/TypeWriter";
import FadeIn from "@/components/FadeIn";

const MODES = [
  {
    id: "short",
    label: "ショート診断",
    subtitle: "…3分で読んでくるよ",
    description: "6つの占術の核心をぎゅっと凝縮。あなたの性格・人間関係・才能がわかる。",
    price: "無料",
    paid: false,
  },
  {
    id: "full",
    label: "フル鑑定",
    subtitle: "…じっくり調べてくる",
    description: "6000文字超の詳細レポート。あなただけの物語を書き下ろす。相談にも答える。",
    price: "¥200",
    paid: true,
  },
  {
    id: "compatibility",
    label: "相性占い",
    subtitle: "…ふたりの本、見比べてくる",
    description: "2人の生年月日から6占術で相性を読み解く。恋愛・ビジネス・総合から選べる。",
    price: "¥200",
    paid: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r) { setRef(r); sessionStorage.setItem("fd_ref", r); }
    else { const stored = sessionStorage.getItem("fd_ref"); if (stored) setRef(stored); }
    if (params.get("cancelled") === "true") setCancelled(true);
    const err = params.get("error");
    if (err) setError(err);
  }, []);

  const handleCheckout = async (mode: "full" | "compatibility") => {
    setLoading(mode);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ref: ref || "direct" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error);
    } catch {
      setError("決済の開始に失敗しました。");
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: "var(--navy)" }}>
      <StarField />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">

        {/* Hero */}
        <FadeIn delay={0.2}>
          <div className="text-center mb-2">
            <motion.h1
              className="text-5xl sm:text-6xl font-bold tracking-tight text-white"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              うらら
            </motion.h1>
          </div>
        </FadeIn>

        <FadeIn delay={0.6}>
          <p className="text-center text-sm mb-6" style={{ color: "var(--gold)" }}>
            <TypeWriter text="6つの占術で読む、あなたの物語" speed={60} delay={800} />
          </p>
        </FadeIn>

        {/* Characters hero with floating animation */}
        <FadeIn delay={0.4} y={30}>
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <div className="flex">
              <motion.div
                className="w-1/2 relative"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image src="/urara-hero.png" alt="うらら" width={600} height={600} className="w-full h-auto object-cover" priority />
              </motion.div>
              <motion.div
                className="w-1/2 relative"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <Image src="/reki-hero.png" alt="れき" width={600} height={600} className="w-full h-auto object-cover" priority />
              </motion.div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-[var(--navy)]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
              <p className="text-sm text-white/90 leading-relaxed">
                <TypeWriter
                  text="…生年月日を教えてくれたら、星の図書館であなたの本を探してくるよ"
                  speed={45}
                  delay={1500}
                />
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Notifications */}
        <AnimatePresence>
          {cancelled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-900/30 text-amber-200 text-sm text-center"
            >
              お支払いがキャンセルされました。
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-900/30 text-red-200 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divination badges */}
        <FadeIn delay={1.0}>
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            {["西洋占星術", "宿曜", "数秘術", "マヤ暦", "算命学", "四柱推命"].map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.1 }}
                className="px-2.5 py-1 rounded-full text-[11px] border"
                style={{ background: "rgba(201,169,110,0.1)", borderColor: "rgba(201,169,110,0.3)", color: "var(--gold-light)" }}
              >
                {name}
              </motion.span>
            ))}
          </div>
        </FadeIn>

        {/* Mode cards */}
        <div className="space-y-3 mb-10">
          {MODES.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.15, duration: 0.5 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              className="rounded-2xl border p-5 cursor-pointer backdrop-blur-sm"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderColor: mode.paid ? "rgba(201,169,110,0.2)" : "rgba(201,169,110,0.5)",
              }}
              onClick={() => {
                if (mode.id === "short") router.push(`/short${ref ? `?ref=${ref}` : ""}`);
                else handleCheckout(mode.id as "full" | "compatibility");
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-base font-bold text-white">{mode.label}</h2>
                  <p className="text-xs text-white/40">{mode.subtitle}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: mode.paid ? "var(--gold)" : "#e8a0a0" }}>
                  {mode.price}
                </span>
              </div>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">{mode.description}</p>
              <div
                className="w-full py-2.5 rounded-full font-medium text-sm text-center text-white transition-all"
                style={{ background: mode.paid ? "rgba(201,169,110,0.2)" : "rgba(201,169,110,0.4)" }}
              >
                {loading === mode.id ? "決済画面へ移動中…" : mode.paid ? "¥200で鑑定する" : "無料で診断する"}
              </div>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <FadeIn delay={1.8}>
          <div className="grid grid-cols-3 gap-3 text-center mb-10">
            {[
              { step: "1", title: "メニューを選ぶ" },
              { step: "2", title: "生年月日を入力" },
              { step: "3", title: "結果を受け取る" },
            ].map((item) => (
              <div key={item.step}>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mb-1 border" style={{ borderColor: "rgba(201,169,110,0.3)", color: "var(--gold)" }}>
                  {item.step}
                </div>
                <p className="text-[11px] text-white/50">{item.title}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Footer */}
        <FadeIn delay={2.0}>
          <footer className="text-center text-[11px] text-white/30 space-y-1">
            <p>Stripe安全決済 · スマホ対応</p>
            <p>&copy; 2026 うらら / SATOYAMA AI BASE</p>
          </footer>
        </FadeIn>
      </div>
    </main>
  );
}
