"use client";

import { useState } from "react";
import Link from "next/link";

export default function PartnerPage() {
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
    address: "",
    bankName: "",
    branchName: "",
    accountType: "普通",
    accountNumber: "",
    accountHolder: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
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
        body: JSON.stringify({ ...form, kickbackRate: 50 }),
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

          {/* 振込先口座情報 */}
          <div className="pt-2">
            <p className="text-xs mb-4 tracking-wide" style={{ color: "var(--brass)" }}>お振込先情報</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  金融機関名 <span style={{ color: "var(--brass)" }}>*</span>
                </label>
                <input type="text" required value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: "var(--library-dark)", border: "1px solid var(--wood-dark)", color: "var(--text-primary)" }}
                  placeholder="例: 三菱UFJ銀行" />
              </div>
              <div>
                <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  支店名 <span style={{ color: "var(--brass)" }}>*</span>
                </label>
                <input type="text" required value={form.branchName}
                  onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: "var(--library-dark)", border: "1px solid var(--wood-dark)", color: "var(--text-primary)" }}
                  placeholder="例: 渋谷支店" />
              </div>
              <div>
                <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  口座種別 <span style={{ color: "var(--brass)" }}>*</span>
                </label>
                <select value={form.accountType}
                  onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: "var(--library-dark)", border: "1px solid var(--wood-dark)", color: "var(--text-primary)" }}>
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  口座番号 <span style={{ color: "var(--brass)" }}>*</span>
                </label>
                <input type="text" required value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: "var(--library-dark)", border: "1px solid var(--wood-dark)", color: "var(--text-primary)" }}
                  placeholder="例: 1234567" />
              </div>
              <div>
                <label className="block text-xs mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  口座名義（カナ） <span style={{ color: "var(--brass)" }}>*</span>
                </label>
                <input type="text" required value={form.accountHolder}
                  onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: "var(--library-dark)", border: "1px solid var(--wood-dark)", color: "var(--text-primary)" }}
                  placeholder="例: テスト タロウ" />
              </div>
            </div>
          </div>

          <div
            className="rounded-md px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--library-dark)", border: "1px solid var(--wood-dark)" }}
          >
            <p style={{ color: "var(--text-secondary)" }}>
              紹介料: 有料鑑定1件につき <span style={{ color: "var(--brass)", fontWeight: 500 }}>¥50</span>（税込）
            </p>
          </div>

          {/* 利用規約 */}
          <div>
            <button
              type="button"
              onClick={() => setTermsOpen(!termsOpen)}
              className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <svg
                className={`w-3 h-3 transition-transform ${termsOpen ? "rotate-90" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              利用規約を確認する
            </button>
            {termsOpen && (
              <div
                className="mt-3 rounded-md px-4 py-4 text-xs leading-relaxed max-h-64 overflow-y-auto space-y-3"
                style={{
                  backgroundColor: "var(--library-dark)",
                  border: "1px solid var(--wood-dark)",
                  color: "var(--text-dim)",
                }}
              >
                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>星の図書館 QR掲示パートナー利用規約</p>
                <p style={{ color: "var(--text-dim)", fontSize: "10px" }}>最終更新日: 2026年4月1日</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第1条（本規約について）</p>
                <p>この利用規約（以下「本規約」）は、稲福良祐（以下「運営者」）が提供するAI占い鑑定サービス「星の図書館」のQR掲示パートナー制度（以下「本制度」）について、運営者とQRコードの掲示にご協力いただく方（以下「パートナー」）との間のルールを定めるものです。パートナーとして申し込みいただいた時点で、本規約に同意いただいたものとみなします。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第2条（本制度の概要）</p>
                <p>1. 本制度は、パートナーの店舗・施設等に「星の図書館」専用のQRコードを掲示いただき、そのQRコード経由で有料鑑定が発生した場合に、紹介料をお支払いする仕組みです。</p>
                <p>2. パートナーの申し込みは、運営者が承認した時点で成立します。運営者は、理由を開示することなく申し込みをお断りする場合があります。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第3条（QRコードの取り扱い）</p>
                <p>1. 運営者は、パートナーごとに固有のQRコードを発行します。</p>
                <p>2. QRコードは申し込み時に届け出た店舗・施設内にのみ掲示してください。複製して他の場所に配布したり、SNS・Webサイト等に掲載することはできません。改変も禁止します。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第4条（紹介料）</p>
                <p>1. QRコード経由で有料鑑定が1件発生するごとに、50円（税込）の紹介料をお支払いします。無料鑑定（ショート鑑定）は対象外です。</p>
                <p>2. 毎月1日〜末日の鑑定実績を翌月初に集計します。</p>
                <p>3. 月次の紹介料合計が1万円以上の場合、翌月末日までにお支払いします。1万円未満の場合、翌月以降に繰り越し、累計が1万円以上に達した月の翌月末日にまとめてお支払いします。</p>
                <p>4. 支払い方法はパートナーが指定する銀行口座への振込とします。振込手数料は運営者が負担します。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第5条（パートナーの届出情報）</p>
                <p>パートナーは、申し込み時に店舗名・施設名、担当者氏名、メールアドレス、振込先口座情報、掲示場所の住所（任意）を届け出ていただきます。変更があった場合は速やかにご連絡ください。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第6条（個人情報の取り扱い）</p>
                <p>運営者は、パートナーからお預かりした個人情報を本制度の運営目的にのみ使用します。鑑定を利用されたお客様の情報はパートナーには開示しません。個人を特定しない集計データのみ共有する場合があります。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第7条（禁止事項）</p>
                <p>QRコードへの不正アクセス増加行為、スパム行為、無許可での名称・ロゴ使用、信用毀損行為、虚偽情報の届出、その他本制度の趣旨に反する行為を禁止します。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第8条（契約の解除）</p>
                <p>パートナーおよび運営者は、書面（メール含む）で通知することによりいつでも本制度の利用を終了できます。解除日までの紹介料は翌月末日までに全額お支払いします。禁止事項違反等の場合は事前通知なく資格を取り消すことがあります。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第9条（サービスの変更・停止・終了）</p>
                <p>サービスの終了に伴い本制度を終了する場合は、終了の30日前までに通知し、未払いの紹介料を精算します。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第10条（紹介料の変更）</p>
                <p>紹介料の金額を変更する場合は、変更の30日前までに通知します。変更に同意いただけない場合は契約を解除できます。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第11条（免責事項）</p>
                <p>本制度を通じてパートナーの売上向上や集客効果を保証するものではありません。QRコード読み取りの技術的問題、パートナー店舗でのお客様とのトラブルについて運営者は責任を負いません。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第12条（規約の変更）</p>
                <p>規約変更時は効力発生日の14日前までにメールで通知します。効力発生日以降も継続利用された場合、変更後の規約に同意いただいたものとみなします。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第13条（準拠法・管轄）</p>
                <p>本規約は日本法に準拠します。紛争については甲府地方裁判所を第一審の専属的合意管轄裁判所とします。</p>

                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>第14条（連絡先）</p>
                <p>運営者: 稲福良祐 / メール: satoyama-ai-base@tonari2tomaru.com / サービス: 星の図書館（https://hoshinotoshokan.vercel.app/）</p>

                <p style={{ color: "var(--text-dim)", fontSize: "10px" }}>制定日: 2026年4月1日</p>
              </div>
            )}
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--brass)]"
              />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>利用規約に同意して申し込む</span>
            </label>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !agreed}
            className="w-full py-3 rounded-md text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
