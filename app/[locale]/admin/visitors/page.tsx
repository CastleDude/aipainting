"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

interface Visitor {
  ip: string;
  country: string | null;
  user_agent: string | null;
  last_visit: string;
  first_visit: string;
  page_count: number;
  credits_used: number;
  total_visits: number;
}

function parseDevice(ua: string | null): string {
  if (!ua) return "-";
  const lower = ua.toLowerCase();
  if (/iphone|ipad|android.*mobile|blackberry|webos/.test(lower)) return "📱 手机";
  if (/ipad|android(?!.*mobile)|tablet/.test(lower)) return "📋 平板";
  return "💻 电脑";
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "-";
  const lower = ua.toLowerCase();
  if (lower.includes("edg/")) return "Edge";
  if (lower.includes("chrome") && !lower.includes("edg/")) return "Chrome";
  if (lower.includes("firefox")) return "Firefox";
  if (lower.includes("safari") && !lower.includes("chrome")) return "Safari";
  return "Other";
}

function duration(min: string, max: string): string {
  const ms = new Date(max).getTime() - new Date(min).getTime();
  if (ms < 60000) return "<1分钟";
  if (ms < 3600000) return `${Math.round(ms / 60000)}分钟`;
  return `${Math.round(ms / 3600000)}小时`;
}

export default function AdminVisitorsPage() {
  const { profile } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [device, setDevice] = useState("");
  const [sortBy, setSortBy] = useState("last_visit");
  const [sortOrder, setSortOrder] = useState("desc");

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("desc"); }
    setPage(1);
  };
  const sortArrow = (col: string) => sortBy === col ? (sortOrder === "asc" ? " ▲" : " ▼") : "";

  const COUNTRY_ZH: Record<string, string> = {
    AF:"阿富汗",AL:"阿尔巴尼亚",AR:"阿根廷",AU:"澳大利亚",AT:"奥地利",BE:"比利时",BR:"巴西",CA:"加拿大",CL:"智利",CN:"中国",CO:"哥伦比亚",CZ:"捷克",DK:"丹麦",EG:"埃及",EE:"爱沙尼亚",FI:"芬兰",FR:"法国",DE:"德国",GR:"希腊",HK:"香港",IN:"印度",ID:"印度尼西亚",IE:"爱尔兰",IL:"以色列",IT:"意大利",JP:"日本",KR:"韩国",MY:"马来西亚",MX:"墨西哥",NL:"荷兰",NZ:"新西兰",NG:"尼日利亚",NO:"挪威",PH:"菲律宾",PL:"波兰",PT:"葡萄牙",RU:"俄罗斯",SA:"沙特阿拉伯",SG:"新加坡",ZA:"南非",ES:"西班牙",SE:"瑞典",CH:"瑞士",TW:"台湾",TH:"泰国",TR:"土耳其",UA:"乌克兰",AE:"阿联酋",GB:"英国",US:"美国",VN:"越南",
  };
  const countryZh = (code: string | null) => code ? (COUNTRY_ZH[code.toUpperCase()] ? `${code} ${COUNTRY_ZH[code.toUpperCase()]}` : code) : "-";

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (country) params.set("country", country);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (device) params.set("device", device);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const res = await fetch(`/api/admin/visitors?${params}`);
      const data = await res.json();
      setVisitors(data.visitors || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, search, country, dateFrom, dateTo]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  if (!profile || profile.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-4">访客记录</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input type="text" placeholder="搜索 IP..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 w-40" />
        <input type="text" placeholder="国家..." value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 w-24" />
        <select value={device} onChange={(e) => { setDevice(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50">
          <option value="">全部设备</option>
          <option value="desktop">💻 电脑</option>
          <option value="mobile">📱 手机</option>
          <option value="tablet">📋 平板</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50" />
        <span className="text-xs text-text-muted">至</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50" />
        {(search || country || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setCountry(""); setDateFrom(""); setDateTo(""); setPage(1); }} className="text-xs text-text-muted hover:text-text-primary">清除筛选</button>
        )}
      </div>

      <div className="rounded-xl border border-border/50 bg-bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("ip")}>IP 地址{sortArrow("ip")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("country")}>国家{sortArrow("country")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">设备/浏览器</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("credits_used")}>积分消耗{sortArrow("credits_used")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("page_count")}>页面数{sortArrow("page_count")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("total_visits")}>累计访问{sortArrow("total_visits")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("first_visit")}>停留时长{sortArrow("first_visit")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("last_visit")}>最近访问{sortArrow("last_visit")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">加载中...</td></tr>
              ) : visitors.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">暂无访客数据</td></tr>
              ) : (
                visitors.map((v, i) => (
                  <tr key={`${v.ip}-${i}`} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors">
                    <td className="px-4 py-3 text-text-primary text-xs font-mono">{v.ip}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {countryZh(v.country)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {parseDevice(v.user_agent)} · {parseBrowser(v.user_agent)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {v.credits_used > 0 ? <span className="text-amber-400">{v.credits_used}</span> : "0"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{v.page_count}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs font-medium">{v.total_visits || v.page_count}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{duration(v.first_visit, v.last_visit)}</td>
                    <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                      {new Date(v.last_visit).toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <span className="text-xs text-text-muted">共 {total} 条</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-border/50 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30">上一页</button>
              <span className="px-2.5 py-1 text-xs text-text-secondary">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded border border-border/50 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
