"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";

interface User {
  id: string;
  email: string;
  name: string;
  tier: string;
  credits: number;
  daily_used: number;
  tools_daily_used: number;
}

export default function AdminCreditsPage() {
  const { profile } = useAuth();
  const t = useTranslations("admin");

  const tierLabels: Record<string, string> = {
    free: t("free"),
    basic: t("basic"),
    premium: t("premium"),
    ultimate: t("ultimate"),
  };

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustMode, setAdjustMode] = useState<"add" | "set">("add");
  const [toast, setToast] = useState<string | null>(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const applyCredit = async (userId: string) => {
    const amount = parseInt(adjustValue);
    if (!amount || amount <= 0) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newCredits = adjustMode === "add" ? user.credits + amount : amount;

    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates: { credits: newCredits } }),
    });

    setAdjustingId(null);
    setAdjustValue("");
    setToast(adjustMode === "add" ? t("credit_updated").replace("{amount}", String(amount)) : t("credit_set").replace("{amount}", String(amount)));
    setTimeout(() => setToast(null), 3000);
    fetchUsers();
  };

  if (!profile || profile.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-4">{t("credits_title")}</h1>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 w-64"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_user")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_email")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_tier")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_credits")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_daily_used")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">{t("loading")}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">{t("no_data")}</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-text-primary font-medium">{u.name || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={u.tier === "free" ? "text-text-muted" : "text-accent"}>{tierLabels[u.tier] || u.tier}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-primary font-semibold">{u.credits}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{(u.daily_used || 0) + (u.tools_daily_used || 0)}</td>
                    <td className="px-4 py-3">
                      {adjustingId === u.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={adjustMode}
                            onChange={(e) => setAdjustMode(e.target.value as "add" | "set")}
                            className="rounded border border-border bg-bg-primary px-1.5 py-0.5 text-xs outline-none"
                          >
                            <option value="add">{t("add_credit")}</option>
                            <option value="set">{t("set_credit")}</option>
                          </select>
                          <input
                            type="number"
                            min={1}
                            value={adjustValue}
                            onChange={(e) => setAdjustValue(e.target.value)}
                            placeholder={t("credit_amount")}
                            className="w-20 rounded border border-border bg-bg-primary px-1.5 py-0.5 text-xs outline-none"
                          />
                          <button onClick={() => applyCredit(u.id)} className="rounded bg-accent px-2 py-0.5 text-xs text-white hover:bg-accent-hover">{t("confirm")}</button>
                          <button onClick={() => setAdjustingId(null)} className="rounded border border-border/50 px-2 py-0.5 text-xs text-text-muted hover:text-text-primary">{t("cancel_edit")}</button>
                        </div>
                      ) : (
                        <button onClick={() => { setAdjustingId(u.id); setAdjustValue(""); setAdjustMode("add"); }} className="rounded border border-border/50 px-2 py-0.5 text-xs text-text-muted hover:text-text-primary hover:border-accent/30 transition-colors">{t("adjust_credits")}</button>
                      )}
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent-300 shadow-lg backdrop-blur-sm">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
