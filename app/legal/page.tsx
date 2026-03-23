export default function LegalPage() {
  return (
    <main className="min-h-screen py-12 px-5" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto text-white/80 text-sm leading-relaxed">
        <a href="/" className="text-white/30 text-xs hover:text-white/50 transition-colors">← 戻る</a>
        <h1 className="text-xl font-bold text-white mt-4 mb-8">特定商取引法に基づく表記</h1>
        <table className="w-full text-left">
          <tbody className="divide-y divide-white/10">
            {[
              ["販売事業者", "SATOYAMA AI BASE（稲福良祐）"],
              ["所在地", "山梨県上野原市"],
              ["連絡先", "r.inafuku@tonari2tomaru.com（電話番号は請求があった場合に遅滞なく開示いたします）"],
              ["販売価格", "各サービスページに表示された金額（税込）"],
              ["支払方法", "クレジットカード（Stripe経由）"],
              ["支払時期", "サービス利用時に即時決済"],
              ["商品の引渡時期", "決済完了後、即時にサービスを提供"],
              ["返品・キャンセル", "デジタルコンテンツの性質上、提供後の返品・返金はお受けできません。決済前であればキャンセル可能です。"],
              ["動作環境", "インターネット接続環境、最新のWebブラウザ（Chrome, Safari, Edge等）"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td className="py-3 pr-4 text-white/50 whitespace-nowrap align-top w-1/3">{label}</td>
                <td className="py-3 text-white/80">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="text-center text-[11px] text-white/20 mt-12">
          <p>&copy; 2026 星の図書館 · Produced by SATOYAMA AI BASE</p>
        </footer>
      </div>
    </main>
  );
}
