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
    paid: false,
  },
  {
    id: "full",
    label: "フル鑑定",
    subtitle: "…じっくり調べてくる",
    description: "6000文字超の詳細レポート。あなただけの物語を書き下ろす。相談にも答える。",
    price: "¥200",
    paid: true,
  },
  {
    id: "compatibility",
    label: "相性占い",
    subtitle: "…ふたりの本、見比べてくる",
    description: "2人の生年月日から6占術で相性を読み解く。恋愛・ビジネス・総合から選べる。",
    price: "¥200",
    paid: true,
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
    if (r) { setRef(r); sessionStorage.setItem("fd_ref", r); }
    else { const stored = sessionStorage.getItem("fd_ref"); if (stored) setRef(stored); }
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
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error);
    } catch {
      setError("決済の開始に失敗しました。");
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto px-5 py-8">

        {/* Hero */}
        <div className="text-center mb-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "var(--navy)" }}>
            うらら
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--gold)" }}>
            6つの占術で読む、あなたの物語
          </p>
        </div>

        {/* Characters hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6" style={{ background: "var(--navy)" }}>
          <div className="flex">
            <div className="w-1/2 relative">
              <Image src="/urara-hero.png" alt="うらら" width={600} height={600} className="w-full h-auto object-cover" priority />
            </div>
            <div className="w-1/2 relative">
              <Image src="/reki-hero.png" alt="れき" width={600} height={600} className="w-full h-auto object-cover" priority />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
            <p className="text-sm text-white/80">
              …生年月日を教えてくれたら、星の図書館であなたの本を探してくるよ
            </p>
          </div>
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

        {/* Divination badges */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6">
          {["西洋占星術", "宿曜", "数秘術", "マヤ暦", "算命学", "四柱推命"].map((name) => (
            <span key={name} className="px-2.5 py-1 rounded-full text-[11px] border" style={{ background: "var(--cream)", borderColor: "var(--gold-light)", color: "var(--navy-light)" }}>
              {name}
            </span>
          ))}
        </div>

        {/* Mode cards */}
        <div className="space-y-3 mb-8">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className="rounded-2xl border p-4 transition-all duration-150 hover:shadow-lg hover:scale-[1.01]"
              style={{
                background: mode.paid ? "var(--warm-white)" : "var(--cream)",
                borderColor: mode.paid ? "var(--gold-light)" : "var(--gold)",
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--navy)" }}>{mode.label}</h2>
                  <p className="text-xs text-gray-400">{mode.subtitle}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: mode.paid ? "var(--gold)" : "#e07c7c" }}>
                  {mode.price}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{mode.description}</p>
              {mode.id === "short" ? (
                <button
                  onClick={() => router.push(`/short${ref ? `?ref=${ref}` : ""}`)}
                  className="w-full py-2.5 rounded-full font-medium text-sm text-white transition-colors"
                  style={{ background: "#c07878" }}
                >
                  無料で診断する
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(mode.id as "full" | "compatibility")}
                  disabled={loading !== null}
                  className="w-full py-2.5 rounded-full font-medium text-sm text-white transition-colors disabled:opacity-50"
                  style={{ background: "var(--navy)" }}
                >
                  {loading === mode.id ? "決済画面へ移動中…" : `¥200で鑑定する`}
                </button>
              )}
            </div>
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
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mb-1" style={{ background: "var(--cream)", color: "var(--gold)" }}>
                {item.step}
              </div>
              <p className="text-[11px] text-gray-500">{item.title}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-400 space-y-1">
          <p>Stripe安全決済 · スマホ対応</p>
          <p>&copy; 2026 うらら / SATOYAMA AI BASE</p>
        </footer>
      </div>
    </main>
  );
}
