"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "overview" | "locations" | "diagnoses" | "payments";

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (tab === "overview") {
        const res = await fetch("/api/admin/stats", { headers });
        if (res.status === 401) { router.push("/admin/login"); return; }
        setStats(await res.json());
      } else if (tab === "locations") {
        const res = await fetch("/api/admin/locations", { headers });
        if (res.status === 401) { router.push("/admin/login"); return; }
        setLocations(await res.json());
      } else if (tab === "diagnoses") {
        const res = await fetch("/api/admin/diagnoses?limit=50", { headers });
        if (res.status === 401) { router.push("/admin/login"); return; }
        setDiagnosesData(await res.json());
      } else if (tab === "payments") {
        const res = await fetch("/api/admin/payments", { headers });
        if (res.status === 401) { router.push("/admin/login"); return; }
        setPayments(await res.json());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [tab, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    router.replace(`/admin?tab=${t}`);
  };

  const handleAggregate = async () => {
    setAggregating(true);
    const res = await fetch("/api/admin/aggregate", { method: "POST" });
    const data = await res.json();
    alert(`集計完了: ${data.created}件作成（${data.period}）`);
    setAggregating(false);
    fetchData();
  };

  const handleMarkPaid = async (id: number) => {
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
    { id: "payments", label: "支払管理" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-gray-800">Fate Decoder 管理</h1>
          <span className="text-xs text-gray-400">Admin Dashboard</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${tab === t.id ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">読み込み中...</div>
        ) : (
          <>
            {/* Overview */}
            {tab === "overview" && stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "総診断数", value: stats.totalDiagnoses, color: "text-gray-800" },
                    { label: "有料診断", value: stats.paidDiagnoses || 0, color: "text-purple-600" },
                    { label: "総売上", value: `¥${(stats.totalRevenue || 0).toLocaleString()}`, color: "text-green-600" },
                    { label: "未払キックバック", value: `¥${(stats.unpaidKickback || 0).toLocaleString()}`, color: "text-amber-600" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-400">{s.label}</p>
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-400 mb-2">今月の診断数: {stats.thisMonth?.count || 0}件 / 売上: ¥{(stats.thisMonth?.revenue || 0).toLocaleString()}</p>
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
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">場所</th>
                      <th className="text-right px-4 py-3">ref</th>
                      <th className="text-right px-4 py-3">診断数</th>
                      <th className="text-right px-4 py-3">有料</th>
                      <th className="text-right px-4 py-3">売上</th>
                      <th className="text-right px-4 py-3">KB率</th>
                      <th className="text-right px-4 py-3">KB額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((loc: any) => (
                      <tr key={loc.refId} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{loc.name}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">{loc.refId}</td>
                        <td className="px-4 py-3 text-right">{loc.totalDiagnoses}</td>
                        <td className="px-4 py-3 text-right">{loc.paidDiagnoses}</td>
                        <td className="px-4 py-3 text-right">¥{(loc.revenue || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">¥{loc.kickbackRate}</td>
                        <td className="px-4 py-3 text-right font-medium text-purple-600">¥{(loc.kickbackOwed || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Diagnoses */}
            {tab === "diagnoses" && diagnosesData && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">
                  {diagnosesData.total}件中 {diagnosesData.data?.length || 0}件表示
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      <th className="text-left px-4 py-2">日時</th>
                      <th className="text-left px-4 py-2">名前</th>
                      <th className="text-left px-4 py-2">モード</th>
                      <th className="text-left px-4 py-2">場所</th>
                      <th className="text-right px-4 py-2">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(diagnosesData.data || []).map((d: any) => (
                      <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-xs text-gray-400">{d.created_at?.slice(0, 16).replace("T", " ")}</td>
                        <td className="px-4 py-2">{d.user_name || "—"}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${d.mode === "short" ? "bg-pink-50 text-pink-600" : "bg-purple-50 text-purple-600"}`}>
                            {d.mode}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-400">{d.ref_id}</td>
                        <td className="px-4 py-2 text-right">{d.paid_amount > 0 ? `¥${d.paid_amount}` : "無料"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <thead className="bg-gray-50 text-gray-500 text-xs">
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
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">まだ集計データがありません</td></tr>
                      ) : (
                        payments.map((p: any) => (
                          <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 text-xs">{p.periodStart} 〜 {p.periodEnd}</td>
                            <td className="px-4 py-2">{p.locationRef}</td>
                            <td className="px-4 py-2 text-right">{p.diagnosisCount}件</td>
                            <td className="px-4 py-2 text-right font-medium">¥{(p.amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                                {p.status === "paid" ? "支払済" : "未払い"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center space-x-2">
                              <a href={`/api/admin/statements/${p.id}`} target="_blank" rel="noreferrer" className="text-xs text-purple-500 hover:underline">明細書</a>
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
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">読み込み中...</div>}>
      <AdminContent />
    </Suspense>
  );
}
