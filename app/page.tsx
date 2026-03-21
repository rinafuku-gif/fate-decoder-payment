"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Aurora from "@/components/Aurora";
import StarField from "@/components/StarField";
import GrainOverlay from "@/components/GrainOverlay";
import TouchParticles from "@/components/TouchParticles";
import ChatBubble from "@/components/ChatBubble";
import FadeIn from "@/components/FadeIn";
import SoundToggle, { playTap, playTransition, playReveal } from "@/components/Sound";
import { CHARACTER_CONFIG, type Character } from "@/lib/character";
import { calculateAll } from "@/lib/fortune-calc";
import { generateFortune } from "@/app/actions";

type Step = "intro" | "char_select" | "ask_name" | "ask_birthday" | "loading" | "result";

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
  const [loadingStage, setLoadingStage] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r) { setRef(r); sessionStorage.setItem("fd_ref", r); }
    else { const s = sessionStorage.getItem("fd_ref"); if (s) setRef(s); }
  }, []);

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 20);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 20);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  const charConfig = character ? CHARACTER_CONFIG[character] : null;
  const onBubbleDone = useCallback(() => setInputReady(true), []);
  const go = useCallback((s: Step) => { setInputReady(false); setStep(s); playTransition(); }, []);

  // Diagnosis
  const runDiagnosis = useCallback(async () => {
    if (!character) return;
    try {
      const data = calculateAll(parseInt(year), parseInt(month), parseInt(day));
      const config = CHARACTER_CONFIG[character];
      const prompt = `${config.promptStyle}\n\n以下の人物の6占術データから、あなた（${config.name}）の口調で診断結果を書いてください。\n【対象者】${name} (${year}年${month}月${day}日生まれ)\n【占術データ】マヤ暦:KIN${data.maya.kin}/紋章:${data.maya.glyph}/音:${data.maya.tone}/WS:${data.maya.ws} 算命学:[${data.bazi.weapon}] 四柱推命:年柱[${data.sanmeigaku.year}]/月柱[${data.sanmeigaku.month}]/日柱[${data.sanmeigaku.day}]/日干[${data.bazi.stem}] 数秘:LP${data.numerology.lp} 西洋:${data.western.sign} 宿曜:${data.sukuyo}\n【出力】JSON: {"oneWord":"8-15文字","personality":"200-300文字","relationships":"200-300文字","talent":"200-300文字","action":"20-40文字","luckyItem":"具体的に"}`;
      let parsed: any = {};
      try {
        const text = await generateFortune(prompt);
        let c = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
        const f = c.indexOf("{"); if (f !== -1) c = c.substring(f);
        const l = c.lastIndexOf("}"); if (l !== -1) c = c.substring(0, l + 1);
        parsed = JSON.parse(c);
      } catch {
        parsed = { oneWord: "…面白い星の配置", personality: `…${data.maya.glyph}の紋章。芯が強い。`, relationships: `${data.western.sign}のあなたは深い絆を求める。`, talent: `「${data.bazi.weapon}」を持ってる。`, action: "…朝5分、深呼吸してみて", luckyItem: "温かい飲み物" };
      }
      fetch("/api/log-diagnosis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: ref || "direct", mode: "short", name, birthDate: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` }) }).catch(() => {});
      setResult({ ...parsed, data, name });
      setStep("result");
      playReveal();
    } catch { go("ask_name"); }
  }, [character, name, year, month, day, ref, go]);

  useEffect(() => {
    if (step === "loading") {
      runDiagnosis();
      const t1 = setTimeout(() => setLoadingStage(1), 3000);
      const t2 = setTimeout(() => setLoadingStage(2), 7000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else { setLoadingStage(0); }
  }, [step, runDiagnosis]);

  const handleShare = async () => {
    const t = `${result?.name}「${result?.oneWord}」\n\n星の図書館 で無料診断 →`;
    const url = window.location.origin + (ref ? `?ref=${ref}` : "");
    if (navigator.share) { try { await navigator.share({ title: "星の図書館", text: t, url }); } catch {} }
    else { try { await navigator.clipboard.writeText(`${t}\n${url}`); setToast("コピーしました"); setTimeout(() => setToast(null), 2000); } catch {} }
  };

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: "#0a0e1a" }}>
      <Aurora />
      <StarField />
      <GrainOverlay />
      <TouchParticles />
      <SoundToggle />

      <div className="relative z-20 max-w-lg mx-auto px-5 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col justify-center py-8">
          <AnimatePresence mode="wait">

            {/* ━━━ INTRO ━━━ */}
            {step === "intro" && (
              <motion.div key="intro" exit={{ opacity: 0, scale: 0.95 }} className="text-center">
                {/* Kinetic typography title */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  className="mb-6"
                >
                  <motion.h1
                    className="text-5xl sm:text-7xl font-bold tracking-tight mb-3"
                    style={{
                      fontFamily: "var(--font-serif), serif",
                      background: "linear-gradient(135deg, #fff 0%, var(--gold) 50%, #fff 100%)",
                      backgroundSize: "200% 200%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: "shimmer 3s ease-in-out infinite",
                    }}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                  >
                    星の図書館
                  </motion.h1>
                  <motion.p
                    className="text-white/40 text-sm tracking-widest"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    うららとれきが、あなたの星を読み解く
                  </motion.p>
                  <motion.p
                    className="text-xs mt-2 tracking-[0.3em]"
                    style={{ color: "var(--gold)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 1.5 }}
                  >
                    6 DIVINATIONS × AI
                  </motion.p>
                </motion.div>

                {/* Enter button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(201,169,110,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playTap(); go("char_select"); }}
                  className="mx-auto px-8 py-3 rounded-full text-sm font-medium text-white border"
                  style={{ borderColor: "rgba(201,169,110,0.4)", background: "rgba(201,169,110,0.1)" }}
                >
                  図書館に入る
                </motion.button>
              </motion.div>
            )}

            {/* ━━━ CHAR SELECT ━━━ */}
            {step === "char_select" && (
              <motion.div key="cs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
                <motion.p
                  className="text-center text-white/40 text-sm mb-8 tracking-wide"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  …どっちに読んでもらう？
                </motion.p>
                <div className="grid grid-cols-2 gap-5">
                  {(["urara", "reki"] as Character[]).map((c, i) => {
                    const cfg = CHARACTER_CONFIG[c];
                    return (
                      <motion.button
                        key={c}
                        initial={{ opacity: 0, y: 30, rotateY: -10 }}
                        animate={{ opacity: 1, y: 0, rotateY: 0 }}
                        transition={{ delay: 0.3 + i * 0.2, type: "spring", stiffness: 100 }}
                        whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(201,169,110,0.15)" }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { playTap(); setCharacter(c); go("ask_name"); }}
                        className="rounded-2xl overflow-hidden group"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(201,169,110,0.15)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                        }}
                      >
                        <div className="aspect-[3/4] overflow-hidden relative">
                          {cfg.videoIdle ? (
                            <video src={cfg.videoIdle} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <Image src={cfg.image} alt={cfg.name} width={382} height={510} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" />
                          )}
                          {/* Hover glow overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-base font-bold text-white">{cfg.name}</p>
                            <p className="text-[11px] text-white/50">{cfg.description}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ━━━ ASK NAME ━━━ */}
            {step === "ask_name" && charConfig && (
              <motion.div key="name" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <ChatBubble characterImage={charConfig.image} characterName={charConfig.name} characterVideo={charConfig.videoTalk} text="…名前、教えてくれる？" onComplete={onBubbleDone} />
                <AnimatePresence>
                  {inputReady && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mt-4 ml-13">
                      <input
                        type="text" value={name} onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { playTap(); go("ask_birthday"); } }}
                        placeholder="ニックネームでOK" autoFocus
                        className="w-full px-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-1"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,169,110,0.2)",  }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(201,169,110,0.2)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { if (name.trim()) { playTap(); go("ask_birthday"); } }}
                        disabled={!name.trim()}
                        className="mt-3 w-full py-3 rounded-full text-sm font-medium text-white disabled:opacity-20 transition-all"
                        style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.6), rgba(201,169,110,0.3))", border: "1px solid rgba(201,169,110,0.3)" }}
                      >
                        次へ
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ━━━ ASK BIRTHDAY ━━━ */}
            {step === "ask_birthday" && charConfig && (
              <motion.div key="bday" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <ChatBubble characterImage={charConfig.image} characterName={charConfig.name} characterVideo={charConfig.videoTalk} text={`…ありがとう、${name}。生年月日を教えてくれる？`} onComplete={onBubbleDone} />
                <AnimatePresence>
                  {inputReady && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mt-4 ml-13">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { val: year, set: (v: string) => setYear(v), opts: Array.from({ length: 80 }, (_, i) => ({ v: String(2010 - i), l: `${2010 - i}年` })) },
                          { val: month, set: (v: string) => setMonth(v), opts: Array.from({ length: 12 }, (_, i) => ({ v: String(i + 1), l: `${i + 1}月` })) },
                          { val: day, set: (v: string) => setDay(v), opts: Array.from({ length: 31 }, (_, i) => ({ v: String(i + 1), l: `${i + 1}日` })) },
                        ].map((sel, idx) => (
                          <select
                            key={idx} value={sel.val} onChange={(e) => sel.set(e.target.value)}
                            className="px-2 py-3.5 rounded-2xl text-sm text-white text-center outline-none appearance-none"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,169,110,0.2)" }}
                          >
                            {sel.opts.map((o) => (
                              <option key={o.v} value={o.v} className="bg-[#0a0e1a] text-white">{o.l}</option>
                            ))}
                          </select>
                        ))}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(201,169,110,0.2)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { playTap(); setStep("loading"); }}
                        className="w-full py-3 rounded-full text-sm font-medium text-white transition-all"
                        style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.6), rgba(201,169,110,0.3))", border: "1px solid rgba(201,169,110,0.3)" }}
                      >
                        …読んでくる
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ━━━ LOADING ━━━ */}
            {step === "loading" && charConfig && (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="text-center">
                {charConfig.videoSearch ? (
                  /* Full-width search video */
                  <div className="rounded-2xl overflow-hidden mb-8 mx-auto max-w-sm" style={{ border: "1px solid rgba(201,169,110,0.2)", boxShadow: "0 0 60px rgba(201,169,110,0.1)" }}>
                    <video src={charConfig.videoSearch} autoPlay loop muted playsInline className="w-full h-auto" />
                  </div>
                ) : (
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                    <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-8" style={{ border: "2px solid rgba(201,169,110,0.5)", boxShadow: "0 0 60px rgba(201,169,110,0.2)" }}>
                      <Image src={charConfig.image} alt={charConfig.name} width={224} height={224} className="object-cover w-full h-full" />
                    </div>
                  </motion.div>
                )}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStage}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-white/60"
                  >
                    {[charConfig.loadingText, "…星の記録を照合してる", "…もう少しだけ待ってて"][loadingStage]}
                  </motion.p>
                </AnimatePresence>
                {/* Animated rings */}
                <div className="relative w-16 h-16 mx-auto mt-8">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border"
                      style={{ borderColor: "rgba(201,169,110,0.2)" }}
                      animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ━━━ RESULT ━━━ */}
            {step === "result" && result && charConfig && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
                <ChatBubble characterImage={charConfig.image} characterName={charConfig.name} characterVideo={charConfig.videoTalk} text={`…${result.name}の本、見つけてきたよ。`} speed={35} />

                {/* oneWord — hero card */}
                <FadeIn delay={1.5}>
                  <motion.div
                    className="text-center mb-8 p-6 rounded-3xl relative overflow-hidden"
                    style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.2)" }}
                    whileHover={{ boxShadow: "0 0 40px rgba(201,169,110,0.15)" }}
                  >
                    <p className="text-[11px] text-white/30 mb-2 tracking-widest uppercase">Your Keyword</p>
                    <motion.p
                      className="text-2xl sm:text-3xl font-bold"
                      style={{
                        fontFamily: "var(--font-serif), serif",
                        background: "linear-gradient(135deg, #fff, var(--gold))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 2.0, type: "spring", stiffness: 100 }}
                    >
                      {result.oneWord}
                    </motion.p>
                  </motion.div>
                </FadeIn>

                {/* Bento grid — data */}
                <FadeIn delay={2.0}>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {[
                      { label: "星座", value: result.data.western.sign, span: "" },
                      { label: "KIN", value: result.data.maya.kin, span: "" },
                      { label: "LP", value: result.data.numerology.lp, span: "" },
                      { label: "太陽の紋章", value: result.data.maya.glyph, span: "col-span-2" },
                      { label: "中心星", value: result.data.bazi.weapon, span: "" },
                    ].map((d, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.2 + i * 0.08 }}
                        className={`text-center p-3 rounded-2xl ${d.span}`}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.1)" }}
                      >
                        <p className="text-[10px] text-white/25 mb-0.5">{d.label}</p>
                        <p className="text-sm font-medium text-white/80">{d.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </FadeIn>

                {/* Readings */}
                <FadeIn delay={2.5}>
                  <div className="space-y-4 mb-6">
                    {[
                      { title: "性格の核心", text: result.personality },
                      { title: "人間関係", text: result.relationships },
                      { title: "才能・仕事", text: result.talent },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2.7 + i * 0.15 }}
                        className="border-l-2 pl-4 py-2"
                        style={{ borderLeftColor: "rgba(201,169,110,0.4)" }}
                      >
                        <h3 className="text-xs font-bold text-white/50 mb-1 tracking-wide">{s.title}</h3>
                        <p className="text-sm text-white/75 leading-relaxed">{s.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </FadeIn>

                {/* Action & Lucky */}
                <FadeIn delay={3.0}>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {[
                      { label: "今日のアクション", value: result.action },
                      { label: "ラッキーアイテム", value: result.luckyItem },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-2xl text-center" style={{ background: "rgba(201,169,110,0.04)", border: "1px solid rgba(201,169,110,0.1)" }}>
                        <p className="text-[10px] text-white/25 mb-1">{item.label}</p>
                        <p className="text-xs text-white/70">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </FadeIn>

                {/* Upsell */}
                <FadeIn delay={3.5}>
                  <ChatBubble characterImage={charConfig.image} characterName={charConfig.name} characterVideo={charConfig.videoTalk} text="…もっと詳しく知りたい？6000文字のレポートがある。書いてこようか？ ¥200だけど。" speed={28} />
                  <div className="flex gap-2 ml-13 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(201,169,110,0.2)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "full", ref: ref || "direct" }) })
                          .then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; });
                      }}
                      className="flex-1 py-3 rounded-full text-sm font-medium text-white"
                      style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.5), rgba(201,169,110,0.25))", border: "1px solid rgba(201,169,110,0.3)" }}
                    >
                      ¥200で詳しく
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleShare}
                      className="flex-1 py-3 rounded-full text-sm text-white/50 border"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      結果を共有
                    </motion.button>
                  </div>
                  <button
                    onClick={() => { setStep("intro"); setName(""); setResult(null); setCharacter(null); }}
                    className="w-full mt-4 py-2 text-[11px] text-white/20 hover:text-white/40 transition-colors"
                  >
                    もう一度やる
                  </button>
                </FadeIn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {["intro", "result"].includes(step) && (
          <FadeIn delay={step === "intro" ? 2.5 : 4.0}>
            <footer className="text-center text-[11px] text-white/15 pb-6 space-y-1">
              <p>&copy; 2026 星の図書館 · Produced by SATOYAMA AI BASE</p>
              <p>
                <a href="/legal" className="hover:text-white/30 transition-colors">特定商取引法に基づく表記</a>
                {" · "}
                <a href="/privacy" className="hover:text-white/30 transition-colors">プライバシーポリシー</a>
              </p>
            </footer>
          </FadeIn>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm text-white shadow-lg z-50"
              style={{ background: "rgba(201,169,110,0.8)", backdropFilter: "blur(8px)" }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shimmer keyframe for kinetic typography */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </main>
  );
}
