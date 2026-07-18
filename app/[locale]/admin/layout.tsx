import { getMessages } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  const navMessages = {
    dashboard: messages.admin?.dashboard || "Dashboard",
    users: messages.admin?.users || "Users",
    orders: messages.admin?.orders || "Orders",
    credits: messages.admin?.credits || "Credits",
    subscriptions: messages.admin?.subscriptions || "Subscriptions",
    settings: messages.admin?.settings || "Settings",
    visitors: messages.admin?.visitors || "访客记录",
    feedback: "留言管理",
    back_to_site: messages.admin?.back_to_site || "Back to Site",
  };

  return <AdminShell messages={navMessages}>{children}</AdminShell>;
}
