"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";

interface Order {
  id: string;
  user_email: string;
  tier: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function AdminOrdersPage() {
  const { profile } = useAuth();
  const t = useTranslations("admin");
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const tierLabels: Record<string, string> = {
    free: t("free"),
    basic: t("basic"),
    premium: t("premium"),
    ultimate: t("ultimate"),
  };

  const tierLabel = (tier: string) => tierLabels[tier] || tier;

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "text-green-400 bg-green-500/10";
      case "pending": return "text-yellow-400 bg-yellow-500/10";
      case "failed": return "text-red-400 bg-red-500/10";
      default: return "text-text-muted bg-bg-secondary";
    }
  };

  if (!profile || profile.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-4">{t("orders_title")}</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50"
        >
          <option value="">{t("all_statuses")}</option>
          <option value="completed">{t("status_completed")}</option>
          <option value="pending">{t("status_pending")}</option>
          <option value="failed">{t("status_failed")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_order_id")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_user")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_tier")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_amount")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_status")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_date")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">{t("loading")}</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">{t("no_orders")}</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors">
                    <td className="px-4 py-3 text-text-muted text-xs font-mono">{o.id.slice(0, 12)}...</td>
                    <td className="px-4 py-3 text-text-secondary">{o.user_email}</td>
                    <td className="px-4 py-3">
                      <span className={o.tier === "free" ? "text-text-muted" : "text-accent"}>
                        {tierLabel(o.tier)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {o.currency?.toUpperCase()} {(o.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <span className="text-xs text-text-muted">{t("total").replace("[[COUNT]]", String(total))}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-border/50 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30">{t("prev_page")}</button>
              <span className="px-2.5 py-1 text-xs text-text-secondary">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded border border-border/50 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30">{t("next_page")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
