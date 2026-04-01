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
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-md w-full text-center">
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--wood-mid)" }}
          >
            <svg className="w-8 h-8" style={{ color: "var(--brass)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1
            className="text-2xl mb-4"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}
          >
            お申し込みありがとうございます
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
            内容を確認後、ご連絡いたします。
            <br />
            承認後、QRコードをお届けします。
          </p>
          <Link
            href="/"
            className="text-sm transition-colors"
            style={{ color: "var(--brass-dark)" }}
          >
            ← トップに戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-20"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-xs tracking-[0.3em] mb-4 uppercase"
            style={{ color: "var(--text-dim)", fontFamily: "var(--font-body-en)" }}
          >
            Partner Program
          </p>
          <h1
            className="text-2xl mb-4"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}
          >
            掲示パートナー募集
          </h1>
          <div className="w-12 h-px mx-auto mb-6" style={{ backgroundColor: "var(--brass-dark)" }} />
          <p
            className="text-sm leading-relaxed max-w-sm mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            お店や施設にQRコードを掲示して、星の図書館をご紹介いただけるパートナーを募集しています。
            お客様が鑑定を利用するたびに、紹介料をお支払いします。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg p-8"
          style={{ backgroundColor: "var(--library-mid)", border: "1px solid var(--wood-dark)" }}
        >
          <div>
            <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
              店名・場所名 <span style={{ color: "var(--brass)" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--library-dark)",
                border: "1px solid var(--wood-dark)",
                color: "var(--text-primary)",
              }}
              placeholder="例: カフェ〇〇"
            />
          </div>

          <div>
            <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
              担当者名 <span style={{ color: "var(--brass)" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--library-dark)",
                border: "1px solid var(--wood-dark)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
              メールアドレス <span style={{ color: "var(--brass)" }}>*</span>
            </label>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--library-dark)",
                border: "1px solid var(--wood-dark)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
              住所（任意）
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--library-dark)",
                border: "1px solid var(--wood-dark)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
              紹介料（1件あたり・円）
            </label>
            <input
              type="number"
              value={form.kickbackRate}
              onChange={(e) => setForm({ ...form, kickbackRate: parseInt(e.target.value) || 50 })}
              className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--library-dark)",
                border: "1px solid var(--wood-dark)",
                color: "var(--text-primary)",
              }}
              min={0}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
              デフォルト: ¥50/件
            </p>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-md text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "var(--brass)", color: "var(--library-dark)" }}
          >
            {submitting ? "送信中..." : "申し込む"}
          </button>
        </form>

        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-xs transition-colors"
            style={{ color: "var(--text-dim)" }}
          >
            ← トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
