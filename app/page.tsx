"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MODES = [
  {
    id: "short",
    label: "ショート診断",
    subtitle: "…3分で読んでくるよ",
    description: "6つの占術の核心をぎゅっと凝縮。あなたの性格・人間関係・才能がわかる。",
    price: "無料",
    priceColor: "text-rose-400",
    cardClass: "border-rose-100 bg-rose-50/30",
    btnClass: "bg-rose-400 hover:bg-rose-500 text-white",
  },
  {
    id: "full",
    label: "フル鑑定",
    subtitle: "…じっくり調べてくる",
    description: "6000文字超の詳細レポート。あなただけの物語を書き下ろす。相談にも答える。",
    price: "¥200",
    priceColor: "text-indigo-500",
    cardClass: "border-indigo-100 bg-indigo-50/30",
    btnClass: "bg-indigo-500 hover:bg-indigo-600 text-white",
  },
  {
    id: "compatibility",
    label: "相性占い",
    subtitle: "…ふたりの本、見比べてくる",
    description: "2人の生年月日から6占術で相性を読み解く。恋愛・ビジネス・総合から選べる。",
    price: "¥200",
    priceColor: "text-indigo-500",
    cardClass: "border-indigo-100 bg-indigo-50/30",
    btnClass: "bg-indigo-500 hover:bg-indigo-600 text-white",
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
      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Hero */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-indigo-900 tracking-tight">
            うらら
          </h1>
          <p className="text-sm text-gray-500">
            6つの占術で読む、あなたの物語
          </p>
        </div>

        {/* Characters */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-100 mx-auto mb-1">
              <Image src="/urara.png" alt="うらら" width={80} height={80} className="object-cover object-top w-full h-full" />
            </div>
            <p className="text-xs text-gray-500">うらら</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-100 mx-auto mb-1">
              <Image src="/reki.png" alt="れき" width={80} height={80} className="object-cover object-top w-full h-full" />
            </div>
            <p className="text-xs text-gray-500">れき</p>
          </div>
        </div>

        {/* Intro speech */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8 relative">
          <p className="text-sm text-gray-600 leading-relaxed">
            …生年月日を教えてくれたら、星の図書館であなたの本を探してくるよ。
            <br />
            <span className="text-gray-400 text-xs">6つの占術で、あなたの本質を読み解く。</span>
          </p>
        </div>

        {/* Notifications */}
        {cancelled && (
          <div className="mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm text-center">
            お支払いがキャンセルされました。
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Mode cards */}
        <div className="space-y-3 mb-8">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className={`rounded-2xl border p-4 transition-all duration-150 hover:shadow-md hover:scale-[1.01] ${mode.cardClass}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{mode.label}</h2>
                  <p className="text-xs text-gray-400">{mode.subtitle}</p>
                </div>
                <span className={`text-sm font-bold ${mode.priceColor}`}>
                  {mode.price}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                {mode.description}
              </p>
              {mode.id === "short" ? (
                <button
                  onClick={handleShort}
                  className={`w-full py-2.5 rounded-full font-medium text-sm transition-colors ${mode.btnClass}`}
                >
                  無料で診断する
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(mode.id as "full" | "compatibility")}
                  disabled={loading !== null}
                  className={`w-full py-2.5 rounded-full font-medium text-sm transition-colors disabled:opacity-50 ${mode.btnClass}`}
                >
                  {loading === mode.id ? "決済画面へ移動中…" : `¥200で鑑定する`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Divination types */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-8">
          {["西洋占星術", "宿曜", "数秘術", "マヤ暦", "算命学", "四柱推命"].map((name) => (
            <span key={name} className="px-2.5 py-1 rounded-full text-[11px] bg-indigo-50 text-indigo-400 border border-indigo-100">
              {name}
            </span>
          ))}
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-2 text-center mb-8">
          {[
            { step: "1", title: "メニューを選ぶ" },
            { step: "2", title: "生年月日を入力" },
            { step: "3", title: "結果を受け取る" },
          ].map((item) => (
            <div key={item.step}>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-400 text-xs font-bold mb-1">
                {item.step}
              </div>
              <p className="text-[11px] text-gray-500">{item.title}</p>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className="text-center text-[11px] text-gray-300 space-x-3 mb-6">
          <span>Stripe安全決済</span>
          <span>·</span>
          <span>スマホ対応</span>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-300">
          <p>&copy; 2026 うらら / SATOYAMA AI BASE</p>
        </footer>
      </div>
    </main>
  );
}
