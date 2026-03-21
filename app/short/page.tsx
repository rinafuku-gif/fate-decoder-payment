"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import FadeIn from "@/components/FadeIn";
import { calculateAll, type FortuneResult } from "@/lib/fortune-calc";
import { generateFortune } from "@/app/actions";
import { CHARACTER_CONFIG, type Character } from "@/lib/character";

function LoadingText({ stages }: { stages: { text: string; delay: number }[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timers = stages.map((stage, i) => {
      if (i === 0) return null;
      return setTimeout(() => setIndex(i), stage.delay);
    });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [stages]);
  return <p className="text-sm text-white/80">{stages[index]?.text}</p>;
}

export default function ShortPage() {
  const router = useRouter();
  const [ref, setRef] = useState<string | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [screen, setScreen] = useState<"select" | "input" | "loading" | "result">("select");
  const [form, setForm] = useState({ name: "", year: "", month: "1", day: "1" });
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string; data: FortuneResult; oneWord: string;
    personality: string; relationships: string; talent: string;
    action: string; luckyItem: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref") || sessionStorage.getItem("fd_ref");
    if (r) setRef(r);
  }, []);

  const charConfig = character ? CHARACTER_CONFIG[character] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.year || !character) return;
    setScreen("loading");

    try {
      const data = calculateAll(parseInt(form.year), parseInt(form.month), parseInt(form.day));
      const config = CHARACTER_CONFIG[character];

      const prompt = `
${config.promptStyle}

以下の人物の6占術データから、あなた（${config.name}）の口調・性格で診断結果を書いてください。

【対象者】
${form.name} (${form.year}年${form.month}月${form.day}日生まれ)

【占術データ】
・マヤ暦: KIN${data.maya.kin} / 太陽の紋章:${data.maya.glyph} / 銀河の音:${data.maya.tone} / ウェイブスペル:${data.maya.ws}
・算命学: 中心星[${data.bazi.weapon}]
・四柱推命: 年柱[${data.sanmeigaku.year}] / 月柱[${data.sanmeigaku.month}] / 日柱[${data.sanmeigaku.day}] / 日干[${data.bazi.stem}]
・数秘術: ライフパスナンバー[${data.numerology.lp}]
・西洋占星術: ${data.western.sign}
・宿曜: ${data.sukuyo}

【執筆ルール】
1. personality: 200〜300文字。占術データを2つ以上引用。${config.name}の口調で
2. relationships: 200〜300文字。恋愛・友人関係の特徴を${config.name}の口調で
3. talent: 200〜300文字。才能・仕事の特徴を${config.name}の口調で
4. oneWord: この人を一言で表す言葉。8〜15文字。${config.name}らしい表現で
5. action: 今日からできる具体的なアクション。${config.name}が軽く勧める感じで
6. luckyItem: ラッキーアイテム
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
          personality: `…あなたの紋章、${data.maya.glyph}だった。ライフパスナンバーは${data.numerology.lp}。穏やかに見えて、中身はかなり芯が強いタイプだと思う。自分でも気づいてるんじゃないかな。`,
          relationships: `${data.western.sign}のあなたは、人間関係で深い絆を求めるタイプ。…広く浅くより、本音で話せる少人数のほうが居心地いいんじゃない？`,
          talent: `算命学の「${data.bazi.weapon}」を持ってるから、本質を見抜く力がある。…まあ、活かせる場所を見つけられるかどうかだけど。`,
          action: "…とりあえず、朝5分だけ窓を開けて深呼吸してみて",
          luckyItem: "温かい飲み物",
        };
      }

      // DB記録
      fetch("/api/log-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: ref || "direct", mode: "short", name: form.name,
          birthDate: `${form.year}-${String(parseInt(form.month)).padStart(2, "0")}-${String(parseInt(form.day)).padStart(2, "0")}`,
        }),
      }).catch(() => {});

      setResult({
        name: form.name, data,
        oneWord: parsed.oneWord || "…なかなか面白い星の配置",
        personality: parsed.personality || "",
        relationships: parsed.relationships || "",
        talent: parsed.talent || "",
        action: parsed.action || "…朝5分だけ窓を開けて深呼吸してみて",
        luckyItem: parsed.luckyItem || "温かい飲み物",
      });
      setScreen("result");
      window.scrollTo(0, 0);
    } catch {
      alert("診断中にエラーが発生しました。もう一度お試しください。");
      setScreen("input");
    }
  };

  const handleShare = async () => {
    const text = `${result?.name}の診断結果「${result?.oneWord}」\n\nうらら で無料診断 →`;
    const url = window.location.origin + (ref ? `?ref=${ref}` : "");
    if (navigator.share) {
      try { await navigator.share({ title: "うらら", text, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(`${text}\n${url}`); setToast("コピーしました"); setTimeout(() => setToast(null), 2000); } catch {}
    }
  };

  // Character select
  if (screen === "select") {
    return (
      <main className="min-h-screen relative overflow-hidden" style={{ background: "var(--navy)" }}>
        <StarField />
        <div className="relative z-10 max-w-lg mx-auto px-5 py-8">
          <button onClick={() => router.push(ref ? `/?ref=${ref}` : "/")} className="text-sm text-white/40 hover:text-white/70 mb-4 inline-block">← 戻る</button>
          <FadeIn delay={0.2}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1 text-white">ショート診断</h1>
              <p className="text-xs text-white/50">…どっちに読んでもらう？</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-2 gap-4">
            {(["urara", "reki"] as Character[]).map((c, i) => {
              const cfg = CHARACTER_CONFIG[c];
              const fullImg = c === "urara" ? "/urara-full.png" : "/reki-full.png";
              return (
                <motion.button
                  key={c}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.2 }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setCharacter(c); setScreen("input"); }}
                  className="rounded-2xl border overflow-hidden text-center"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(201,169,110,0.3)" }}
                >
                  <motion.div
                    className="w-full aspect-square overflow-hidden"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                  >
                    <Image src={fullImg} alt={cfg.name} width={382} height={382} className="object-cover w-full h-full" />
                  </motion.div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-white">{cfg.name}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{cfg.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <FadeIn delay={0.8}>
            <p className="text-center text-[11px] text-white/30 mt-6">無料 — 3分であなたの本質を読み解く</p>
          </FadeIn>
        </div>
      </main>
    );
  }

  // Loading — 星の図書館演出
  if (screen === "loading" && charConfig) {
    const fullImg = character === "urara" ? "/urara-full.png" : "/reki-full.png";
    const LoadingMotion = require("framer-motion").motion;
    const LoadingStarField = require("@/components/StarField").default;
    const stages = [
      { text: charConfig.loadingText, delay: 0 },
      { text: "…星の記録を照合してる", delay: 4000 },
      { text: "…もう少しだけ待ってて", delay: 8000 },
    ];
    return (
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--navy)" }}>
        <LoadingStarField />
        <div className="relative z-10 text-center px-6">
          <LoadingMotion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-2" style={{ borderColor: "var(--gold)", boxShadow: "0 0 30px rgba(201,169,110,0.3)" }}>
              <Image src={fullImg} alt={charConfig.name} width={192} height={192} className="object-cover w-full h-full" />
            </div>
          </LoadingMotion.div>
          <LoadingMotion.div
            key="loading-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingText stages={stages} />
          </LoadingMotion.div>
          <div className="flex justify-center gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <LoadingMotion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--gold)" }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Result
  if (screen === "result" && result && charConfig) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-lg mx-auto px-5 py-8">
          <header className="text-center mb-6">
            <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 border-2" style={{ borderColor: "var(--gold-light)" }}>
              <Image src={charConfig.image} alt={charConfig.name} width={112} height={112} className="object-cover w-full h-full" />
            </div>
            <p className="text-xs text-gray-400 mb-1">{charConfig.name}が読み解いた</p>
            <h1 className="text-lg font-bold" style={{ color: "var(--navy)" }}>{result.name} の診断結果</h1>
          </header>

          <div className="text-center mb-6 p-4 rounded-2xl border" style={{ background: "var(--cream)", borderColor: "var(--gold-light)" }}>
            <p className="text-[11px] text-gray-400 mb-1">あなたを一言で</p>
            <p className="text-base font-bold" style={{ color: "var(--navy)" }}>{result.oneWord}</p>
          </div>

          {/* Data grid */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: "星座", value: result.data.western.sign },
              { label: "KIN", value: result.data.maya.kin },
              { label: "LP", value: result.data.numerology.lp },
              { label: "紋章", value: result.data.maya.glyph },
              { label: "中心星", value: result.data.bazi.weapon },
              { label: "宿曜", value: result.data.sukuyo },
            ].map((d, i) => (
              <div key={i} className="text-center p-2 rounded-xl border" style={{ background: "var(--warm-white)", borderColor: "var(--gold-light)" }}>
                <p className="text-[10px]" style={{ color: "var(--gold)" }}>{d.label}</p>
                <p className="text-xs font-medium" style={{ color: "var(--navy)" }}>{d.value}</p>
              </div>
            ))}
          </div>

          {/* Readings */}
          <div className="space-y-4 mb-6">
            {[
              { title: "性格の核心", text: result.personality },
              { title: "人間関係", text: result.relationships },
              { title: "才能・仕事", text: result.talent },
            ].map((section, i) => (
              <div key={i} className="border-l-3 pl-4 py-2" style={{ borderLeftColor: "var(--gold)" }}>
                <h3 className="text-sm font-bold mb-1" style={{ color: "var(--navy)" }}>{section.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-3 rounded-xl border text-center" style={{ background: "var(--cream)", borderColor: "var(--gold-light)" }}>
              <p className="text-[10px] mb-1" style={{ color: "var(--gold)" }}>今日のアクション</p>
              <p className="text-xs text-gray-700">{result.action}</p>
            </div>
            <div className="p-3 rounded-xl border text-center" style={{ background: "var(--warm-white)", borderColor: "var(--gold-light)" }}>
              <p className="text-[10px] mb-1" style={{ color: "var(--gold)" }}>ラッキーアイテム</p>
              <p className="text-xs text-gray-700">{result.luckyItem}</p>
            </div>
          </div>

          {/* Upsell */}
          <div className="p-5 rounded-2xl border text-center mb-6" style={{ background: "var(--cream)", borderColor: "var(--gold-light)" }}>
            <p className="text-sm text-gray-600 mb-1">
              …もっと詳しく知りたいなら
            </p>
            <p className="text-xs text-gray-400 mb-3">
              フル鑑定（6000文字超）や相性占いもあるよ
            </p>
            <button
              onClick={() => router.push(ref ? `/?ref=${ref}` : "/")}
              className="px-6 py-2.5 rounded-full text-white text-sm font-medium transition-colors"
              style={{ background: "var(--navy)" }}
            >
              ¥200で詳しく鑑定する
            </button>
          </div>

          <div className="flex gap-3 no-print">
            <button onClick={() => router.push(ref ? `/?ref=${ref}` : "/")} className="flex-1 py-2.5 rounded-full border text-sm text-gray-600 hover:bg-gray-50" style={{ borderColor: "var(--gold-light)" }}>もう一度</button>
            <button onClick={handleShare} className="flex-1 py-2.5 rounded-full border text-sm transition-colors hover:opacity-80" style={{ borderColor: "var(--gold)", color: "var(--navy)" }}>結果を共有する</button>
          </div>

          {toast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white shadow-lg transition-opacity z-50" style={{ background: "var(--navy)" }}>
              {toast}
            </div>
          )}

          <footer className="text-center text-[11px] text-gray-400 mt-8">うらら — ショート診断</footer>
        </div>
      </main>
    );
  }

  // Input form
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-5 py-8">
        <button onClick={() => setScreen("select")} className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block" style={{ color: "var(--navy-light)" }}>← キャラ選択へ</button>

        <div className="text-center mb-6">
          {charConfig && (
            <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 border-2 border-indigo-100">
              <Image src={charConfig.image} alt={charConfig.name} width={56} height={56} className="object-cover object-top w-full h-full" />
            </div>
          )}
          <h1 className="text-xl font-bold text-[var(--navy)]">ショート診断</h1>
          <p className="text-xs text-gray-400 mt-1">…生年月日、教えてくれたら読んでくるよ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">お名前 <span className="text-rose-400 text-xs">必須</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ニックネームでOK" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold-light)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生年月日 <span className="text-rose-400 text-xs">必須</span></label>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="1995" required className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-[var(--gold)]" />
              <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-[var(--gold)]">
                {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}月</option>))}
              </select>
              <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-[var(--gold)]">
                {Array.from({ length: 31 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}日</option>))}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 rounded-full text-white font-medium text-sm transition-colors mt-2" style={{ background: "var(--gold)" }}>無料で診断する</button>
        </form>
      </div>
    </main>
  );
}
