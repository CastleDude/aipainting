"use client";

import { useEffect, useState, useCallback } from "react";
import { getTierConfig } from "@/lib/credits";
import type { SubscriptionTier } from "@/lib/supabase";

interface LogEntry {
  id: string;
  category: string | null;
  amount: number;
  reason: string;
  balance_after: number;
  created_at: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  recharge: "充值",
  bonus: "赠送",
  daily: "发放",
  consume: "消耗",
  expire: "过期",
  adjust: "调整",
};

interface CreditLogProps {
  onBack: () => void;
  messages: {
    title: string;
    current_plan: string;
    credit_count: string;
    type: string;
    time: string;
    purpose: string;
    change: string;
    balance: string;
    loading: string;
    no_records: string;
    back: string;
    recharge: string;
    bonus: string;
    daily: string;
    consume: string;
    expire: string;
    adjust: string;
  };
}

export function CreditLog({ onBack, messages }: CreditLogProps) {

  const CATEGORY_NAMES: Record<string, string> = {
    recharge: messages.recharge,
    bonus: messages.bonus,
    daily: messages.daily,
    consume: messages.consume,
    expire: messages.expire,
    adjust: messages.adjust,
  };
  const [items, setItems] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [credits, setCredits] = useState(0);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const res = await fetch(`/api/credits/log?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTier(data.tier || "free");
      setCredits(data.credits || 0);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const inferCategory = (item: LogEntry): string => {
    if (item.category) return item.category;
    if (item.amount > 0 && item.reason.includes("bonus")) return "bonus";
    if (item.amount > 0 && (item.reason.includes("credit") || item.reason.includes("reset") || item.reason.includes("积分"))) return "daily";
    if (item.amount > 0 && item.reason.toLowerCase().includes("tier")) return "recharge";
    if (item.amount < 0) return "consume";
    return "";
  };

  const tierConfig = getTierConfig(tier);

  return (
    <div className="rounded-xl border border-border/50 bg-bg-card p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary">{messages.title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{messages.current_plan}：<span className="text-text-primary font-medium">{tierConfig.name}</span></span>
          <span className="text-xs text-text-muted">{messages.credit_count}：<span className="text-accent font-semibold text-sm">{credits}</span></span>
          <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-3 py-1.5 text-xs text-text-muted hover:text-white hover:bg-white/15 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            {messages.back}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-bg-secondary/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">{messages.type}</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">{messages.time}</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">{messages.purpose}</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">{messages.change}</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">{messages.balance}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">{messages.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">{messages.no_records}</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.category === "recharge" || item.category === "bonus" || item.category === "daily" || item.category === "adjust"
                        ? "bg-green-500/15 text-green-400"
                        : item.category === "consume"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-text-muted/15 text-text-muted"
                    }`}>
                      {CATEGORY_NAMES[inferCategory(item)] || CATEGORY_NAMES[item.category || ""] || item.category || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-muted text-xs whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary text-xs">{item.reason}</td>
                  <td className="px-4 py-2.5 font-medium text-xs whitespace-nowrap">
                    <span className={item.amount > 0 ? "text-green-400" : "text-white"}>
                      {item.amount > 0 ? `+${item.amount}` : String(item.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary text-xs">{item.balance_after ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <span className="text-xs text-text-muted">{total} 条记录</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded bg-white/5 border border-white/5 px-2.5 py-1 text-xs text-text-secondary hover:text-white hover:bg-white/15 disabled:opacity-30">上一页</button>
            <span className="px-2.5 py-1 text-xs text-text-secondary">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded bg-white/5 border border-white/5 px-2.5 py-1 text-xs text-text-secondary hover:text-white hover:bg-white/15 disabled:opacity-30">下一页</button>
          </div>
        </div>
      )}
    </div>
  );
}
