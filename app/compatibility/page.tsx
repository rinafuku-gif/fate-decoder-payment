"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateAll, calculateCompatibility, type CompatibilityType } from "@/lib/fortune-calc";
import { generateFortune } from "@/app/actions";

const COMPAT_TYPES: { id: CompatibilityType; label: string; desc: string }[] = [
  { id: "love", label: "恋愛・パートナー", desc: "恋愛やパートナーシップの相性" },
  { id: "business", label: "ビジネス", desc: "仕事やプロジェクトでの相性" },
  { id: "general", label: "総合", desc: "恋愛・仕事・友情の3軸で総合診断" },
];

export default function CompatibilityPage() {
  const router = useRouter();
  const [ref, setRef] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [screen, setScreen] = useState<"type-select" | "input" | "loading" | "result">("type-select");
  const [compatType, setCompatType] = useState<CompatibilityType>("love");
  const [person1, setPerson1] = useState({ name: "", year: "", month: "1", day: "1" });
  const [person2, setPerson2] = useState({ name: "", year: "", month: "1", day: "1" });
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("payment_token");
    const r = params.get("ref") || sessionStorage.getItem("fd_ref");
    if (r) setRef(r);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person1.name || !person1.year || !person2.name || !person2.year) return;
    setScreen("loading");

    try {
      const data1 = calculateAll(parseInt(person1.year), parseInt(person1.month), parseInt(person1.day));
      const data2 = calculateAll(parseInt(person2.year), parseInt(person2.month), parseInt(person2.day));
      const score = calculateCompatibility(data1, data2);
      const isGeneral = compatType === "general";
      const typeLabel = COMPAT_TYPES.find(t => t.id === compatType)?.label || "総合";

      const prompt = `
あなたは鑑定実績1万人超の本物の占い師です。
2人の6占術データと相性スコアをもとに、${typeLabel}の観点で相性を読み解いてください。
しいたけ占いのような親しみやすい文体で。

■ ${person1.name}さん (${person1.year}年${person1.month}月${person1.day}日生まれ)
・マヤ暦: KIN${data1.maya.kin} / 紋章:${data1.maya.glyph} / 音:${data1.maya.tone}
・算命学: [${data1.bazi.weapon}] ・数秘: LP${data1.numerology.lp} ・${data1.western.sign} ・${data1.sukuyo}

■ ${person2.name}さん (${person2.year}年${person2.month}月${person2.day}日生まれ)
・マヤ暦: KIN${data2.maya.kin} / 紋章:${data2.maya.glyph} / 音:${data2.maya.tone}
・算命学: [${data2.bazi.weapon}] ・数秘: LP${data2.numerology.lp} ・${data2.western.sign} ・${data2.sukuyo}

【相性スコア】 総合: ${score.total}点

1. attraction: 500〜700文字
2. caution: 400〜600文字
3. advice: 400〜600文字
${isGeneral ? `4. loveStory: 300〜400文字\n5. businessStory: 300〜400文字\n6. friendStory: 300〜400文字` : ""}
**必ずJSON出力**

{"attraction":"","caution":"","advice":""${isGeneral ? ',"loveStory":"","businessStory":"","friendStory":""' : ""}}
`;

      let story: any = { attraction: "", caution: "", advice: "" };
      try {
        const text = await generateFortune(prompt);
        let clean = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
        const first = clean.indexOf("{");
        if (first !== -1) clean = clean.substring(first);
        const last = clean.lastIndexOf("}");
        if (last !== -1) clean = clean.substring(0, last + 1);
        story = { ...story, ...JSON.parse(clean) };
      } catch {
        story.attraction = `${data1.western.sign}と${data2.western.sign}のおふたりは、${score.western.detail}。`;
        story.caution = `お互いの「当たり前」が違うことも。でもそれは視野を広げるチャンスです。`;
        story.advice = `大切なのは違いを「面白さ」として受け止めること。`;
      }

      setResult({ name1: person1.name, name2: person2.name, data1, data2, score, type: compatType, story });
      setScreen("result");
      window.scrollTo(0, 0);
    } catch {
      alert("診断中にエラーが発生しました。");
      setScreen("input");
    }
  };

  if (!verified) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-400 rounded-full animate-spin" />
      </main>
    );
  }

  if (screen === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">ふたりの星を読み解いています...</p>
          <p className="text-xs text-gray-400 mt-1">20〜40秒ほどお待ちください</p>
        </div>
      </main>
    );
  }

  if (screen === "result" && result) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-lg mx-auto px-5 py-8">
          <header className="text-center mb-6">
            <p className="text-xs text-purple-400 tracking-widest mb-1">Fate Decoder</p>
            <h1 className="text-xl font-bold text-gray-800">{result.name1} &times; {result.name2}</h1>
            <p className="text-xs text-gray-400 mt-1">{COMPAT_TYPES.find(t => t.id === result.type)?.label}</p>
          </header>

          {/* Score */}
          <div className="text-center mb-6 p-5 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-purple-100">
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{result.score.total}</p>
            <p className="text-xs text-gray-400">総合相性スコア</p>
          </div>

          {/* Score bars */}
          <div className="space-y-2 mb-6">
            {[
              { label: "西洋占星術", score: result.score.western.score },
              { label: "数秘術", score: result.score.numerology.score },
              { label: "マヤ暦", score: result.score.maya.score },
              { label: "算命学", score: result.score.sanmeigaku.score },
              { label: "四柱推命", score: result.score.shichusuimei.score },
              { label: "宿曜", score: result.score.sukuyo.score },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16 text-right">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-300 to-pink-300 rounded-full" style={{ width: `${item.score}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-6">{item.score}</span>
              </div>
            ))}
          </div>

          {/* Stories */}
          <div className="space-y-4 mb-6">
            {[
              { title: "惹かれ合うポイント", text: result.story.attraction, color: "border-l-pink-300" },
              { title: "すれ違いやすいポイント", text: result.story.caution, color: "border-l-amber-300" },
              ...(result.type === "general" && result.story.loveStory ? [
                { title: "恋愛の相性", text: result.story.loveStory, color: "border-l-red-200" },
                { title: "ビジネスの相性", text: result.story.businessStory, color: "border-l-blue-200" },
                { title: "友情の相性", text: result.story.friendStory, color: "border-l-green-200" },
              ] : []),
              { title: "ふたりへのアドバイス", text: result.story.advice, color: "border-l-purple-300" },
            ].map((section, i) => (
              <div key={i} className={`border-l-3 pl-4 py-2 ${section.color}`}>
                <h3 className="text-sm font-bold text-gray-700 mb-1">{section.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 no-print">
            <button onClick={() => router.push(ref ? `/?ref=${ref}` : "/")} className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              トップへ戻る
            </button>
            <button onClick={() => window.print()} className="flex-1 py-2.5 rounded-full border border-purple-200 text-sm text-purple-500 hover:bg-purple-50">
              印刷 / PDF保存
            </button>
          </div>

          <footer className="text-center text-xs text-gray-300 mt-8">Fate Decoder — Compatibility</footer>
        </div>
      </main>
    );
  }

  if (screen === "type-select") {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-lg mx-auto px-5 py-8">
          <button onClick={() => router.push(ref ? `/?ref=${ref}` : "/")} className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">← 戻る</button>
          <div className="text-center mb-6">
            <p className="text-xs text-purple-400 tracking-widest mb-1">Fate Decoder</p>
            <h1 className="text-xl font-bold text-gray-800">相性占い</h1>
            <p className="text-xs text-gray-400 mt-1">タイプを選んでください</p>
          </div>
          <div className="space-y-3">
            {COMPAT_TYPES.map((t) => (
              <button key={t.id} onClick={() => { setCompatType(t.id); setScreen("input"); }}
                className="w-full p-4 rounded-2xl border border-purple-100 bg-purple-50/50 text-left hover:shadow-md hover:scale-[1.01] transition-all">
                <p className="text-sm font-bold text-gray-800">{t.label}</p>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Input form
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-5 py-8">
        <button onClick={() => setScreen("type-select")} className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">← タイプ選択へ</button>
        <div className="text-center mb-6">
          <p className="text-xs text-purple-400 tracking-widest mb-1">Fate Decoder</p>
          <h1 className="text-xl font-bold text-gray-800">相性占い — {COMPAT_TYPES.find(t => t.id === compatType)?.label}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {[{ label: "1人目", person: person1, setPerson: setPerson1 }, { label: "2人目", person: person2, setPerson: setPerson2 }].map(({ label, person, setPerson }) => (
            <div key={label} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30">
              <p className="text-sm font-bold text-gray-700 mb-3">{label}</p>
              <div className="space-y-3">
                <input type="text" value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} placeholder="ニックネーム" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-300" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={person.year} onChange={(e) => setPerson({ ...person, year: e.target.value })} placeholder="1995" required className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-purple-300" />
                  <select value={person.month} onChange={(e) => setPerson({ ...person, month: e.target.value })} className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center">
                    {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}月</option>))}
                  </select>
                  <select value={person.day} onChange={(e) => setPerson({ ...person, day: e.target.value })} className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center">
                    {Array.from({ length: 31 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}日</option>))}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button type="submit" className="w-full py-3.5 rounded-full bg-purple-400 text-white font-medium text-sm hover:bg-purple-500 transition-colors">
            相性を診断する
          </button>
        </form>
      </div>
    </main>
  );
}
