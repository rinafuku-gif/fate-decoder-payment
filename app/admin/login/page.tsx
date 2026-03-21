"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "認証に失敗しました");
      }
    } catch {
      setError("通信エラー");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-6">
        <h1 className="text-lg font-bold text-gray-800 text-center mb-6">管理画面ログイン</h1>
        {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:border-purple-300"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-purple-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? "認証中..." : "ログイン"}
          </button>
        </form>
      </div>
    </main>
  );
}
