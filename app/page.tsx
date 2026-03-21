"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const STAR_DATA = [
  { top: "5%", left: "12%", size: 1.5, delay: 0.2, duration: 3.1 },
  { top: "8%", left: "47%", size: 2.0, delay: 1.4, duration: 2.4 },
  { top: "12%", left: "78%", size: 1.2, delay: 0.8, duration: 3.5 },
  { top: "18%", left: "33%", size: 2.5, delay: 2.1, duration: 2.8 },
  { top: "22%", left: "91%", size: 1.0, delay: 0.5, duration: 4.0 },
  { top: "28%", left: "5%", size: 1.8, delay: 1.9, duration: 2.2 },
  { top: "35%", left: "62%", size: 1.3, delay: 3.2, duration: 3.7 },
  { top: "42%", left: "19%", size: 2.2, delay: 0.7, duration: 2.9 },
  { top: "48%", left: "85%", size: 1.6, delay: 2.5, duration: 3.3 },
  { top: "55%", left: "38%", size: 1.1, delay: 1.1, duration: 4.2 },
  { top: "61%", left: "71%", size: 2.0, delay: 3.8, duration: 2.6 },
  { top: "68%", left: "8%", size: 1.4, delay: 0.3, duration: 3.9 },
  { top: "74%", left: "55%", size: 2.3, delay: 2.7, duration: 2.3 },
  { top: "80%", left: "28%", size: 1.7, delay: 1.6, duration: 3.4 },
  { top: "86%", left: "93%", size: 1.2, delay: 0.9, duration: 4.1 },
  { top: "91%", left: "42%", size: 1.9, delay: 3.5, duration: 2.7 },
  { top: "95%", left: "15%", size: 1.5, delay: 2.0, duration: 3.6 },
  { top: "3%", left: "67%", size: 2.1, delay: 1.3, duration: 2.5 },
  { top: "15%", left: "22%", size: 1.0, delay: 3.9, duration: 4.3 },
  { top: "38%", left: "96%", size: 1.8, delay: 0.6, duration: 3.0 },
  { top: "52%", left: "3%", size: 1.3, delay: 2.3, duration: 3.8 },
  { top: "70%", left: "75%", size: 2.4, delay: 1.7, duration: 2.1 },
  { top: "83%", left: "50%", size: 1.6, delay: 0.4, duration: 4.4 },
  { top: "10%", left: "89%", size: 1.1, delay: 2.8, duration: 3.2 },
  { top: "45%", left: "48%", size: 2.0, delay: 1.2, duration: 2.8 },
];

const FORTUNE_TYPES = [
  { icon: "☀️", label: "西洋占星術", desc: "天体の配置から運命を読む" },
  { icon: "🀄", label: "四柱推命", desc: "生年月日から命式を紐解く" },
  { icon: "🔢", label: "数秘術", desc: "数字に宿る宇宙の意志" },
  { icon: "✋", label: "手相占い", desc: "手のひらに刻まれた運命線" },
  { icon: "🃏", label: "タロット", desc: "78枚の象徴が語る真実" },
  { icon: "🧿", label: "九星気学", desc: "星の気が示す方位と時運" },
];

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cancelled") === "true") setCancelled(true);
    const err = params.get("error");
    if (err) setError(err);
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white overflow-hidden relative">
      {/* Starfield */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {STAR_DATA.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animation: `twinkle ${star.duration}s ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Nebula gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-950/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Header brand */}
        <div className="text-center mb-3">
          <span className="text-xs tracking-[0.3em] text-purple-400/70 uppercase font-light">
            produced by SATOYAMA AI BASE
          </span>
        </div>

        {/* Logo / Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-500/30 mb-6 shadow-lg shadow-purple-900/50">
            <span className="text-4xl">🔮</span>
          </div>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent tracking-tight">
            Fate Decoder
          </h1>
          <p className="text-purple-300/80 text-lg font-light tracking-wide">
            AIが紐解く、あなただけの運命の書
          </p>
        </div>

        {/* Notification banners */}
        {cancelled && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-950/30 text-amber-300 text-sm text-center">
            お支払いがキャンセルされました。ご準備ができたら再度お試しください。
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 text-sm text-center">
            エラーが発生しました。もう一度お試しください。（{error}）
          </div>
        )}

        {/* Hero copy */}
        <div className="text-center mb-10">
          <p className="text-white/90 text-lg leading-relaxed">
            6つの占術をAIが統合し、あなたの過去・現在・未来を
            <br className="hidden sm:block" />
            深く読み解くパーソナル鑑定レポートをお届けします。
          </p>
        </div>

        {/* Fortune types grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
          {FORTUNE_TYPES.map((ft) => (
            <div
              key={ft.label}
              className="rounded-xl border border-purple-800/40 bg-purple-950/30 p-4 text-center hover:border-purple-600/60 transition-colors"
            >
              <div className="text-2xl mb-2">{ft.icon}</div>
              <div className="text-sm font-medium text-purple-200">{ft.label}</div>
              <div className="text-xs text-purple-400/70 mt-1">{ft.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="rounded-2xl border border-purple-700/40 bg-gradient-to-br from-purple-950/60 to-indigo-950/60 p-8 text-center mb-8 shadow-xl shadow-purple-950/40 backdrop-blur-sm">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs border border-purple-500/40 text-purple-300 bg-purple-900/30 mb-4">
              ✨ ワンタイム鑑定
            </span>
          </div>
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-5xl font-bold text-white">¥200</span>
            <span className="text-purple-400">/ 回</span>
          </div>
          <p className="text-purple-300/70 text-sm mb-8">
            安全なStripe決済 · クレジットカード対応 · 即時鑑定開始
          </p>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-900/60 hover:shadow-purple-700/60 hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                決済画面へ移動中…
              </>
            ) : (
              <>
                <span>🔮</span>
                200円で今すぐ鑑定する
              </>
            )}
          </button>
          <p className="mt-4 text-xs text-purple-400/60">
            決済完了後、自動的に鑑定ページへ移動します
          </p>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="text-center text-sm tracking-[0.2em] text-purple-400/70 uppercase mb-6">
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { step: "01", icon: "💳", title: "お支払い", desc: "Stripeで安全に¥200を決済" },
              { step: "02", icon: "✍️", title: "情報入力", desc: "生年月日・名前などを入力" },
              { step: "03", icon: "📜", title: "鑑定完了", desc: "AIが6占術を統合した結果を生成" },
            ].map((item) => (
              <div key={item.step} className="flex-1 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-purple-700/50 bg-purple-900/30 mb-3">
                  <span className="text-xl">{item.icon}</span>
                </div>
                <div className="text-xs text-purple-500 mb-1">{item.step}</div>
                <div className="text-sm font-medium text-purple-200">{item.title}</div>
                <div className="text-xs text-purple-400/70 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Section */}
        <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-6 text-center mb-10">
          <p className="text-xs text-purple-400/70 mb-4 tracking-wide uppercase">
            QR コード
          </p>
          <div className="inline-block p-3 bg-white rounded-xl shadow-lg shadow-purple-900/40">
            <Image
              src="/api/qr"
              alt="Fate Decoder QR Code"
              width={160}
              height={160}
              className="block"
              unoptimized
            />
          </div>
          <p className="text-xs text-purple-400/60 mt-4">
            スマートフォンで読み取ってアクセス
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-purple-500/50 space-y-1">
          <p>© 2025 SATOYAMA AI BASE. All rights reserved.</p>
          <p>Powered by Claude AI · Secured by Stripe</p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </main>
  );
}
