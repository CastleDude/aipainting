"use client";

import { useEffect, useState, useCallback } from "react";

interface Order {
  id: string;
  tier: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  user_email: string;
  user_name: string;
  country: string | null;
}

interface OrderHistoryProps {
  onBack: () => void;
  messages: {
    order_history_title: string;
    order_id: string;
    user: string;
    country: string;
    tier: string;
    amount: string;
    payment_method: string;
    online_pay: string;
    status: string;
    time: string;
    back: string;
    loading: string;
    no_orders: string;
    tier_free: string;
    tier_basic: string;
    tier_premium: string;
    tier_ultimate: string;
    status_completed: string;
    status_refunded: string;
    status_pending: string;
    status_active: string;
    status_canceled: string;
    status_expired: string;
  };
}

function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const a = 0x1f1e6 - 65 + code.toUpperCase().charCodeAt(0);
  const b = 0x1f1e6 - 65 + code.toUpperCase().charCodeAt(1);
  return String.fromCodePoint(a, b);
}

const COUNTRY_ZH: Record<string, string> = {
  AF: "阿富汗", AL: "阿尔巴尼亚", DZ: "阿尔及利亚", AD: "安道尔", AO: "安哥拉",
  AR: "阿根廷", AM: "亚美尼亚", AU: "澳大利亚", AT: "奥地利", AZ: "阿塞拜疆",
  BH: "巴林", BD: "孟加拉国", BY: "白俄罗斯", BE: "比利时", BZ: "伯利兹",
  BJ: "贝宁", BT: "不丹", BO: "玻利维亚", BA: "波黑", BW: "博茨瓦纳",
  BR: "巴西", BN: "文莱", BG: "保加利亚", BF: "布基纳法索", BI: "布隆迪",
  KH: "柬埔寨", CM: "喀麦隆", CA: "加拿大", CV: "佛得角", CF: "中非",
  TD: "乍得", CL: "智利", CN: "中国", CO: "哥伦比亚", CG: "刚果（布）",
  CD: "刚果（金）", CR: "哥斯达黎加", CI: "科特迪瓦", HR: "克罗地亚", CU: "古巴",
  CY: "塞浦路斯", CZ: "捷克", DK: "丹麦", DJ: "吉布提", DO: "多米尼加",
  EC: "厄瓜多尔", EG: "埃及", SV: "萨尔瓦多", GQ: "赤道几内亚", ER: "厄立特里亚",
  EE: "爱沙尼亚", ET: "埃塞俄比亚", FJ: "斐济", FI: "芬兰", FR: "法国",
  GA: "加蓬", GM: "冈比亚", GE: "格鲁吉亚", DE: "德国", GH: "加纳",
  GR: "希腊", GT: "危地马拉", GN: "几内亚", GY: "圭亚那", HT: "海地",
  HN: "洪都拉斯", HK: "香港", HU: "匈牙利", IS: "冰岛", IN: "印度",
  ID: "印度尼西亚", IR: "伊朗", IQ: "伊拉克", IE: "爱尔兰", IL: "以色列",
  IT: "意大利", JM: "牙买加", JP: "日本", JO: "约旦", KZ: "哈萨克斯坦",
  KE: "肯尼亚", KW: "科威特", KG: "吉尔吉斯斯坦", LA: "老挝", LV: "拉脱维亚",
  LB: "黎巴嫩", LY: "利比亚", LT: "立陶宛", LU: "卢森堡", MO: "澳门",
  MG: "马达加斯加", MW: "马拉维", MY: "马来西亚", MV: "马尔代夫", ML: "马里",
  MT: "马耳他", MX: "墨西哥", MD: "摩尔多瓦", MC: "摩纳哥", MN: "蒙古",
  MA: "摩洛哥", MZ: "莫桑比克", MM: "缅甸", NA: "纳米比亚", NP: "尼泊尔",
  NL: "荷兰", NZ: "新西兰", NI: "尼加拉瓜", NE: "尼日尔", NG: "尼日利亚",
  KP: "朝鲜", NO: "挪威", OM: "阿曼", PK: "巴基斯坦", PS: "巴勒斯坦",
  PA: "巴拿马", PY: "巴拉圭", PE: "秘鲁", PH: "菲律宾", PL: "波兰",
  PT: "葡萄牙", QA: "卡塔尔", RO: "罗马尼亚", RU: "俄罗斯", RW: "卢旺达",
  SA: "沙特阿拉伯", SN: "塞内加尔", RS: "塞尔维亚", SG: "新加坡", SK: "斯洛伐克",
  SI: "斯洛文尼亚", SO: "索马里", ZA: "南非", KR: "韩国", ES: "西班牙",
  LK: "斯里兰卡", SD: "苏丹", SE: "瑞典", CH: "瑞士", SY: "叙利亚",
  TW: "台湾", TJ: "塔吉克斯坦", TZ: "坦桑尼亚", TH: "泰国", TG: "多哥",
  TN: "突尼斯", TR: "土耳其", TM: "土库曼斯坦", UG: "乌干达", UA: "乌克兰",
  AE: "阿联酋", GB: "英国", US: "美国", UY: "乌拉圭", UZ: "乌兹别克斯坦",
  VE: "委内瑞拉", VN: "越南", YE: "也门", ZM: "赞比亚", ZW: "津巴布韦",
};

function countryName(code: string | null | undefined): string {
  if (!code) return "-";
  const name = COUNTRY_ZH[code.toUpperCase()];
  return name || code.toUpperCase();
}

export function OrderHistory({ onBack, messages }: OrderHistoryProps) {

  const tierNames: Record<string, string> = {
    free: messages.tier_free || "Free",
    basic: messages.tier_basic || "Basic",
    premium: messages.tier_premium || "Premium",
    ultimate: messages.tier_ultimate || "Ultimate",
  };

  const statusNames: Record<string, string> = {
    completed: messages.status_completed || "Completed",
    refunded: messages.status_refunded || "Refunded",
    pending: messages.status_pending || "Pending",
    active: messages.status_active || "Active",
    canceled: messages.status_canceled || "Canceled",
    expired: messages.status_expired || "Expired",
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="rounded-xl border border-border/50 bg-bg-card p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {messages.order_history_title}
        </h2>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-3 py-1.5 text-xs text-text-muted hover:text-white hover:bg-white/15 hover:border-white/15 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {messages.back}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-bg-secondary/50">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase whitespace-nowrap">
                {messages.order_id}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase whitespace-nowrap">
                {messages.user}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase whitespace-nowrap">
                {messages.country}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase whitespace-nowrap">
                {messages.tier}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase whitespace-nowrap">
                {messages.amount}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase whitespace-nowrap">
                {messages.payment_method}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase whitespace-nowrap">
                {messages.status}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase whitespace-nowrap">
                {messages.time}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-text-muted">
                  {messages.loading}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-text-muted">
                  {messages.no_orders}
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors">
                  <td className="px-3 py-2.5 text-text-primary font-mono text-xs" title={o.id}>
                    {o.id.slice(0, 12)}...
                  </td>
                  <td className="px-3 py-2.5 text-text-primary text-xs">
                    {o.user_email}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary text-xs">
                    {o.country ? `${countryFlag(o.country)} ${countryName(o.country)}` : "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.tier === "ultimate" ? "bg-purple-500/15 text-purple-400" :
                      o.tier === "premium" ? "bg-amber-500/15 text-amber-400" :
                      o.tier === "basic" ? "bg-blue-500/15 text-blue-400" :
                      "bg-text-muted/15 text-text-muted"
                    }`}>
                      {tierNames[o.tier] || o.tier}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-primary text-xs font-medium">
                    ${((o.amount || 0) / 100).toFixed(2)} {o.currency || "USD"}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary text-xs">
                    {messages.online_pay}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.status === "completed" ? "bg-green-500/15 text-green-400" :
                      o.status === "refunded" ? "bg-red-500/15 text-red-400" :
                      "bg-text-muted/15 text-text-muted"
                    }`}>
                      {statusNames[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-muted text-xs whitespace-nowrap">
                    {new Date(o.created_at).toLocaleString("zh-CN", {
                      year: "numeric", month: "2-digit", day: "2-digit",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <span className="text-xs text-text-muted">{total} 条记录</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded bg-white/5 border border-white/5 px-2.5 py-1 text-xs text-text-secondary hover:text-white hover:bg-white/15 disabled:opacity-30"
            >
              &laquo; 上一页
            </button>
            <span className="px-2.5 py-1 text-xs text-text-secondary">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded bg-white/5 border border-white/5 px-2.5 py-1 text-xs text-text-secondary hover:text-white hover:bg-white/15 disabled:opacity-30"
            >
              下一页 &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
