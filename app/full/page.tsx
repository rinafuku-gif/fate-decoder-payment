"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { calculateAll } from "@/lib/fortune-calc";
import { generateFortune } from "@/app/actions";
import LibraryBg from "@/components/LibraryBg";
import GrainOverlay from "@/components/GrainOverlay";
import ShareCard from "@/components/ShareCard";

// テストモード: trueなら決済なしで鑑定可能。ローンチ時にfalseにする
// TODO: 本番リリース前にfalseに変更すること
const TEST_MODE = true;

type Step = "name" | "birthday" | "birthtime" | "birthplace" | "concern" | "confirm";

const STEPS: { id: Step; charLine: string }[] = [
  { id: "name", charLine: "…こんにちは。あなたの名前を教えてもらえる？" },
  { id: "birthday", charLine: "…ありがとう。次に、生年月日を教えて" },
  { id: "birthtime", charLine: "…出生時間がわかると、もっと深く読めるよ。わからなければ飛ばしてOK" },
  { id: "birthplace", charLine: "…生まれた場所も教えてくれる？ わからなければ飛ばして大丈夫" },
  { id: "concern", charLine: "…最後に、何か聞きたいことや気になっていることがあれば" },
  { id: "confirm", charLine: "…これでいい？ 準備ができたら、あなたの星の記録を探しに行くね" },
];

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default function FullPage() {
  const router = useRouter();
  const [ref, setRef] = useState<string | null>(null);
  const [verified, setVerified] = useState(TEST_MODE);
  const [step, setStep] = useState<Step>("name");
  const [screen, setScreen] = useState<"input" | "loading" | "result">("input");
  const [form, setForm] = useState({
    name: "", year: "", month: "1", day: "1",
    birthHour: "", birthPlace: "", concern: "",
  });
  const [resultHtml, setResultHtml] = useState("");
  const [resultMeta, setResultMeta] = useState<{ oneWord: string; bookTitle: string }>({ oneWord: "", bookTitle: "" });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("payment_token");
    const r = params.get("ref") || sessionStorage.getItem("fd_ref");
    if (r) setRef(r);
    if (TEST_MODE) return;
    if (t) {
      fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) setVerified(true);
          else router.push("/?error=invalid_token");
        })
        .catch(() => router.push("/?error=verification_failed"));
    } else {
      router.push("/?error=no_token");
    }
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);
  const currentCharLine = STEPS.find((s) => s.id === step)?.charLine || "";

  const nextStep = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const prevStep = () => {
    const idx = currentStepIndex;
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const canProceed = () => {
    switch (step) {
      case "name": return form.name.trim() !== "";
      case "birthday": return form.year !== "" && parseInt(form.year) > 1900;
      default: return true;
    }
  };

  const handleStartDiagnosis = async () => {
    if (!form.name || !form.year) return;
    setScreen("loading");

    try {
      const data = calculateAll(parseInt(form.year), parseInt(form.month), parseInt(form.day));
      const birthTimeInfo = form.birthHour ? `出生時間: ${form.birthHour}時` : "出生時間: 不明";
      const birthPlaceInfo = form.birthPlace || "未入力";

      const prompt = `
あなたは、複数の占術データを読み解いて「その人だけの性格分析レポート」を小説形式で書くライターです。
しいたけ占いのような親しみやすく温かい文体で、読者に深く寄り添うトーンで書いてください。

【対象者】
名前: ${form.name} (${form.year}年${form.month}月${form.day}日生まれ / ${birthPlaceInfo}出身 / ${birthTimeInfo})

【分析データ】
・マヤ暦: KIN${data.maya.kin} / 太陽の紋章:${data.maya.glyph} / 銀河の音:${data.maya.tone} / ウェイブスペル:${data.maya.ws}
・算命学: 中心星[${data.bazi.weapon}]
・四柱推命: 年柱[${data.sanmeigaku.year}] / 月柱[${data.sanmeigaku.month}] / 日柱[${data.sanmeigaku.day}] / 日干[${data.bazi.stem}]${form.birthHour ? ` / 時柱[${form.birthHour}時生まれ]` : ""}
・数秘術: ライフパスナンバー[${data.numerology.lp}]
・西洋占星術: ${data.western.sign}
・宿曜: ${data.sukuyo}

【相談内容】
「${form.concern || "特になし"}」

【執筆ルール】
1. 専門用語は必ず噛み砕いて説明
2. 「〜という感覚はありませんか？」のような共感・問いかけスタイル
3. 各章は800文字以上。全体で6000文字以上
4. 相談内容に合わせて3〜7章を柔軟に構成
5. 抽象的な表現を避け具体的なシーンを入れる
6. 6つの占術（マヤ暦・算命学・四柱推命・数秘術・西洋占星術・宿曜）を全て活用すること${form.birthHour ? "\n7. 出生時間が判明しているため、四柱推命の時柱の影響も読み解くこと" : ""}${form.birthPlace ? `\n${form.birthHour ? "8" : "7"}. 出生地（${form.birthPlace}）の土地のエネルギーも考慮すること` : ""}
${form.birthHour ? (form.birthPlace ? "9" : "8") : (form.birthPlace ? "8" : "7")}. **必ず純粋なJSON形式** で出力

{"prologue":{"tag":"#はじめに","title":"序章：（タイトル）","text":"（800文字以上）"},"chapters":[{"tag":"#占術名","title":"第1章：（テーマ）","text":"（800文字以上）"}],"final":{"tag":"#まとめ","title":"最終章：これからのあなたへ","text":"（800文字以上）","magic":"具体的なアクション"}}
`;
      const text = await generateFortune(prompt);
      let clean = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
      const first = clean.indexOf("{");
      if (first !== -1) clean = clean.substring(first);
      const last = clean.lastIndexOf("}");
      if (last !== -1) clean = clean.substring(0, last + 1);

      let story;
      try {
        story = JSON.parse(clean);
      } catch {
        let repaired = clean;
        const quotes = (repaired.match(/"/g) || []).length;
        if (quotes % 2 !== 0) repaired += '"';
        let braces = (repaired.match(/{/g) || []).length - (repaired.match(/}/g) || []).length;
        let brackets = (repaired.match(/\[/g) || []).length - (repaired.match(/]/g) || []).length;
        for (let i = 0; i < braces; i++) repaired += "}";
        for (let i = 0; i < brackets; i++) repaired += "]";
        repaired = repaired.replace(/,(\s*[\]}])/g, "$1");
        story = JSON.parse(repaired);
      }

      if (!story?.prologue) story.prologue = { tag: "#はじめに", title: "あなたの物語", text: "あなたの性格と運命の物語が始まります。" };
      if (!Array.isArray(story.chapters)) story.chapters = [];
      if (!story?.final) story.final = { tag: "#まとめ", title: "これからのあなたへ", text: "あなたの可能性は、あなた自身の選択で広がっていきます。", magic: "自分を信じて一歩踏み出す" };

      const safeName = escapeHtml(form.name);
      const renderSection = (part: { tag?: string; title?: string; text?: string }) => {
        if (!part) return "";
        return `<div class="mb-6 border-l-3 border-[rgba(201,169,110,0.3)] pl-4">
          <p class="text-xs text-[#c9a96e] mb-1">${escapeHtml(part.tag || "")}</p>
          <h3 class="text-base font-bold text-white/90 mb-2">${escapeHtml(part.title || "")}</h3>
          <p class="text-sm text-white/60 leading-relaxed whitespace-pre-line">${escapeHtml(part.text || "")}</p>
        </div>`;
      };

      const html = `
        <div class="max-w-lg mx-auto px-5 py-8">
          <header class="text-center mb-6">
            <p class="text-xs text-[#c9a96e] tracking-widest mb-1">星の図書館</p>
            <h1 class="text-xl font-bold text-white/90">${safeName} さんへのフル鑑定</h1>
            ${form.concern ? `<p class="text-xs text-white/40 mt-2">「${escapeHtml(form.concern)}」</p>` : ""}
          </header>
          <div class="grid grid-cols-3 gap-2 mb-6">
            ${[
              { l: "星座", v: data.western.sign },
              { l: "KIN", v: data.maya.kin },
              { l: "紋章", v: data.maya.glyph },
              { l: "LP", v: data.numerology.lp },
              { l: "中心星", v: data.bazi.weapon },
              { l: "宿曜", v: data.sukuyo },
              { l: "日柱", v: data.sanmeigaku.day },
              { l: "日干", v: data.bazi.stem },
              { l: "音", v: data.maya.tone },
            ].map(d => `<div class="text-center p-2 rounded-xl bg-white/5 border border-[rgba(201,169,110,0.15)]"><p class="text-[10px] text-white/40">${d.l}</p><p class="text-xs font-medium text-white/70">${d.v}</p></div>`).join("")}
          </div>
          ${renderSection(story.prologue)}
          ${story.chapters.map((c: { tag?: string; title?: string; text?: string }) => renderSection(c)).join("")}
          <div class="mb-6 border-l-3 border-[rgba(201,169,110,0.5)] pl-4">
            <p class="text-xs text-[#c9a96e] mb-1">${escapeHtml(story.final.tag || "#まとめ")}</p>
            <h3 class="text-base font-bold text-white/90 mb-2">${escapeHtml(story.final.title || "これからのあなたへ")}</h3>
            <p class="text-sm text-white/60 leading-relaxed whitespace-pre-line">${escapeHtml(story.final.text || "")}</p>
            ${story.final.magic ? `<div class="mt-3 p-3 rounded-xl bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.2)] text-center"><p class="text-[10px] text-[#c9a96e] mb-1">今日からできるアクション</p><p class="text-xs font-medium text-white/70">${escapeHtml(story.final.magic)}</p></div>` : ""}
          </div>
          <footer class="text-center text-xs text-white/20 mt-8">星の図書館 — Full Reading</footer>
        </div>
      `;

      setResultMeta({
        oneWord: story.prologue?.title || `${form.name}の物語`,
        bookTitle: story.final?.title || `${form.name}の星の記録`,
      });
      setResultHtml(html);
      setScreen("result");
      window.scrollTo(0, 0);
    } catch (e) {
      alert(e instanceof Error ? e.message : "鑑定中にエラーが発生しました。");
      setScreen("input");
    }
  };

  if (!verified) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 border-3 border-[rgba(201,169,110,0.3)] border-t-[#c9a96e] rounded-full animate-spin" />
      </main>
    );
  }

  if (screen === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[rgba(201,169,110,0.3)] border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/60">…あなたの星の記録を読み解いています</p>
          <p className="text-xs text-white/30 mt-1">30〜60秒ほどお待ちください</p>
        </div>
      </main>
    );
  }

  if (screen === "result") {
    return (
      <main className="min-h-screen relative" style={{ background: "var(--background)" }}>
        <LibraryBg scene="desk" />
        <GrainOverlay />
        <div className="relative z-20" dangerouslySetInnerHTML={{ __html: resultHtml }} />
        <div className="relative z-20 max-w-lg mx-auto px-5 pb-8">
          <ShareCard
            characterName="うらら"
            characterAvatar="/urara.png"
            characterId="urara"
            userName={form.name}
            topicLabel="フル鑑定"
            oneWord={resultMeta.oneWord}
            bookTitle={resultMeta.bookTitle}
            siteUrl={typeof window !== "undefined" ? window.location.origin : ""}
          />
        </div>
        <div className="max-w-lg mx-auto px-5 pb-8 no-print">
          <div className="flex gap-3">
            <button
              onClick={() => router.push(ref ? `/?ref=${ref}` : "/")}
              className="flex-1 py-2.5 rounded-full border border-white/10 text-sm text-white/50 hover:bg-white/5 transition-colors"
            >
              トップへ戻る
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 rounded-full border border-[rgba(201,169,110,0.3)] text-sm text-[#c9a96e] hover:bg-[rgba(201,169,110,0.05)] transition-colors"
            >
              印刷 / PDF保存
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Conversational input
  const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[rgba(201,169,110,0.4)] focus:ring-1 focus:ring-[rgba(201,169,110,0.2)]";
  const selectClass = "px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 text-center focus:outline-none focus:border-[rgba(201,169,110,0.4)]";

  return (
    <main className="min-h-screen relative" style={{ background: "var(--background)" }}>
      <LibraryBg scene="main" />
      <GrainOverlay />
      <div className="relative z-20 max-w-lg mx-auto px-5 py-8">
        <button
          onClick={() => currentStepIndex > 0 ? prevStep() : router.push(ref ? `/?ref=${ref}` : "/")}
          className="text-sm text-white/30 hover:text-white/50 mb-4 inline-block transition-colors"
        >
          ← {currentStepIndex > 0 ? "前へ" : "戻る"}
        </button>

        <div className="text-center mb-6">
          <p className="text-xs text-[#c9a96e] tracking-widest mb-1">星の図書館</p>
          <h1 className="text-xl font-bold text-white/90">フル鑑定</h1>
          <p className="text-xs text-white/40 mt-1">¥200 — 6000文字超の詳細レポート</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i <= currentStepIndex ? "rgba(201,169,110,0.7)" : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>

        {/* Character speech */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[rgba(201,169,110,0.2)]">
            <Image src="/urara.png" alt="うらら" width={40} height={40} className="object-cover" />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex-1"
            >
              <p className="text-sm text-white/70 leading-relaxed">{currentCharLine}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === "name" && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">お名前 <span className="text-[#c9a96e] text-xs">必須</span></label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && canProceed() && nextStep()}
                  placeholder="ニックネームでOK" autoFocus
                  className={inputClass}
                />
              </div>
            )}

            {step === "birthday" && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">生年月日 <span className="text-[#c9a96e] text-xs">必須</span></label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="1995" autoFocus className={selectClass} />
                  <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className={selectClass}>
                    {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}月</option>))}
                  </select>
                  <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className={selectClass}>
                    {Array.from({ length: 31 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}日</option>))}
                  </select>
                </div>
              </div>
            )}

            {step === "birthtime" && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">出生時間 <span className="text-white/20 text-xs">任意・わからなければ空でOK</span></label>
                <select value={form.birthHour} onChange={(e) => setForm({ ...form, birthHour: e.target.value })} className={`w-full ${selectClass}`}>
                  <option value="">わからない</option>
                  {Array.from({ length: 24 }, (_, i) => (<option key={i} value={i}>{i}時台（{i}:00〜{i}:59）</option>))}
                </select>
                <p className="text-[10px] text-white/30 mt-1">四柱推命の時柱の計算に使います。わからない場合は省略できます。</p>
              </div>
            )}

            {step === "birthplace" && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">出生地 <span className="text-white/20 text-xs">任意</span></label>
                <input
                  type="text" value={form.birthPlace}
                  onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && nextStep()}
                  placeholder="例: 東京" autoFocus
                  className={inputClass}
                />
              </div>
            )}

            {step === "concern" && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">相談したいこと <span className="text-white/20 text-xs">任意</span></label>
                <textarea
                  value={form.concern}
                  onChange={(e) => setForm({ ...form, concern: e.target.value })}
                  rows={3} placeholder="例: 今の仕事を続けるべきか迷っています..." autoFocus
                  className={inputClass}
                />
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-2 text-sm">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs mb-1">お名前</p>
                  <p className="text-white/80">{form.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs mb-1">生年月日</p>
                  <p className="text-white/80">{form.year}年{form.month}月{form.day}日{form.birthHour ? ` ${form.birthHour}時台` : ""}</p>
                </div>
                {form.birthPlace && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">出生地</p>
                    <p className="text-white/80">{form.birthPlace}</p>
                  </div>
                )}
                {form.concern && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">相談内容</p>
                    <p className="text-white/80">{form.concern}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6">
          {step === "confirm" ? (
            <button
              onClick={handleStartDiagnosis}
              className="w-full py-3.5 rounded-full text-white font-medium text-sm transition-colors"
              style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.5), rgba(201,169,110,0.25))", border: "1px solid rgba(201,169,110,0.3)" }}
            >
              鑑定を開始する
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="w-full py-3.5 rounded-full text-white font-medium text-sm transition-colors disabled:opacity-30"
              style={{ background: canProceed() ? "linear-gradient(135deg, rgba(201,169,110,0.5), rgba(201,169,110,0.25))" : "rgba(255,255,255,0.05)", border: "1px solid rgba(201,169,110,0.3)" }}
            >
              {step === "birthtime" || step === "birthplace" || step === "concern" ? "次へ（スキップ可）" : "次へ"}
            </button>
          )}
        </div>
        <div ref={bottomRef} />
      </div>
    </main>
  );
}
