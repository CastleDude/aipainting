"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!profile || profile.role !== "admin") {
    return null;
  }

  const cards = [
    {
      label: messages.total_users,
      value: stats?.totalUsers ?? "-",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: messages.paying_users,
      value: stats?.payingUsers ?? "-",
      color: "from-purple-500 to-pink-500",
    },
    {
      label: messages.total_orders,
      value: stats?.totalOrders ?? "-",
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">{messages.title}</h1>

      {loading ? (
        <p className="text-text-muted text-sm">{messages.loading}</p>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-border/50 bg-bg-card p-5">
                <p className="text-sm text-text-muted mb-1">{card.label}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

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
