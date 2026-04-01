"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "overview" | "locations" | "diagnoses" | "payments" | "analytics";

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "overview");
  const [stats, setStats] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [diagnosesData, setDiagnosesData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState(false);
  const [editLoc, setEditLoc] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const res = await fetch("/api/admin/stats");
        if (res.status === 401) { router.push("/admin/login"); return; }
        setStats(await res.json());
      } else if (tab === "locations") {
        const res = await fetch("/api/admin/locations");
        if (res.status === 401) { router.push("/admin/login"); return; }
        setLocations(await res.json());
      } else if (tab === "diagnoses") {
        const res = await fetch("/api/admin/diagnoses?limit=50");
        if (res.status === 401) { router.push("/admin/login"); return; }
        setDiagnosesData(await res.json());
      } else if (tab === "payments") {
        const res = await fetch("/api/admin/payments");
        if (res.status === 401) { router.push("/admin/login"); return; }
        setPayments(await res.json());
      } else if (tab === "analytics") {
        const res = await fetch(`/api/admin/analytics?period=${analyticsPeriod}`);
        if (res.status === 401) { router.push("/admin/login"); return; }
        setAnalytics(await res.json());
      }
    } catch { /* network error */ }
    setLoading(false);
  }, [tab, router, analyticsPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    router.replace(`/admin?tab=${t}`);
  };

  const handleApprove = async (id: number) => {
    if (!confirm("この場所を承認しますか？")) return;
    await fetch(`/api/admin/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    fetchData();
  };

  const handleAggregate = async () => {
    setAggregating(true);
    const res = await fetch("/api/admin/aggregate", { method: "POST" });
    const data = await res.json();
    alert(`集計完了: ${data.created}件作成（${data.period}）`);
    setAggregating(false);
    fetchData();
  };

  const handleSaveLocation = async () => {
    if (!editLoc) return;
    setSaving(true);
    await fetch(`/api/admin/locations/${editLoc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editLoc.name,
        contactName: editLoc.contactName,
        contactEmail: editLoc.contactEmail,
        address: editLoc.address,
        kickbackRate: editLoc.kickbackRate,
        bankName: editLoc.bankName,
        branchName: editLoc.branchName,
        accountType: editLoc.accountType,
        accountNumber: editLoc.accountNumber,
        accountHolder: editLoc.accountHolder,
      }),
    });
    setSaving(false);
    setEditLoc(null);
    fetchData();
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm("支払済にしますか？")) return;
    await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    fetchData();
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "概要" },
    { id: "locations", label: "場所別" },
    { id: "diagnoses", label: "診断ログ" },
    { id: "analytics", label: "流入分析" },
    { id: "payments", label: "支払管理" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-gray-800">星の図書館 管理</h1>
          <span className="text-xs text-gray-600">Admin Dashboard</span>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${tab === t.id ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-700 hover:text-gray-900"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">読み込み中...</div>
        ) : (
          <>
            {/* Overview */}
            {tab === "overview" && stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "総診断数", value: stats.totalDiagnoses, color: "text-gray-900" },
                    { label: "有料診断", value: stats.paidDiagnoses || 0, color: "text-purple-700" },
                    { label: "総売上", value: `¥${(stats.totalRevenue || 0).toLocaleString()}`, color: "text-green-700" },
                    { label: "未払キックバック", value: `¥${(stats.unpaidKickback || 0).toLocaleString()}`, color: "text-amber-600" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-600">{s.label}</p>
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-600 mb-2">今月の診断数: {stats.thisMonth?.count || 0}件 / 売上: ¥{(stats.thisMonth?.revenue || 0).toLocaleString()}</p>
                  {stats.dailyCounts?.length > 0 && (
                    <div className="flex items-end gap-1 h-16">
                      {stats.dailyCounts.map((d: any, i: number) => {
                        const max = Math.max(...stats.dailyCounts.map((x: any) => x.count));
                        const h = max > 0 ? (d.count / max) * 100 : 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-purple-200 rounded-t" style={{ height: `${h}%`, minHeight: d.count > 0 ? "4px" : "0" }} title={`${d.date}: ${d.count}件`} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Locations */}
            {tab === "locations" && (
              <div className="space-y-4">
                {/* Pending applications */}
                {locations.filter((l: any) => l.status === "pending").length > 0 && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                    <h3 className="text-sm font-semibold text-amber-800 mb-3">承認待ちの申請</h3>
                    {locations.filter((l: any) => l.status === "pending").map((loc: any) => (
                      <div key={loc.id} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{loc.name}</p>
                          <p className="text-xs text-gray-600">{loc.contactName} / {loc.contactEmail}</p>
                        </div>
                        <button
                          onClick={() => handleApprove(loc.id)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          承認
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Approved locations */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700 text-xs font-semibold">
                      <tr>
                        <th className="text-left px-4 py-3">場所</th>
                        <th className="text-left px-4 py-3">担当者</th>
                        <th className="text-right px-4 py-3">診断数</th>
                        <th className="text-right px-4 py-3">有料</th>
                        <th className="text-right px-4 py-3">売上</th>
                        <th className="text-right px-4 py-3">KB率</th>
                        <th className="text-right px-4 py-3">繰越</th>
                        <th className="text-center px-4 py-3">QR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.filter((l: any) => l.status !== "pending").map((loc: any) => (
                        <tr key={loc.refId} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button onClick={() => setEditLoc({ ...loc })} className="text-left hover:text-purple-600 transition-colors">
                              <p className="font-medium text-gray-900 hover:text-purple-600">{loc.name}</p>
                              <p className="text-xs text-gray-500 font-mono">{loc.refId}</p>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">{loc.contactName || "—"}</td>
                          <td className="px-4 py-3 text-right text-gray-800">{loc.totalDiagnoses}</td>
                          <td className="px-4 py-3 text-right text-gray-800">{loc.paidDiagnoses}</td>
                          <td className="px-4 py-3 text-right text-gray-900 font-medium">¥{(loc.revenue || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-700">¥{loc.kickbackRate}/件</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {(loc.carriedOverAmount || 0) > 0 ? `¥${loc.carriedOverAmount.toLocaleString()}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <a
                              href={`/api/qr?ref=${loc.refId}`}
                              download={`${loc.name}_${loc.refId}.png`}
                              className="text-xs text-purple-600 hover:underline"
                            >
                              DL
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Diagnoses */}
            {tab === "diagnoses" && diagnosesData && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2 text-xs text-gray-600 border-b border-gray-100">
                  {diagnosesData.total}件中 {diagnosesData.data?.length || 0}件表示
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 text-xs font-semibold">
                    <tr>
                      <th className="text-left px-4 py-2">日時</th>
                      <th className="text-left px-4 py-2">名前</th>
                      <th className="text-left px-4 py-2">モード</th>
                      <th className="text-left px-4 py-2">テーマ</th>
                      <th className="text-left px-4 py-2">場所</th>
                      <th className="text-right px-4 py-2">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(diagnosesData.data || []).map((d: any) => (
                      <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-xs text-gray-600">{(d.createdAt || d.created_at)?.slice(0, 16).replace("T", " ") || "—"}</td>
                        <td className="px-4 py-2 text-gray-800">{d.userName || d.user_name || "—"}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${d.mode === "short" ? "bg-pink-50 text-pink-600" : "bg-purple-50 text-purple-600"}`}>
                            {d.mode}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-700">{d.topic || "—"}</td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-600">{d.refId || d.ref_id}</td>
                        <td className="px-4 py-2 text-right text-gray-800">{(d.paidAmount || d.paid_amount) > 0 ? `¥${d.paidAmount || d.paid_amount}` : "無料"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Analytics */}
            {tab === "analytics" && analytics && (
              <div className="space-y-4">
                {/* Period filter */}
                <div className="flex gap-2">
                  {[
                    { id: "all", label: "全期間" },
                    { id: "month", label: "今月" },
                    { id: "last_month", label: "先月" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setAnalyticsPeriod(p.id); }}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${analyticsPeriod === p.id ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Overall stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-600">総診断</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.totals.total}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-600">有料診断</p>
                    <p className="text-xl font-bold text-purple-700">{analytics.totals.paid}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-600">コンバージョン率</p>
                    <p className="text-xl font-bold text-green-700">{analytics.totals.conversionRate}%</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-600">売上</p>
                    <p className="text-xl font-bold text-gray-900">¥{analytics.totals.revenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Channel tables */}
                {["own", "referral", "organic"].map((cat) => {
                  const items = analytics.channels.filter((c: any) => c.category === cat);
                  if (items.length === 0) return null;
                  const label = cat === "own" ? "自社チャネル" : cat === "referral" ? "パートナー（リファラル）" : "オーガニック";
                  return (
                    <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-semibold text-gray-700">{label}</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700 text-xs font-semibold">
                          <tr>
                            <th className="text-left px-4 py-2">流入元</th>
                            <th className="text-right px-4 py-2">無料</th>
                            <th className="text-right px-4 py-2">有料</th>
                            <th className="text-right px-4 py-2">CVR</th>
                            <th className="text-right px-4 py-2">売上</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((c: any) => (
                            <tr key={`${c.source}-${c.medium}`} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-800">
                                {c.source}
                                {c.medium && <span className="text-xs text-gray-500 ml-1">({c.medium})</span>}
                              </td>
                              <td className="px-4 py-2 text-right text-gray-800">{c.total - c.paid}</td>
                              <td className="px-4 py-2 text-right text-purple-700 font-medium">{c.paid}</td>
                              <td className="px-4 py-2 text-right text-green-700">{c.conversionRate}%</td>
                              <td className="px-4 py-2 text-right text-gray-900 font-medium">¥{c.revenue.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                {/* URL Generator */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-3">SNS用URL生成</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {["instagram", "x", "facebook", "note", "line"].map((src) => (
                      <button
                        key={src}
                        onClick={() => {
                          const url = `https://hoshinotoshokan.vercel.app/?utm_source=${src}&utm_medium=sns`;
                          navigator.clipboard.writeText(url);
                          alert(`コピーしました:\n${url}`);
                        }}
                        className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500">ボタンをクリックするとUTM付きURLがクリップボードにコピーされます</p>
                </div>
              </div>
            )}

            {/* Payments */}
            {tab === "payments" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleAggregate}
                    disabled={aggregating}
                    className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-purple-600"
                  >
                    {aggregating ? "集計中..." : "先月分を集計する"}
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700 text-xs font-semibold">
                      <tr>
                        <th className="text-left px-4 py-2">期間</th>
                        <th className="text-left px-4 py-2">場所</th>
                        <th className="text-right px-4 py-2">件数</th>
                        <th className="text-right px-4 py-2">金額</th>
                        <th className="text-center px-4 py-2">状態</th>
                        <th className="text-center px-4 py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">まだ集計データがありません</td></tr>
                      ) : (
                        payments.map((p: any) => (
                          <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 text-xs text-gray-700">{p.periodStart} 〜 {p.periodEnd}</td>
                            <td className="px-4 py-2 text-gray-800">{p.locationRef}</td>
                            <td className="px-4 py-2 text-right text-gray-800">{p.diagnosisCount}件</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">¥{(p.amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                                {p.status === "paid" ? "支払済" : "未払い"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center space-x-2">
                              <a href={`/api/admin/statements/${p.id}`} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline">明細書</a>
                              {p.status === "pending" && (
                                <button onClick={() => handleMarkPaid(p.id)} className="text-xs text-green-600 hover:underline">支払済にする</button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Location Modal */}
      {editLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditLoc(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">場所情報の編集</h3>
              <button onClick={() => setEditLoc(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {[
                { key: "name", label: "場所名" },
                { key: "contactName", label: "担当者名" },
                { key: "contactEmail", label: "メール" },
                { key: "address", label: "住所" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1">{label}</label>
                  <input
                    value={editLoc[key] || ""}
                    onChange={(e) => setEditLoc({ ...editLoc, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-600 mb-1">キックバック率（円/件）</label>
                <input
                  type="number"
                  value={editLoc.kickbackRate || 50}
                  onChange={(e) => setEditLoc({ ...editLoc, kickbackRate: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-purple-600 font-medium mb-3">振込先口座</p>
                {[
                  { key: "bankName", label: "金融機関名" },
                  { key: "branchName", label: "支店名" },
                  { key: "accountNumber", label: "口座番号" },
                  { key: "accountHolder", label: "口座名義（カナ）" },
                ].map(({ key, label }) => (
                  <div key={key} className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">{label}</label>
                    <input
                      value={editLoc[key] || ""}
                      onChange={(e) => setEditLoc({ ...editLoc, [key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                ))}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">口座種別</label>
                  <select
                    value={editLoc.accountType || "普通"}
                    onChange={(e) => setEditLoc({ ...editLoc, accountType: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="普通">普通</option>
                    <option value="当座">当座</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setEditLoc(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">キャンセル</button>
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">読み込み中...</div>}>
      <AdminContent />
    </Suspense>
  );
}
