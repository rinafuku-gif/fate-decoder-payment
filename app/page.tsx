"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MODES = [
  {
    id: "short",
    label: "ショート診断",
    subtitle: "3分でわかる、あなたの本質",
    description: "6つの占術の核心をぎゅっと凝縮。性格・人間関係・才能を読み解きます。",
    price: "無料",
    priceColor: "text-pink-500",
    cardClass: "border-pink-200 bg-pink-50/50",
    btnClass: "bg-pink-400 hover:bg-pink-500 text-white",
    href: "/short",
  },
  {
    id: "full",
    label: "フル鑑定",
    subtitle: "6000文字超の詳細レポート",
    description: "6占術を統合し、AIがあなただけの鑑定書を書き下ろします。相談内容にもお答えします。",
    price: "¥200",
    priceColor: "text-purple-500",
    cardClass: "border-purple-200 bg-purple-50/50",
    btnClass: "bg-purple-400 hover:bg-purple-500 text-white",
    href: null,
  },
  {
    id: "compatibility",
    label: "相性占い",
    subtitle: "ふたりの相性を6占術で診断",
    description: "恋愛・ビジネス・総合の3タイプから選べます。2人の生年月日で深く読み解きます。",
    price: "¥200",
    priceColor: "text-purple-500",
    cardClass: "border-purple-200 bg-purple-50/50",
    btnClass: "bg-purple-400 hover:bg-purple-500 text-white",
    href: null,
  },
];

const FORTUNES = [
  { icon: "☀️", label: "西洋占星術" },
  { icon: "🌙", label: "宿曜占星術" },
  { icon: "🔢", label: "数秘術" },
  { icon: "🏛️", label: "マヤ暦" },
  { icon: "🌿", label: "算命学" },
  { icon: "📜", label: "四柱推命" },
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
    if (r) {
      setRef(r);
      sessionStorage.setItem("fd_ref", r);
    } else {
      const stored = sessionStorage.getItem("fd_ref");
      if (stored) setRef(stored);
    }
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
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "決済の準備に失敗しました");
      }
    } catch {
      setError("決済の開始に失敗しました。もう一度お試しください。");
      setLoading(null);
    }
  };

  const handleShort = () => {
    const refParam = ref ? `?ref=${ref}` : "";
    router.push(`/short${refParam}`);
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest text-purple-400 mb-3 uppercase">
            produced by SATOYAMA AI BASE
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Fate Decoder
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">
            生年月日を入れるだけで、あなたの"今"が見えてくる
          </p>
        </div>

        {/* Notifications */}
        {cancelled && (
          <div className="mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm text-center">
            お支払いがキャンセルされました。ご準備ができたらもう一度どうぞ。
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Fortune types */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {FORTUNES.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-white border border-purple-100 text-gray-600"
            >
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        {/* Mode cards */}
        <div className="space-y-4 mb-10">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className={`rounded-2xl border p-5 transition-all duration-150 hover:shadow-md hover:scale-[1.01] ${mode.cardClass}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{mode.label}</h2>
                  <p className="text-xs text-gray-500">{mode.subtitle}</p>
                </div>
                <span className={`text-lg font-bold ${mode.priceColor}`}>
                  {mode.price}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {mode.description}
              </p>
              {mode.id === "short" ? (
                <button
                  onClick={handleShort}
                  className={`w-full py-3 rounded-full font-medium text-sm transition-colors ${mode.btnClass}`}
                >
                  無料で診断する
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(mode.id as "full" | "compatibility")}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-full font-medium text-sm transition-colors disabled:opacity-50 ${mode.btnClass}`}
                >
                  {loading === mode.id ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      決済画面へ移動中...
                    </span>
                  ) : (
                    `¥200で鑑定する`
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h3 className="text-center text-xs tracking-widest text-gray-400 uppercase mb-5">
            使い方
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { step: "1", title: "メニューを選ぶ", desc: "無料のショート or 有料の詳細鑑定" },
              { step: "2", title: "生年月日を入力", desc: "ニックネームでOK" },
              { step: "3", title: "結果を受け取る", desc: "AIがあなただけの鑑定文を生成" },
            ].map((item) => (
              <div key={item.step}>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-500 text-sm font-bold mb-2">
                  {item.step}
                </div>
                <p className="text-xs font-medium text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 text-xs text-gray-400">
            <span>🔒 Stripe安全決済</span>
            <span>✨ 鑑定実績あり</span>
            <span>📱 スマホ対応</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 space-y-1">
          <p>&copy; 2026 SATOYAMA AI BASE</p>
          <p className="text-gray-300">Powered by AI</p>
        </footer>
      </div>
    </main>
  );
}
