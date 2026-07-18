"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

interface AnalyticsData {
  todayVisits: number;
  todayIpCount: number;
  todayCountries: number;
  onlineNow: number;
}

interface AdminStats {
  totalUsers: number;
  payingUsers: number;
  totalOrders: number;
  recentOrders: Array<{
    id: string;
    user_email: string;
    tier: string;
    amount: number;
    currency: string;
    created_at: string;
  }>;
}

interface DashboardMessages {
  title: string;
  total_users: string;
  paying_users: string;
  total_orders: string;
  recent_orders: string;
  user: string;
  tier: string;
  amount: string;
  date: string;
  no_orders: string;
  free: string;
  premium: string;
  ultimate: string;
  loading: string;
}

export function AdminDashboard({ messages }: { messages: DashboardMessages }) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [alerts, setAlerts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/admin/analytics").then(r => r.json()),
      fetch("/api/admin/alerts").then(r => r.json()),
    ])
      .then(([statsData, analyticsData, alertsData]) => {
        setStats(statsData);
        setAnalytics(analyticsData.realtime);
        setAlerts(alertsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!profile || profile.role !== "admin") {
    return null;
  }

  const cards = [
    { label: messages.total_users, value: stats?.totalUsers ?? "-", color: "from-blue-500 to-cyan-500" },
    { label: messages.paying_users, value: stats?.payingUsers ?? "-", color: "from-purple-500 to-pink-500" },
    { label: messages.total_orders, value: stats?.totalOrders ?? "-", color: "from-amber-500 to-orange-500" },
  ];

  const analyticsCards = analytics ? [
    { label: "今日IP数", value: analytics.todayIpCount, color: "text-green-400" },
    { label: "今日访问(页面)", value: analytics.todayVisits, color: "text-blue-400" },
    { label: "今日国家", value: analytics.todayCountries, color: "text-cyan-400" },
    { label: "在线(5分钟)", value: analytics.onlineNow, color: "text-amber-400" },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{messages.title}</h1>
        {profile?.last_login_at && (
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span title={profile.last_login_at}>
              上次登录：{new Date(profile.last_login_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
            </span>
            {profile.last_login_country && (
              <span>📍 {profile.last_login_country}</span>
            )}
            {profile.last_login_ip && (
              <span>🔗 {profile.last_login_ip}</span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">{messages.loading}</p>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-border/50 bg-bg-card p-5">
                <p className="text-sm text-text-muted mb-1">{card.label}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Analytics cards */}
          {analyticsCards.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-4 mb-8">
              {analyticsCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-border/50 bg-bg-card p-5">
                  <p className="text-sm text-text-muted mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Alerts */}
          {alerts && (alerts.pendingOrders > 0 || alerts.expiringSubs > 0 || alerts.zeroCreditUsers > 0 || alerts.todayErrors > 0) && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mb-8">
              <h2 className="text-sm font-semibold text-amber-400 mb-3">⚠ 提醒</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {alerts.pendingOrders > 0 && <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" /><span className="text-text-secondary">{alerts.pendingOrders} 笔待处理订单</span></div>}
                {alerts.expiringSubs > 0 && <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" /><span className="text-text-secondary">{alerts.expiringSubs} 个订阅即将到期(7天内)</span></div>}
                {alerts.zeroCreditUsers > 0 && <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-red-400 shrink-0" /><span className="text-text-secondary">{alerts.zeroCreditUsers} 个付费用户积分耗尽</span></div>}
                {alerts.todayErrors > 0 && <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-red-400 shrink-0" /><span className="text-text-secondary">今日 {alerts.todayErrors} 次服务端错误</span></div>}
              </div>
            </div>
          )}

          {/* Recent orders */}
          <div className="rounded-xl border border-border/50 bg-bg-card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">{messages.recent_orders}</h2>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left">
                      <th className="pb-3 font-medium text-text-muted">{messages.user}</th>
                      <th className="pb-3 font-medium text-text-muted">{messages.tier}</th>
                      <th className="pb-3 font-medium text-text-muted">{messages.amount}</th>
                      <th className="pb-3 font-medium text-text-muted hidden sm:table-cell">{messages.date}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/30">
                        <td className="py-2.5 text-text-primary">{order.user_email}</td>
                        <td className="py-2.5">
                          <span className="inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            {order.tier}
                          </span>
                        </td>
                        <td className="py-2.5 text-text-primary">
                          {(order.amount / 100).toFixed(2)} {order.currency}
                        </td>
                        <td className="py-2.5 text-text-muted hidden sm:table-cell">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-text-muted">{messages.no_orders}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
