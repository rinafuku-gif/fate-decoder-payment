# ERROR_LOG

## 2026-04-15 セキュリティコミット `8886ab0` 事後調査

### 経緯
- `torisawa-portal` で Next.js 16 の `proxy.ts` 自動Edge登録により `next/headers` の cookies 使用が原因で全API 401 になる事故が発生（`b0bd0b2` で修正）。
- 同じセキュリティ一斉修正が入った本リポジトリ `hoshinotoshokan`（コミット `8886ab0`）にも同種の不具合がないか確認を実施。

### 結果

| 懸念事項 | 状態 |
|---|---|
| Next.js 16 proxy.ts / middleware の Edge 非対応 import | OK（proxy.ts は jose + request.cookies のみ、Edge対応） |
| Webhook トランザクション化 | OK（署名検証400、コード正常） |
| checkout エラー漏洩修正 | OK（フロントに fallback 文言あり） |
| CSP Stripe 許可 | OK（js.stripe.com / api.stripe.com 含む。Checkout のリダイレクトは navigation なので追加許可不要） |
| Bearer/HMAC 追加 | 変更なし |
| 環境変数 .trim() | 変更なし |
| **DB マイグレーション未適用** | **問題あり → 本日対応** |

### 検出した問題: 本番 Turso DB にインデックスが1本も適用されていなかった

コミット `8886ab0` で `drizzle/migrations/0001_even_sabra.sql` が生成され9本のインデックスが追加されたが、Vercel デプロイでは Turso DB に DDL が流れないため**本番DBには全く反映されていなかった**。

確認時の本番インデックス: 3本（既存の UNIQUE 制約由来のみ）
- `diagnoses_stripe_session_id_unique`
- `locations_ref_id_unique`
- `payment_tokens_token_unique`

### 対応

`CREATE INDEX IF NOT EXISTS` で9本を個別に安全適用。加えて `__drizzle_migrations` journal テーブルを作成し、0000・0001 を適用済みとしてマークした（既存テーブルと 0000 の CREATE TABLE を衝突させずに履歴管理を開始するため）。

適用したインデックス:
1. `diagnoses_ref_id_idx`
2. `diagnoses_created_at_idx`
3. `kickback_payments_location_ref_idx`
4. `kickback_payments_status_idx`
5. `locations_status_idx`
6. `locations_is_active_idx`
7. `referral_fees_place_id_idx`
8. `referral_fees_status_idx`
9. `referral_fees_place_id_status_idx`

### 本番疎通検証

- トップ / full / short / compatibility / admin/login : 全て 200
- `/api/checkout` POST: 200、本番 Stripe Checkout URL (`cs_live_...`) を返却
- `/api/webhook` POST (無効署名): 400 Invalid signature
- `/api/verify-token` POST (無効トークン): 401
- `/api/partner` POST (空ボディ): 400 バリデーション
- `/api/admin/stats` GET (未認証): 401（proxy.ts による Edge 保護動作確認）
- セキュリティヘッダー（CSP / HSTS / X-Frame-Options / X-Content-Type-Options）全て正常

### 今後の運用改善メモ

- Drizzle マイグレーションは Vercel デプロイに連動しない。`drizzle-kit migrate` を本番に流す仕組み（デプロイフック or 手動手順）を整える必要あり。
- 当座は `__drizzle_migrations` に 0000・0001 を記録済みなので、今後 drizzle-kit migrate を使えば差分のみ当たる。
