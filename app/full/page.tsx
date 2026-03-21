"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateAll } from "@/lib/fortune-calc";
import { generateFortune } from "@/app/actions";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default function FullPage() {
  const router = useRouter();
  const [ref, setRef] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [screen, setScreen] = useState<"input" | "loading" | "result">("input");
  const [form, setForm] = useState({
    name: "", year: "", month: "1", day: "1",
    bloodType: "A", birthPlace: "", concern: "",
  });
  const [resultHtml, setResultHtml] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("payment_token");
    const r = params.get("ref") || sessionStorage.getItem("fd_ref");
    if (r) setRef(r);
    if (t) {
      setToken(t);
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
    if (!form.name || !form.year) return;
    setScreen("loading");

    try {
      const data = calculateAll(parseInt(form.year), parseInt(form.month), parseInt(form.day));
      const prompt = `
あなたは、複数の占術データを読み解いて「その人だけの性格分析レポート」を小説形式で書くライターです。
しいたけ占いのような親しみやすく温かい文体で、読者に深く寄り添うトーンで書いてください。

【対象者】
名前: ${form.name} (${form.year}年${form.month}月${form.day}日生まれ / ${form.bloodType}型 / ${form.birthPlace || '未入力'}出身)

【分析データ】
・マヤ暦: KIN${data.maya.kin} / 太陽の紋章:${data.maya.glyph} / 銀河の音:${data.maya.tone} / ウェイブスペル:${data.maya.ws}
・算命学: 中心星[${data.bazi.weapon}]
・四柱推命: 年柱[${data.sanmeigaku.year}] / 月柱[${data.sanmeigaku.month}] / 日柱[${data.sanmeigaku.day}] / 日干[${data.bazi.stem}]
・数秘術: ライフパスナンバー[${data.numerology.lp}]
・西洋占星術: ${data.western.sign}
・宿曜: ${data.sukuyo}

【相談内容】
「${form.concern || '特になし'}」

【執筆ルール】
1. 専門用語は必ず噛み砕いて説明
2. 「〜という感覚はありませんか？」のような共感・問いかけスタイル
3. 各章は800文字以上。全体で6000文字以上
4. 相談内容に合わせて3〜7章を柔軟に構成
5. 抽象的な表現を避け具体的なシーンを入れる
6. **必ず純粋なJSON形式** で出力

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
      const renderSection = (part: any) => {
        if (!part) return "";
        return `<div class="mb-6 border-l-3 border-purple-200 pl-4">
          <p class="text-xs text-purple-400 mb-1">${escapeHtml(part.tag || "")}</p>
          <h3 class="text-base font-bold text-gray-800 mb-2">${escapeHtml(part.title || "")}</h3>
          <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">${escapeHtml(part.text || "")}</p>
        </div>`;
      };

      const html = `
        <div class="max-w-lg mx-auto px-5 py-8">
          <header class="text-center mb-6">
            <p class="text-xs text-purple-400 tracking-widest mb-1">星の図書館</p>
            <h1 class="text-xl font-bold text-gray-800">${safeName} さんへのフル鑑定</h1>
            ${form.concern ? `<p class="text-xs text-gray-400 mt-2">「${escapeHtml(form.concern)}」</p>` : ""}
          </header>
          <div class="grid grid-cols-3 gap-2 mb-6">
            ${[
              { l: "KIN", v: data.maya.kin }, { l: "紋章", v: data.maya.glyph }, { l: "音", v: data.maya.tone },
              { l: "LP", v: data.numerology.lp }, { l: "中心星", v: data.bazi.weapon }, { l: "星座", v: data.western.sign },
            ].map(d => `<div class="text-center p-2 rounded-xl bg-white border border-purple-50"><p class="text-[10px] text-gray-400">${d.l}</p><p class="text-xs font-medium text-gray-700">${d.v}</p></div>`).join("")}
          </div>
          ${renderSection(story.prologue)}
          ${story.chapters.map((c: any) => renderSection(c)).join("")}
          <div class="mb-6 border-l-3 border-pink-200 pl-4">
            <p class="text-xs text-pink-400 mb-1">${escapeHtml(story.final.tag || "#まとめ")}</p>
            <h3 class="text-base font-bold text-gray-800 mb-2">${escapeHtml(story.final.title || "これからのあなたへ")}</h3>
            <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">${escapeHtml(story.final.text || "")}</p>
            ${story.final.magic ? `<div class="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-100 text-center"><p class="text-[10px] text-purple-400 mb-1">今日からできるアクション</p><p class="text-xs font-medium text-gray-700">${escapeHtml(story.final.magic)}</p></div>` : ""}
          </div>
          <footer class="text-center text-xs text-gray-300 mt-8">星の図書館 — Full Reading</footer>
        </div>
      `;

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
          <p className="text-sm text-gray-600">AIがあなたの鑑定書を執筆中...</p>
          <p className="text-xs text-gray-400 mt-1">30〜60秒ほどお待ちください</p>
        </div>
      </main>
    );
  }

  if (screen === "result") {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div dangerouslySetInnerHTML={{ __html: resultHtml }} />
        <div className="max-w-lg mx-auto px-5 pb-8 no-print">
          <div className="flex gap-3">
            <button
              onClick={() => router.push(ref ? `/?ref=${ref}` : "/")}
              className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              トップへ戻る
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 rounded-full border border-purple-200 text-sm text-purple-500 hover:bg-purple-50"
            >
              印刷 / PDF保存
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Input form
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
          <p className="text-xs text-purple-400 tracking-widest mb-1">星の図書館</p>
          <h1 className="text-xl font-bold text-gray-800">フル鑑定</h1>
          <p className="text-xs text-gray-400 mt-1">¥200 — 6000文字超の詳細レポート</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">お名前 <span className="text-pink-400 text-xs">必須</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ニックネームでOK" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生年月日 <span className="text-pink-400 text-xs">必須</span></label>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="1995" required className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-purple-300" />
              <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-purple-300">
                {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}月</option>))}
              </select>
              <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="px-3 py-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-purple-300">
                {Array.from({ length: 31 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}日</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">血液型</label>
              <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-300">
                <option value="A">A型</option><option value="B">B型</option><option value="O">O型</option><option value="AB">AB型</option><option value="Unknown">不明</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出生地 <span className="text-gray-300 text-xs">任意</span></label>
              <input type="text" value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} placeholder="例: 東京" className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-300" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">相談したいこと <span className="text-gray-300 text-xs">任意</span></label>
            <textarea value={form.concern} onChange={(e) => setForm({ ...form, concern: e.target.value })} rows={3} placeholder="例: 今の仕事を続けるべきか迷っています..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200" />
          </div>

          <button type="submit" className="w-full py-3.5 rounded-full bg-purple-400 text-white font-medium text-sm hover:bg-purple-500 transition-colors">
            鑑定を開始する
          </button>
        </form>
      </div>
    </main>
  );
}
