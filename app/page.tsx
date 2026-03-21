"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import StarField from "@/components/StarField";
import ChatBubble from "@/components/ChatBubble";
import ProgressBar from "@/components/ProgressBar";
import FadeIn from "@/components/FadeIn";
import { CHARACTER_CONFIG, type Character } from "@/lib/character";
import { calculateAll } from "@/lib/fortune-calc";
import { generateFortune } from "@/app/actions";

type Step =
  | "intro"
  | "char_select"
  | "mode_select"
  | "ask_name"
  | "ask_year"
  | "ask_month"
  | "ask_day"
  | "loading"
  | "result";

const STEP_TOTAL = 6; // char_select → mode → name → year → month → day

function stepIndex(step: Step): number {
  const map: Record<string, number> = {
    char_select: 1, mode_select: 2, ask_name: 3, ask_year: 4, ask_month: 5, ask_day: 6,
  };
  return map[step] || 0;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 80 }, (_, i) => 2010 - i);

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [character, setCharacter] = useState<Character | null>(null);
  const [mode, setMode] = useState<"short" | "full" | "compatibility">("short");
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState(0);
  const [day, setDay] = useState(0);
  const [inputReady, setInputReady] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r) { setRef(r); sessionStorage.setItem("fd_ref", r); }
    else { const stored = sessionStorage.getItem("fd_ref"); if (stored) setRef(stored); }
    // Auto advance from intro
    const timer = setTimeout(() => setStep("char_select"), 2500);
    return () => clearTimeout(timer);
  }, []);

  const charConfig = character ? CHARACTER_CONFIG[character] : null;

  const handleBubbleComplete = useCallback(() => {
    setInputReady(true);
  }, []);

  const goNext = useCallback((nextStep: Step) => {
    setInputReady(false);
    setStep(nextStep);
  }, []);

  // Diagnosis
  const runDiagnosis = useCallback(async () => {
    if (!character || !year || !month || !day) return;
    setStep("loading");

    try {
      const data = calculateAll(parseInt(year), month, day);
      const config = CHARACTER_CONFIG[character];
      const prompt = `
${config.promptStyle}

以下の人物の6占術データから、あなた（${config.name}）の口調・性格で診断結果を書いてください。

【対象者】${name} (${year}年${month}月${day}日生まれ)

【占術データ】
・マヤ暦: KIN${data.maya.kin} / 太陽の紋章:${data.maya.glyph} / 銀河の音:${data.maya.tone} / ウェイブスペル:${data.maya.ws}
・算命学: 中心星[${data.bazi.weapon}]
・四柱推命: 年柱[${data.sanmeigaku.year}] / 月柱[${data.sanmeigaku.month}] / 日柱[${data.sanmeigaku.day}] / 日干[${data.bazi.stem}]
・数秘術: ライフパスナンバー[${data.numerology.lp}]
・西洋占星術: ${data.western.sign}
・宿曜: ${data.sukuyo}

【執筆ルール】
1. personality: 200〜300文字
2. relationships: 200〜300文字
3. talent: 200〜300文字
4. oneWord: 8〜15文字
5. action: 20〜40文字
6. luckyItem: 具体的に
7. **必ず純粋なJSON形式で出力**

{"oneWord":"","personality":"","relationships":"","talent":"","action":"","luckyItem":""}
`;
      let parsed: any = {};
      try {
        const text = await generateFortune(prompt);
        let clean = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
        const first = clean.indexOf("{");
        if (first !== -1) clean = clean.substring(first);
        const last = clean.lastIndexOf("}");
        if (last !== -1) clean = clean.substring(0, last + 1);
        parsed = JSON.parse(clean);
      } catch {
        parsed = {
          oneWord: "…なかなか面白い星の配置",
          personality: `…${data.maya.glyph}の紋章を持ってる。LP${data.numerology.lp}。芯が強いタイプだと思う。`,
          relationships: `${data.western.sign}のあなたは、深い絆を求めるタイプ。`,
          talent: `「${data.bazi.weapon}」を持ってるから、本質を見抜く力がある。`,
          action: "…朝5分だけ窓を開けて深呼吸してみて",
          luckyItem: "温かい飲み物",
        };
      }

      // DB log
      fetch("/api/log-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: ref || "direct", mode: "short", name,
          birthDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        }),
      }).catch(() => {});

      setResult({ ...parsed, data, name });
      setStep("result");
    } catch {
      setStep("ask_name");
    }
  }, [character, name, year, month, day, ref]);

  useEffect(() => {
    if (step === "loading") {
      runDiagnosis();
    }
  }, [step, runDiagnosis]);

  const handleShare = async () => {
    const text = `${result?.name}「${result?.oneWord}」\n\nうらら で無料診断 →`;
    const url = window.location.origin + (ref ? `?ref=${ref}` : "");
    if (navigator.share) {
      try { await navigator.share({ title: "うらら", text, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(`${text}\n${url}`); setToast("コピーしました"); setTimeout(() => setToast(null), 2000); } catch {}
    }
  };

  const loadingStages = [
    { text: charConfig?.loadingText || "…探してくる", delay: 0 },
    { text: "…星の記録を照合してる", delay: 4000 },
    { text: "…もう少しだけ待ってて", delay: 8000 },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: "var(--navy)" }}>
      <StarField />

      <div className="relative z-10 max-w-lg mx-auto px-5 min-h-screen flex flex-col">

        {/* Progress */}
        {!["intro", "loading", "result"].includes(step) && (
          <div className="pt-4 pb-2">
            <ProgressBar current={stepIndex(step)} total={STEP_TOTAL} />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center py-6">
          <AnimatePresence mode="wait">

            {/* INTRO */}
            {step === "intro" && (
              <motion.div key="intro" exit={{ opacity: 0 }} className="text-center">
                <motion.h1
                  className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  星の図書館
                </motion.h1>
                <motion.p
                  className="text-sm text-white/50 mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  うららとれきが、あなたの星を読み解く
                </motion.p>
                <motion.p
                  className="text-xs"
                  style={{ color: "var(--gold)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  6つの占術 × AI
                </motion.p>
                <motion.div
                  className="flex justify-center gap-1 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--gold)" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* CHAR SELECT */}
            {step === "char_select" && (
              <motion.div key="char_select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-center text-white/60 text-sm mb-6">…どっちに読んでもらう？</p>
                <div className="grid grid-cols-2 gap-4">
                  {(["urara", "reki"] as Character[]).map((c, i) => {
                    const cfg = CHARACTER_CONFIG[c];
                    const img = c === "urara" ? "/urara-full.png" : "/reki-full.png";
                    return (
                      <motion.button
                        key={c}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.15 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setCharacter(c); goNext("mode_select"); }}
                        className="rounded-2xl border overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(201,169,110,0.3)" }}
                      >
                        <motion.div
                          className="aspect-square overflow-hidden"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                        >
                          <Image src={img} alt={cfg.name} width={382} height={382} className="object-cover w-full h-full" />
                        </motion.div>
                        <div className="p-3 text-center">
                          <p className="text-sm font-bold text-white">{cfg.name}</p>
                          <p className="text-[11px] text-white/40">{cfg.description}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* MODE SELECT */}
            {step === "mode_select" && charConfig && (
              <motion.div key="mode_select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatBubble
                  characterImage={charConfig.image}
                  characterName={charConfig.name}
                  text={`…${name || ""}。ショート（無料）にする？それとも詳しくやる？`}
                  onComplete={handleBubbleComplete}
                />
                {inputReady && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 ml-13 mt-2">
                    {[
                      { id: "short" as const, label: "ショート診断", sub: "無料・3分", color: "rgba(201,169,110,0.4)" },
                      { id: "full" as const, label: "フル鑑定", sub: "¥200・詳細レポート", color: "rgba(201,169,110,0.2)" },
                      { id: "compatibility" as const, label: "相性占い", sub: "¥200・ふたりの相性", color: "rgba(201,169,110,0.2)" },
                    ].map((m) => (
                      <motion.button
                        key={m.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setMode(m.id);
                          if (m.id === "short") goNext("ask_name");
                          else {
                            // Stripe checkout
                            fetch("/api/checkout", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ mode: m.id, ref: ref || "direct" }),
                            }).then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; });
                          }
                        }}
                        className="w-full p-3 rounded-xl border text-left transition-all"
                        style={{ background: m.color, borderColor: "rgba(201,169,110,0.3)" }}
                      >
                        <span className="text-sm font-medium text-white">{m.label}</span>
                        <span className="text-[11px] text-white/50 ml-2">{m.sub}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ASK NAME */}
            {step === "ask_name" && charConfig && (
              <motion.div key="ask_name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatBubble
                  characterImage={charConfig.image}
                  characterName={charConfig.name}
                  text="…名前、教えてくれる？"
                  onComplete={handleBubbleComplete}
                />
                {inputReady && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-13">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) goNext("ask_year"); }}
                      placeholder="ニックネームでOK"
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,169,110,0.3)" }}
                    />
                    <button
                      onClick={() => { if (name.trim()) goNext("ask_year"); }}
                      disabled={!name.trim()}
                      className="mt-2 w-full py-2.5 rounded-full text-sm font-medium text-white disabled:opacity-30 transition-opacity"
                      style={{ background: "var(--gold)" }}
                    >
                      次へ
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ASK YEAR */}
            {step === "ask_year" && charConfig && (
              <motion.div key="ask_year" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatBubble
                  characterImage={charConfig.image}
                  characterName={charConfig.name}
                  text={`…ありがとう、${name}。生まれた年は？`}
                  onComplete={handleBubbleComplete}
                />
                {inputReady && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-13">
                    <div className="grid grid-cols-5 gap-1.5 max-h-[240px] overflow-y-auto pr-1">
                      {YEARS.map((y) => (
                        <button
                          key={y}
                          onClick={() => { setYear(String(y)); goNext("ask_month"); }}
                          className="py-2 rounded-lg text-xs text-white/80 transition-all hover:text-white"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,169,110,0.15)" }}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ASK MONTH */}
            {step === "ask_month" && charConfig && (
              <motion.div key="ask_month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatBubble
                  characterImage={charConfig.image}
                  characterName={charConfig.name}
                  text="…月は？"
                  onComplete={handleBubbleComplete}
                  speed={30}
                />
                {inputReady && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-13">
                    <div className="grid grid-cols-4 gap-2">
                      {MONTHS.map((m) => (
                        <button
                          key={m}
                          onClick={() => { setMonth(m); goNext("ask_day"); }}
                          className="py-3 rounded-xl text-sm text-white/80 font-medium transition-all hover:text-white"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,169,110,0.2)" }}
                        >
                          {m}月
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ASK DAY */}
            {step === "ask_day" && charConfig && (
              <motion.div key="ask_day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatBubble
                  characterImage={charConfig.image}
                  characterName={charConfig.name}
                  text="…日は？"
                  onComplete={handleBubbleComplete}
                  speed={30}
                />
                {inputReady && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-13">
                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS.map((d) => (
                        <button
                          key={d}
                          onClick={() => { setDay(d); setStep("loading"); }}
                          className="py-2.5 rounded-lg text-xs text-white/80 transition-all hover:text-white"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,169,110,0.15)" }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* LOADING */}
            {step === "loading" && charConfig && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-2" style={{ borderColor: "var(--gold)", boxShadow: "0 0 40px rgba(201,169,110,0.25)" }}>
                    <Image src={charConfig.image} alt={charConfig.name} width={192} height={192} className="object-cover w-full h-full" />
                  </div>
                </motion.div>
                <LoadingText stages={loadingStages} />
                <div className="flex justify-center gap-1.5 mt-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--gold)" }}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* RESULT */}
            {step === "result" && result && charConfig && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
                <ChatBubble
                  characterImage={charConfig.image}
                  characterName={charConfig.name}
                  text={`…${result.name}の本、見つけてきたよ。`}
                  speed={35}
                />

                <FadeIn delay={1.5}>
                  <div className="text-center mb-6 p-4 rounded-2xl border" style={{ background: "rgba(201,169,110,0.08)", borderColor: "rgba(201,169,110,0.2)" }}>
                    <p className="text-[11px] text-white/40 mb-1">あなたを一言で</p>
                    <p className="text-lg font-bold" style={{ color: "var(--gold)" }}>{result.oneWord}</p>
                  </div>
                </FadeIn>

                <FadeIn delay={2.0}>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {[
                      { label: "星座", value: result.data.western.sign },
                      { label: "KIN", value: result.data.maya.kin },
                      { label: "LP", value: result.data.numerology.lp },
                      { label: "紋章", value: result.data.maya.glyph },
                      { label: "中心星", value: result.data.bazi.weapon },
                      { label: "宿曜", value: result.data.sukuyo },
                    ].map((d, i) => (
                      <div key={i} className="text-center p-2 rounded-xl border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(201,169,110,0.15)" }}>
                        <p className="text-[10px]" style={{ color: "var(--gold)" }}>{d.label}</p>
                        <p className="text-xs font-medium text-white/80">{d.value}</p>
                      </div>
                    ))}
                  </div>
                </FadeIn>

                <FadeIn delay={2.5}>
                  <div className="space-y-4 mb-6">
                    {[
                      { title: "性格の核心", text: result.personality },
                      { title: "人間関係", text: result.relationships },
                      { title: "才能・仕事", text: result.talent },
                    ].map((s, i) => (
                      <div key={i} className="border-l-2 pl-4 py-2" style={{ borderLeftColor: "var(--gold)" }}>
                        <h3 className="text-sm font-bold text-white/90 mb-1">{s.title}</h3>
                        <p className="text-sm text-white/70 leading-relaxed">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </FadeIn>

                <FadeIn delay={3.0}>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-xl border text-center" style={{ background: "rgba(201,169,110,0.08)", borderColor: "rgba(201,169,110,0.2)" }}>
                      <p className="text-[10px] mb-1" style={{ color: "var(--gold)" }}>今日のアクション</p>
                      <p className="text-xs text-white/80">{result.action}</p>
                    </div>
                    <div className="p-3 rounded-xl border text-center" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(201,169,110,0.15)" }}>
                      <p className="text-[10px] mb-1" style={{ color: "var(--gold)" }}>ラッキーアイテム</p>
                      <p className="text-xs text-white/80">{result.luckyItem}</p>
                    </div>
                  </div>
                </FadeIn>

                {/* Upsell */}
                <FadeIn delay={3.5}>
                  <ChatBubble
                    characterImage={charConfig.image}
                    characterName={charConfig.name}
                    text="…もっと詳しく知りたい？6000文字のレポートがある。書いてこようか？ ¥200だけど。"
                    speed={30}
                  />
                  <div className="flex gap-2 ml-13 mt-2">
                    <button
                      onClick={() => {
                        fetch("/api/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ mode: "full", ref: ref || "direct" }),
                        }).then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; });
                      }}
                      className="flex-1 py-2.5 rounded-full text-sm font-medium text-white transition-all"
                      style={{ background: "var(--gold)" }}
                    >
                      ¥200で詳しく
                    </button>
                    <button onClick={handleShare} className="flex-1 py-2.5 rounded-full text-sm text-white/60 border transition-all" style={{ borderColor: "rgba(201,169,110,0.3)" }}>
                      結果を共有
                    </button>
                  </div>
                  <button
                    onClick={() => { setStep("intro"); setName(""); setYear(""); setMonth(0); setDay(0); setResult(null); setCharacter(null); setTimeout(() => setStep("char_select"), 1500); }}
                    className="w-full mt-3 py-2 text-[11px] text-white/30 hover:text-white/50 transition-colors"
                  >
                    もう一度やる
                  </button>
                </FadeIn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {["intro", "char_select", "result"].includes(step) && (
          <FadeIn delay={step === "intro" ? 1.5 : 0.5}>
            <footer className="text-center text-[11px] text-white/20 pb-6 space-y-1">
              <p>&copy; 2026 星の図書館 · Produced by SATOYAMA AI BASE</p>
              <p>
                <a href="/legal" className="hover:text-white/40 transition-colors">特定商取引法に基づく表記</a>
                {" · "}
                <a href="/privacy" className="hover:text-white/40 transition-colors">プライバシーポリシー</a>
              </p>
            </footer>
          </FadeIn>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white shadow-lg z-50"
              style={{ background: "var(--gold)" }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function LoadingText({ stages }: { stages: { text: string; delay: number }[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timers = stages.map((stage, i) => {
      if (i === 0) return null;
      return setTimeout(() => setIndex(i), stage.delay);
    });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [stages]);
  return (
    <motion.p key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-white/70">
      {stages[index]?.text}
    </motion.p>
  );
}
