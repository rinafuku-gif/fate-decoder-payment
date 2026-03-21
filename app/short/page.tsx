"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateAll, type FortuneResult } from "@/lib/fortune-calc";
import { generateFortune } from "@/app/actions";

export default function ShortPage() {
  const router = useRouter();
  const [ref, setRef] = useState<string | null>(null);
  const [screen, setScreen] = useState<"input" | "loading" | "result">("input");
  const [form, setForm] = useState({ name: "", year: "", month: "1", day: "1" });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.year) return;
    setScreen("loading");

    try {
      const data = calculateAll(parseInt(form.year), parseInt(form.month), parseInt(form.day));

      const prompt = `
あなたは鑑定実績1万人超のプロの占い師です。
6つの占術データから、この人の核心を3つの視点で鋭く、しかし温かく伝えてください。
しいたけ占いのような親しみやすい文体で「あるある」な具体例を入れてください。

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
1. personality（性格の核心）: 200〜300文字。占術データを2つ以上引用し具体的な行動パターンを描写
2. relationships（人間関係）: 200〜300文字。恋愛・友人関係の「あるある」を含める
3. talent（才能・仕事）: 200〜300文字。この人が輝ける分野
4. oneWord: あなたを一言で表す言葉。8〜15文字
5. action: 今日からできる具体的な行動。20〜40文字
6. luckyItem: ラッキーアイテム。具体的に
7. 各セクションに問いかけを最低1つ
8. **必ず純粋なJSON形式で出力**

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
          oneWord: "静かな光を宿す探求者",
          personality: `マヤ暦で「${data.maya.glyph}」の紋章を持つあなたは、表面的には穏やかでも内面に強い意志を宿しています。ライフパスナンバー${data.numerology.lp}が示すように、自分なりの答えを見つけたいという欲求が常にあるのではないでしょうか。`,
          relationships: `${data.western.sign}のあなたは、人間関係において深い絆を求める傾向があります。広く浅い付き合いよりも、本音で語り合える少数の関係を大切にするタイプ。`,
          talent: `算命学の「${data.bazi.weapon}」を持つあなたには、物事の本質を見抜く鋭さがあります。`,
          action: "朝5分だけ、窓を開けて深呼吸してみてください",
          luckyItem: "温かいハーブティー",
        };
      }

      // DB記録（fire-and-forget）
      fetch("/api/log-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: ref || "direct",
          mode: "short",
          name: form.name,
          birthDate: `${form.year}-${String(parseInt(form.month)).padStart(2, "0")}-${String(parseInt(form.day)).padStart(2, "0")}`,
        }),
      }).catch(() => {});

      setResult({
        name: form.name,
        data,
        oneWord: parsed.oneWord || "静かな光を宿す探求者",
        personality: parsed.personality || "",
        relationships: parsed.relationships || "",
        talent: parsed.talent || "",
        action: parsed.action || "朝5分だけ、窓を開けて深呼吸してみてください",
        luckyItem: parsed.luckyItem || "温かいハーブティー",
      });
      setScreen("result");
      window.scrollTo(0, 0);
    } catch {
      alert("診断中にエラーが発生しました。もう一度お試しください。");
      setScreen("input");
    }
  };

  const handleShare = async () => {
    const text = `${result?.name}さんの診断結果「${result?.oneWord}」\n\nFate Decoder で無料診断 →`;
    const url = window.location.origin + (ref ? `?ref=${ref}` : "");
    if (navigator.share) {
      try { await navigator.share({ title: "Fate Decoder", text, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert("コピーしました！");
      } catch {}
    }
  };

  if (screen === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">あなたの星を読み解いています...</p>
          <p className="text-xs text-gray-400 mt-1">10〜20秒ほどお待ちください</p>
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
            <h1 className="text-xl font-bold text-gray-800">{result.name} さんの診断結果</h1>
          </header>

          <div className="text-center mb-6 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-purple-100">
            <p className="text-xs text-gray-400 mb-1">あなたを一言で表すなら</p>
            <p className="text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {result.oneWord}
            </p>
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
              <div key={i} className="text-center p-2 rounded-xl bg-white border border-purple-50">
                <p className="text-[10px] text-gray-400">{d.label}</p>
                <p className="text-xs font-medium text-gray-700">{d.value}</p>
              </div>
            ))}
          </div>

          {/* Readings */}
          <div className="space-y-4 mb-6">
            {[
              { title: "性格の核心", text: result.personality, color: "border-l-purple-300" },
              { title: "人間関係", text: result.relationships, color: "border-l-pink-300" },
              { title: "才能・仕事", text: result.talent, color: "border-l-amber-300" },
            ].map((section, i) => (
              <div key={i} className={`border-l-3 pl-4 py-2 ${section.color}`}>
                <h3 className="text-sm font-bold text-gray-700 mb-1">{section.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>

          {/* Action & Lucky */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
              <p className="text-[10px] text-purple-400 mb-1">今日のアクション</p>
              <p className="text-xs text-gray-700">{result.action}</p>
            </div>
            <div className="p-3 rounded-xl bg-pink-50 border border-pink-100 text-center">
              <p className="text-[10px] text-pink-400 mb-1">ラッキーアイテム</p>
              <p className="text-xs text-gray-700">{result.luckyItem}</p>
            </div>
          </div>

          {/* Upsell */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 text-center mb-6">
            <p className="text-sm text-gray-700 mb-2">
              もっと深く知りたい方は
            </p>
            <p className="text-xs text-gray-500 mb-3">
              <strong>フル鑑定</strong>（6000文字超の詳細レポート）や<br />
              <strong>相性占い</strong>も試してみてください
            </p>
            <button
              onClick={() => router.push(ref ? `/?ref=${ref}` : "/")}
              className="px-6 py-2.5 rounded-full bg-purple-400 text-white text-sm font-medium hover:bg-purple-500 transition-colors"
            >
              ¥200で詳しく鑑定する
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 no-print">
            <button
              onClick={() => router.push(ref ? `/?ref=${ref}` : "/")}
              className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              もう一度
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 rounded-full border border-purple-200 text-sm text-purple-500 hover:bg-purple-50"
            >
              結果を共有する
            </button>
          </div>

          <footer className="text-center text-xs text-gray-300 mt-8">
            Fate Decoder — Short Reading
          </footer>
        </div>
      </main>
    );
  }

  // Input screen
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-5 py-8">
        <button
          onClick={() => router.push(ref ? `/?ref=${ref}` : "/")}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block"
        >
          ← 戻る
        </button>

        <div className="text-center mb-6">
          <p className="text-xs text-purple-400 tracking-widest mb-1">Fate Decoder</p>
          <h1 className="text-xl font-bold text-gray-800">ショート診断</h1>
          <p className="text-xs text-gray-400 mt-1">無料 — 3分でわかる、あなたの本質</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前 <span className="text-pink-400 text-xs">必須</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ニックネームでOK"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生年月日 <span className="text-pink-400 text-xs">必須</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="1995"
                required
                className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-purple-300"
              />
              <select
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-purple-300"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}月</option>
                ))}
              </select>
              <select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-purple-300"
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}日</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-pink-400 text-white font-medium text-sm hover:bg-pink-500 transition-colors mt-2"
          >
            無料で診断する
          </button>
        </form>

        <p className="text-center text-xs text-gray-300 mt-6">
          6つの占術であなたの本質を読み解きます
        </p>
      </div>
    </main>
  );
}
