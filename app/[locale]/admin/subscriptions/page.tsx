"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";

interface Subscription {
  id: string;
  user_email: string;
  tier: string;
  status: string;
  creem_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export default function AdminSubscriptionsPage() {
  const { profile } = useAuth();
  const t = useTranslations("admin");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const tierLabel = (tier: string) => {
    const map: Record<string, string> = {
      free: t("free"),
      basic: t("basic") || "Basic",
      premium: t("premium"),
      ultimate: t("ultimate"),
    };
    return map[tier] || tier;
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "active": return "text-green-400 bg-green-500/10";
      case "canceled": return "text-yellow-400 bg-yellow-500/10";
      case "expired": return "text-red-400 bg-red-500/10";
      case "past_due": return "text-orange-400 bg-orange-500/10";
      default: return "text-text-muted bg-bg-secondary";
    }
  };

  const handleCancel = async (subId: string) => {
    if (!confirm(t("confirm_cancel_sub") || "Cancel this subscription? User will be downgraded to free tier.")) return;
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subId, status: "canceled" }),
      });
      if (res.ok) fetchSubscriptions();
    } catch {}
  };

  if (!profile || profile.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-4">{t("subscriptions_title")}</h1>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50"
        >
          <option value="">{t("all_statuses")}</option>
          <option value="active">{t("status_active") || "Active"}</option>
          <option value="canceled">{t("status_canceled") || "Canceled"}</option>
          <option value="expired">{t("status_expired") || "Expired"}</option>
          <option value="past_due">{t("status_past_due") || "Past Due"}</option>
        </select>
      </div>

      <div className="rounded-xl border border-border/50 bg-bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_user")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_tier")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_status")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("period_start") || "Period Start"}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("period_end") || "Period End"}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_date")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">{t("loading")}</td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">{t("no_data")}</td></tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors">
                    <td className="px-4 py-3 text-text-secondary">{s.user_email}</td>
                    <td className="px-4 py-3">
                      <span className={s.tier === "free" ? "text-text-muted" : "text-accent"}>
                        {tierLabel(s.tier)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {s.current_period_start ? new Date(s.current_period_start).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {s.status === "active" && (
                        <button
                          onClick={() => handleCancel(s.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          {t("cancel_action") || "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
