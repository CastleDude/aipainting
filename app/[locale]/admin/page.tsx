import { getMessages } from "next-intl/server";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const messages = await getMessages();
  const t = messages.admin || {};

  const dashboardMessages = {
    title: t.title || "Admin Dashboard",
    total_users: t.total_users || "Total Users",
    paying_users: t.paying_users || "Paying Users",
    total_orders: t.total_orders || "Total Orders",
    recent_orders: t.recent_orders || "Recent Orders",
    user: t.user || "User",
    tier: t.tier || "Tier",
    amount: t.amount || "Amount",
    date: t.date || "Date",
    no_orders: t.no_orders || "No orders yet",
    free: t.free || "Free",
    premium: t.premium || "Premium",
    ultimate: t.ultimate || "Ultimate",
    loading: t.loading || "Loading...",
  };

  return <AdminDashboard messages={dashboardMessages} />;
}
