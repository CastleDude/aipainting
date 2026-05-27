"use client";

import { useState, useEffect } from "react";

interface SystemStatus {
  supabase: {
    configured: boolean;
    connected: boolean;
    url: string | null;
    service_role: boolean;
    userCount: number;
    error?: string;
  };
  creem: { configured: boolean };
  auth: { email: boolean; google: boolean };
  dev: { mock_user: boolean };
  app: { node_env: string; next_version: string };
}

export default function AdminSettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-text-muted">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4">Loading system status...</p>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6">
        <p className="text-danger">{error || "Failed to load system status"}</p>
      </div>
    );
  }

  const StatusBadge = ({ ok }: { ok: boolean }) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
      {ok ? "OK" : "N/A"}
    </span>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">System Settings</h1>

      <div className="grid gap-6 max-w-3xl">
        {/* Supabase */}
        <section className="rounded-xl border border-border/50 bg-bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
            </svg>
            Supabase
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Connection URL</span>
              <span className="text-text-primary font-mono">{status.supabase.url || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Database</span>
              <StatusBadge ok={status.supabase.connected} />
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Service Role Key</span>
              <StatusBadge ok={status.supabase.service_role} />
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Total Users</span>
              <span className="text-text-primary font-mono">{status.supabase.userCount}</span>
            </div>
            {status.supabase.error && (
              <div className="text-xs text-danger mt-2">Error: {status.supabase.error}</div>
            )}
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-xl border border-border/50 bg-bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Payment (Creem)
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">API Key + Webhook Secret</span>
              <StatusBadge ok={status.creem.configured} />
            </div>
          </div>
        </section>

        {/* Auth */}
        <section className="rounded-xl border border-border/50 bg-bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Authentication
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Email / Password</span>
              <StatusBadge ok={status.auth.email} />
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Google OAuth</span>
              <StatusBadge ok={status.auth.google} />
            </div>
          </div>
        </section>

        {/* Environment */}
        <section className="rounded-xl border border-border/50 bg-bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Environment
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Node Environment</span>
              <span className="text-text-primary font-mono">{status.app.node_env}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Next.js Version</span>
              <span className="text-text-primary font-mono">{status.app.next_version}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-secondary">Dev Mock User</span>
              <StatusBadge ok={status.dev.mock_user} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
