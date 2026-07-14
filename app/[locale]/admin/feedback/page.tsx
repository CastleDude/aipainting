"use client";

import { useEffect, useState } from "react";

interface FeedbackItem {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchItems = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback?page=${p}&limit=${limit}`);
      const data = await res.json();
      if (res.ok) { setItems(data.items); setTotal(data.total); setPage(p); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchItems(1); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Confirm delete?")) return;
    await fetch("/api/feedback", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
        <div>
        <h1 className="text-2xl font-bold text-white mb-6">留言管理</h1>

        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : (
          <>
            <div className="rounded-xl border border-border/50 bg-bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="py-3 px-4 font-medium text-text-muted w-16">ID</th>
                    <th className="py-3 px-4 font-medium text-text-muted">名称</th>
                    <th className="py-3 px-4 font-medium text-text-muted">邮箱</th>
                    <th className="py-3 px-4 font-medium text-text-muted">留言内容</th>
                    <th className="py-3 px-4 font-medium text-text-muted">日期</th>
                    <th className="py-3 px-4 font-medium text-text-muted w-20">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted">暂无留言</td></tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-t border-border/30">
                        <td className="py-3 px-4 text-text-muted">{item.id}</td>
                        <td className="py-3 px-4 text-text-primary">{item.name}</td>
                        <td className="py-3 px-4 text-text-secondary">{item.email}</td>
                        <td className="py-3 px-4 text-text-primary max-w-[300px] truncate" title={item.message}>{item.message}</td>
                        <td className="py-3 px-4 text-text-muted whitespace-nowrap">{new Date(item.created_at).toLocaleString("zh-CN")}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 hover:text-red-300">删除</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-text-muted">共 {total} 条，第 {page} 页</span>
              <div className="flex gap-2">
                <button onClick={() => fetchItems(page - 1)} disabled={page <= 1} className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary disabled:opacity-30">上一页</button>
                <button onClick={() => fetchItems(page + 1)} disabled={page * limit >= total} className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary disabled:opacity-30">下一页</button>
              </div>
            </div>
          )}
        </>
      )}
        </div>
  );
}
