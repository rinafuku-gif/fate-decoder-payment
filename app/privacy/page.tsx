export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-12 px-5" style={{ background: "var(--navy)" }}>
      <div className="max-w-2xl mx-auto text-white/80 text-sm leading-relaxed">
        <a href="/" className="text-white/30 text-xs hover:text-white/50 transition-colors">← 戻る</a>
        <h1 className="text-xl font-bold text-white mt-4 mb-8">プライバシーポリシー</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-base font-bold text-white mb-2">1. 収集する情報</h2>
            <p>本サービス「うらら」では、以下の情報を収集します。</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
              <li>お名前（ニックネーム）</li>
              <li>生年月日</li>
              <li>決済情報（Stripe経由で処理。当サービスではカード情報を保持しません）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. 利用目的</h2>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>6つの占術（マヤ暦・算命学・数秘術・西洋占星術・宿曜・四柱推命）に基づく鑑定結果の生成</li>
              <li>Google Gemini APIを使用したAI文章生成</li>
              <li>サービスの改善・統計分析</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. 第三者への提供</h2>
            <p>以下の場合を除き、個人情報を第三者に提供することはありません。</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
              <li>AI鑑定文の生成のため、Google Gemini APIに生年月日等の情報を送信します</li>
              <li>決済処理のため、Stripe Inc.に決済情報を送信します</li>
              <li>法令に基づく開示請求があった場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. 情報の管理</h2>
            <p>収集した情報は適切な安全管理措置を講じて保護します。不要となった情報は速やかに削除します。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">5. 開示・訂正・削除</h2>
            <p>ご自身の情報の開示・訂正・削除をご希望される場合は、下記の連絡先までお問い合わせください。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">6. 免責事項</h2>
            <p>本サービスで提供される鑑定結果はエンターテインメント目的であり、医学的・法的・金融的な助言ではありません。鑑定結果に基づく行動について、当サービスは一切の責任を負いません。</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">7. お問い合わせ</h2>
            <p>r.inafuku@tonari2tomaru.com</p>
          </section>

          <p className="text-white/40 text-xs mt-8">制定日: 2026年3月22日</p>
        </div>

        <footer className="text-center text-[11px] text-white/20 mt-12">
          <p>&copy; 2026 星の図書館 · Produced by SATOYAMA AI BASE</p>
        </footer>
      </div>
    </main>
  );
}
