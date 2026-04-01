"use client";

import { useState } from "react";
import Link from "next/link";

export default function PartnerPage() {
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
    address: "",
    kickbackRate: 50,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a1025 50%, #0d0d2a 100%)" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-white/90 mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            お申し込みありがとうございます
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            内容を確認後、ご連絡いたします。
            <br />
            承認後、QRコードをお届けします。
          </p>
          <Link href="/" className="text-purple-400/70 text-sm hover:text-purple-300 transition-colors">
            ← トップに戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-20" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a1025 50%, #0d0d2a 100%)" }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-12">
          <p className="text-purple-400/60 text-xs tracking-[0.3em] mb-4 uppercase" style={{ fontFamily: "var(--font-body-en)" }}>
            Partner Program
          </p>
          <h1 className="text-2xl font-serif text-white/90 mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            掲示パートナー募集
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-sm mx-auto">
            お店や施設にQRコードを掲示して、星の図書館をご紹介いただけるパートナーを募集しています。
            お客様が鑑定を利用するたびに、紹介料をお支払いします。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/60 text-xs mb-2 tracking-wide">店名・場所名 *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/90 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              placeholder="例: カフェ〇〇"
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs mb-2 tracking-wide">担当者名 *</label>
            <input
              type="text"
              required
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/90 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs mb-2 tracking-wide">メールアドレス *</label>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/90 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs mb-2 tracking-wide">住所（任意）</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/90 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs mb-2 tracking-wide">紹介料（1件あたり・円）</label>
            <input
              type="number"
              value={form.kickbackRate}
              onChange={(e) => setForm({ ...form, kickbackRate: parseInt(e.target.value) || 50 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/90 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              min={0}
            />
            <p className="text-white/30 text-xs mt-1">デフォルト: ¥50/件</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "送信中..." : "申し込む"}
          </button>
        </form>

        <div className="text-center mt-8">
          <Link href="/" className="text-purple-400/50 text-xs hover:text-purple-300 transition-colors">
            ← トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
