"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import StarField from "@/components/StarField";
import ChatBubble from "@/components/ChatBubble";
import ProgressBar from "@/components/ProgressBar";
import FadeIn from "@/components/FadeIn";
import { CHARACTER_CONFIG, type Character } from "@/lib/character";
import { calculateAll } from "@/lib/fortune-calc";
import { generateFortune } from "@/app/actions";

type Step = "intro" | "char_select" | "ask_name" | "ask_birthday" | "loading" | "result";
const STEP_TOTAL = 3;
function stepNum(s: Step): number {
  const map: Record<string, number> = { char_select: 1, ask_name: 2, ask_birthday: 3 };
  return map[s] || 0;
}

export default function HomePage() {
  const [step, setStep] = useState<Step>("intro");
  const [character, setCharacter] = useState<Character | null>(null);
  const [name, setName] = useState("");
  const [year, setYear] = useState("1995");
  const [month, setMonth] = useState("1");
  const [day, setDay] = useState("1");
  const [inputReady, setInputReady] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r) { setRef(r); sessionStorage.setItem("fd_ref", r); }
    else { const s = sessionStorage.getItem("fd_ref"); if (s) setRef(s); }
    const timer = setTimeout(() => setStep("char_select"), 2500);
    return () => clearTimeout(timer);
  }, []);

  const charConfig = character ? CHARACTER_CONFIG[character] : null;
  const onBubbleDone = useCallback(() => setInputReady(true), []);
  const go = useCallback((s: Step) => { setInputReady(false); setStep(s); }, []);

  // Run diagnosis
  const runDiagnosis = useCallback(async () => {
    if (!character) return;
    try {
      const data = calculateAll(parseInt(year), parseInt(month), parseInt(day));
      const config = CHARACTER_CONFIG[character];
      const prompt = `${config.promptStyle}

以下の人物の6占術データから、あなた（${config.name}）の口調で診断結果を書いてください。
【対象者】${name} (${year}年${month}月${day}日生まれ)
【占術データ】マヤ暦:KIN${data.maya.kin}/紋章:${data.maya.glyph}/音:${data.maya.tone}/WS:${data.maya.ws} 算命学:[${data.bazi.weapon}] 四柱推命:年柱[${data.sanmeigaku.year}]/月柱[${data.sanmeigaku.month}]/日柱[${data.sanmeigaku.day}]/日干[${data.bazi.stem}] 数秘:LP${data.numerology.lp} 西洋:${data.western.sign} 宿曜:${data.sukuyo}
【出力】JSON: {"oneWord":"8-15文字","personality":"200-300文字","relationships":"200-300文字","talent":"200-300文字","action":"20-40文字","luckyItem":"具体的に"}`;

      let parsed: any = {};
      try {
        const text = await generateFortune(prompt);
        let c = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
        const f = c.indexOf("{"); if (f !== -1) c = c.substring(f);
        const l = c.lastIndexOf("}"); if (l !== -1) c = c.substring(0, l + 1);
        parsed = JSON.parse(c);
      } catch {
        parsed = { oneWord: "…面白い星の配置", personality: `…${data.maya.glyph}の紋章。芯が強いタイプだと思う。`, relationships: `${data.western.sign}のあなたは深い絆を求めるタイプ。`, talent: `「${data.bazi.weapon}」を持ってる。本質を見抜く力がある。`, action: "…朝5分、窓を開けて深呼吸してみて", luckyItem: "温かい飲み物" };
      }

      fetch("/api/log-diagnosis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: ref || "direct", mode: "short", name, birthDate: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` }) }).catch(() => {});

      setResult({ ...parsed, data, name });
      setStep("result");
    } catch { go("ask_name"); }
  }, [character, name, year, month, day, ref, go]);

  useEffect(() => { if (step === "loading") runDiagnosis(); }, [step, runDiagnosis]);

  const handleShare = async () => {
    const t = `${result?.name}「${result?.oneWord}」\n\n星の図書館 で無料診断 →`;
    const url = window.location.origin + (ref ? `?ref=${ref}` : "");
    if (navigator.share) { try { await navigator.share({ title: "星の図書館", text: t, url }); } catch {} }
    else { try { await navigator.clipboard.writeText(`${t}\n${url}`); setToast("コピーしました"); setTimeout(() => setToast(null), 2000); } catch {} }
  };

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: "var(--navy)" }}>
      <StarField />
      <div className="relative z-10 max-w-lg mx-auto px-5 min-h-screen flex flex-col">

        {!["intro", "loading", "result"].includes(step) && (
          <div className="pt-4 pb-2"><ProgressBar current={stepNum(step)} total={STEP_TOTAL} /></div>
        )}

        <div className="flex-1 flex flex-col justify-center py-6">
          <AnimatePresence mode="wait">

            {/* INTRO */}
            {step === "intro" && (
              <motion.div key="intro" exit={{ opacity: 0 }} className="text-center">
                <motion.h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
                  星の図書館
                </motion.h1>
                <motion.p className="text-sm text-white/50 mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  うららとれきが、あなたの星を読み解く
                </motion.p>
                <motion.p className="text-xs" style={{ color: "var(--gold)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                  6つの占術 × AI
                </motion.p>
                <motion.div className="flex justify-center gap-1 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* CHAR SELECT */}
            {step === "char_select" && (
              <motion.div key="cs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-center text-white/50 text-sm mb-6">…どっちに読んでもらう？</p>
                <div className="grid grid-cols-2 gap-4">
                  {(["urara", "reki"] as Character[]).map((c, i) => {
                    const cfg = CHARACTER_CONFIG[c];
                    const img = c === "urara" ? "/urara-full.png" : "/reki-full.png";
                    return (
                      <motion.button key={c} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setCharacter(c); go("ask_name"); }}
                        className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(201,169,110,0.3)" }}>
                        <motion.div className="aspect-square overflow-hidden" animate={{ y: [0, -4, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}>
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

            {/* ASK NAME */}
            {step === "ask_name" && charConfig && (
              <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatBubble characterImage={charConfig.image} characterName={charConfig.name} text="…名前、教えてくれる？" onComplete={onBubbleDone} />
                {inputReady && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-13">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) go("ask_birthday"); }} placeholder="ニックネームでOK" autoFocus
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,169,110,0.3)" }} />
                    <button onClick={() => { if (name.trim()) go("ask_birthday"); }} disabled={!name.trim()} className="mt-2 w-full py-2.5 rounded-full text-sm font-medium text-white disabled:opacity-30" style={{ background: "var(--gold)" }}>
                      次へ
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ASK BIRTHDAY — 1画面にセレクト3つ */}
            {step === "ask_birthday" && charConfig && (
              <motion.div key="bday" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatBubble characterImage={charConfig.image} characterName={charConfig.name} text={`…ありがとう、${name}。生年月日を教えてくれる？`} onComplete={onBubbleDone} />
                {inputReady && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-13">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <select value={year} onChange={(e) => setYear(e.target.value)} className="px-2 py-3 rounded-xl text-sm text-white text-center outline-none appearance-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,169,110,0.3)" }}>
                        {Array.from({ length: 80 }, (_, i) => 2010 - i).map((y) => (
                          <option key={y} value={y} className="bg-gray-800 text-white">{y}年</option>
                        ))}
                      </select>
                      <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-2 py-3 rounded-xl text-sm text-white text-center outline-none appearance-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,169,110,0.3)" }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m} className="bg-gray-800 text-white">{m}月</option>
                        ))}
                      </select>
                      <select value={day} onChange={(e) => setDay(e.target.value)} className="px-2 py-3 rounded-xl text-sm text-white text-center outline-none appearance-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,169,110,0.3)" }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d} className="bg-gray-800 text-white">{d}日</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => setStep("loading")} className="w-full py-2.5 rounded-full text-sm font-medium text-white" style={{ background: "var(--gold)" }}>
                      …読んでくる
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* LOADING */}
            {step === "loading" && charConfig && (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-2" style={{ borderColor: "var(--gold)", boxShadow: "0 0 40px rgba(201,169,110,0.25)" }}>
                    <Image src={charConfig.image} alt={charConfig.name} width={192} height={192} className="object-cover w-full h-full" />
                  </div>
                </motion.div>
                <LoadingText stages={[
                  { text: charConfig.loadingText, delay: 0 },
                  { text: "…星の記録を照合してる", delay: 4000 },
                  { text: "…もう少しだけ待ってて", delay: 8000 },
                ]} />
                <div className="flex justify-center gap-1.5 mt-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--gold)" }} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* RESULT */}
            {step === "result" && result && charConfig && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
                <ChatBubble characterImage={charConfig.image} characterName={charConfig.name} text={`…${result.name}の本、見つけてきたよ。`} speed={35} />

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

                <FadeIn delay={3.5}>
                  <ChatBubble characterImage={charConfig.image} characterName={charConfig.name} text="…もっと詳しく知りたい？6000文字のレポートがある。書いてこようか？ ¥200だけど。" speed={30} />
                  <div className="flex gap-2 ml-13 mt-2">
                    <button onClick={() => {
                      fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "full", ref: ref || "direct" }) })
                        .then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; });
                    }} className="flex-1 py-2.5 rounded-full text-sm font-medium text-white" style={{ background: "var(--gold)" }}>
                      ¥200で詳しく
                    </button>
                    <button onClick={handleShare} className="flex-1 py-2.5 rounded-full text-sm text-white/60 border" style={{ borderColor: "rgba(201,169,110,0.3)" }}>
                      結果を共有
                    </button>
                  </div>
                  <button onClick={() => { setStep("intro"); setName(""); setResult(null); setCharacter(null); setTimeout(() => setStep("char_select"), 1500); }}
                    className="w-full mt-3 py-2 text-[11px] text-white/30 hover:text-white/50">もう一度やる</button>
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
                <a href="/legal" className="hover:text-white/40">特定商取引法に基づく表記</a>
                {" · "}
                <a href="/privacy" className="hover:text-white/40">プライバシーポリシー</a>
              </p>
            </footer>
          </FadeIn>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white shadow-lg z-50" style={{ background: "var(--gold)" }}>
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
    const timers = stages.map((s, i) => i === 0 ? null : setTimeout(() => setIndex(i), s.delay));
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [stages]);
  return <motion.p key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-white/70">{stages[index]?.text}</motion.p>;
}
