"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

interface Visitor {
  ip: string;
  country: string | null;
  user_agent: string | null;
  referrer: string | null;
  last_visit: string;
  visit_type: string;
  first_visit: string;
  page_count: number;
  credits_used: number;
  total_visits: number;
}

function parseReferrer(ref: string | null): string {
  if (!ref) return "直接访问";
  try {
    const url = new URL(ref);
    const host = url.hostname.replace(/^www\./, "");
    if (host.includes("aipainting.top")) return "站内跳转";
    if (host.includes("google.com")) return "🔍 Google";
    if (host.includes("x.com") || host.includes("twitter.com")) return "🐦 X";
    if (host.includes("facebook.com")) return "📘 Facebook";
    if (host.includes("instagram.com")) return "📷 Instagram";
    if (host.includes("youtube.com")) return "▶️ YouTube";
    if (host.includes("reddit.com")) return "🤖 Reddit";
    if (host.includes("producthunt.com")) return "🐱 ProductHunt";
    if (host.includes("bing.com")) return "🔍 Bing";
    if (host.includes("baidu.com")) return "🔍 百度";
    if (host.includes("github.com")) return "🐙 GitHub";
    if (host.includes("duckduckgo.com")) return "🦆 DuckDuckGo";
    if (host.includes("aisearchindex.space")) return "🤖 AI搜索爬虫";
    if (host.includes("aqua-web.fi")) return "🇫🇮 芬兰爬虫";
    if (host.includes("stackscope.dev")) return "🔍 爬虫工具";
    if (/bot|crawler|spider|index/i.test(host)) return `🤖 ${host}`;
    return host;
  } catch { return ref; }
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
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}分钟`;
  return `${Math.floor(minutes / 60)}小时${minutes % 60}分钟`;
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
  const [source, setSource] = useState("");
  const [visitorType, setVisitorType] = useState("");
  const [sortBy, setSortBy] = useState("last_visit");
  const [sortOrder, setSortOrder] = useState("desc");

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("desc"); }
    setPage(1);
  };
  const sortArrow = (col: string) => sortBy === col ? (sortOrder === "asc" ? " ▲" : " ▼") : "";

  const COUNTRY_ZH: Record<string, string> = {
    AF:"阿富汗",AL:"阿尔巴尼亚",AR:"阿根廷",AU:"澳大利亚",AT:"奥地利",BD:"孟加拉国",BE:"比利时",BG:"保加利亚",BR:"巴西",CA:"加拿大",CH:"瑞士",CL:"智利",CN:"中国",CO:"哥伦比亚",CZ:"捷克",DE:"德国",DK:"丹麦",EE:"爱沙尼亚",EG:"埃及",ES:"西班牙",FI:"芬兰",FR:"法国",GB:"英国",GR:"希腊",HK:"香港",HU:"匈牙利",ID:"印度尼西亚",IE:"爱尔兰",IL:"以色列",IN:"印度",IR:"伊朗",IT:"意大利",JP:"日本",KE:"肯尼亚",KR:"韩国",KW:"科威特",KZ:"哈萨克斯坦",LT:"立陶宛",LV:"拉脱维亚",MA:"摩洛哥",MD:"摩尔多瓦",MM:"缅甸",MX:"墨西哥",MY:"马来西亚",NG:"尼日利亚",NL:"荷兰",NO:"挪威",NP:"尼泊尔",NZ:"新西兰",PH:"菲律宾",PK:"巴基斯坦",PL:"波兰",PT:"葡萄牙",QA:"卡塔尔",RO:"罗马尼亚",RS:"塞尔维亚",RU:"俄罗斯",SA:"沙特阿拉伯",SE:"瑞典",SG:"新加坡",SI:"斯洛文尼亚",SK:"斯洛伐克",TH:"泰国",TR:"土耳其",TW:"台湾",UA:"乌克兰",AE:"阿联酋",US:"美国",VE:"委内瑞拉",VN:"越南",ZA:"南非",
  };
  const countryZh = (code: string | null) => code ? (COUNTRY_ZH[code.toUpperCase()] ? `${code} ${COUNTRY_ZH[code.toUpperCase()]}` : code) : "-";

const COUNTRY_TZ: Record<string, string> = {
  CN: "Asia/Shanghai", HK: "Asia/Shanghai", TW: "Asia/Taipei", MO: "Asia/Macau",
  JP: "Asia/Tokyo", KR: "Asia/Seoul", SG: "Asia/Singapore", MY: "Asia/Kuala_Lumpur",
  TH: "Asia/Bangkok", VN: "Asia/Ho_Chi_Minh", ID: "Asia/Jakarta", PH: "Asia/Manila",
  IN: "Asia/Kolkata", PK: "Asia/Karachi", BD: "Asia/Dhaka", NP: "Asia/Kathmandu",
  US: "America/New_York", CA: "America/Toronto", MX: "America/Mexico_City",
  GB: "Europe/London", FR: "Europe/Paris", DE: "Europe/Berlin", IT: "Europe/Rome",
  ES: "Europe/Madrid", PT: "Europe/Lisbon", NL: "Europe/Amsterdam", BE: "Europe/Brussels",
  CH: "Europe/Zurich", AT: "Europe/Vienna", DK: "Europe/Copenhagen", SE: "Europe/Stockholm",
  NO: "Europe/Oslo", FI: "Europe/Helsinki", PL: "Europe/Warsaw", CZ: "Europe/Prague",
  RO: "Europe/Bucharest", GR: "Europe/Athens", TR: "Europe/Istanbul", UA: "Europe/Kyiv",
  RU: "Europe/Moscow", AE: "Asia/Dubai", SA: "Asia/Riyadh", QA: "Asia/Qatar",
  AU: "Australia/Sydney", NZ: "Pacific/Auckland",
  BR: "America/Sao_Paulo", AR: "America/Argentina/Buenos_Aires", CL: "America/Santiago",
  ZA: "Africa/Johannesburg", EG: "Africa/Cairo", KE: "Africa/Nairobi", NG: "Africa/Lagos",
  IL: "Asia/Jerusalem", KW: "Asia/Kuwait", KZ: "Asia/Almaty", IR: "Asia/Tehran",
  EE: "Europe/Tallinn", LV: "Europe/Riga", LT: "Europe/Vilnius", BG: "Europe/Sofia",
  HR: "Europe/Zagreb", SK: "Europe/Bratislava", SI: "Europe/Ljubljana", RS: "Europe/Belgrade",
  CO: "America/Bogota", VE: "America/Caracas", MA: "Africa/Casablanca", MM: "Asia/Yangon",
  HU: "Europe/Budapest",
};
const localTime = (utcTime: string, country: string | null): string => {
  const tz = country ? COUNTRY_TZ[country.toUpperCase()] : null;
  if (!tz) return new Date(utcTime).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  try { return new Date(utcTime).toLocaleString("zh-CN", { timeZone: tz }); } catch { return new Date(utcTime).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }); }
};

  const [limit, setLimit] = useState(20);
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
      if (source) params.set("source", source);
      if (visitorType) params.set("visitorType", visitorType);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const res = await fetch(`/api/admin/visitors?${params}`);
      const data = await res.json();
      setVisitors(data.visitors || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, limit, search, country, dateFrom, dateTo, device, source, visitorType, sortBy, sortOrder]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  if (!profile || profile.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-4">访客记录</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative w-40">
          <input type="text" placeholder="搜索 IP..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card pl-3 pr-7 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 w-full" />
          {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-sm">&times;</button>}
        </div>
        <div className="relative w-24">
          <input type="text" placeholder="国家..." value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card pl-3 pr-7 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 w-full" />
          {country && <button onClick={() => { setCountry(""); setPage(1); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-sm">&times;</button>}
        </div>
        <select value={device} onChange={(e) => { setDevice(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50">
          <option value="">全部设备</option>
          <option value="desktop">💻 电脑</option>
          <option value="mobile">📱 手机</option>
          <option value="tablet">📋 平板</option>
        </select>
        <select value={visitorType} onChange={(e) => { setVisitorType(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50">
          <option value="">全部类型</option>
          <option value="member">会员</option>
          <option value="returning">回头客</option>
          <option value="new">新访客</option>
          <option value="bot">🤖爬虫/疑似</option>
        </select>
        <div className="relative w-32">
          <input type="text" placeholder="来源..." value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card pl-3 pr-7 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 w-full" />
          {source && <button onClick={() => { setSource(""); setPage(1); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-sm">&times;</button>}
        </div>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50" />
        <span className="text-xs text-text-muted">至</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50" />
        {(search || country || dateFrom || dateTo || device || source) && (
          <button onClick={() => { setSearch(""); setCountry(""); setDateFrom(""); setDateTo(""); setDevice(""); setSource(""); setPage(1); }} className="text-xs text-text-muted hover:text-text-primary">清除筛选</button>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-text-muted">
          每页
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="rounded border border-border bg-bg-card px-2 py-1 text-xs text-text-primary outline-none">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          条
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-bg-card overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/50 bg-bg-secondary">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("ip")}>IP 地址{sortArrow("ip")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("visit_type")}>类型{sortArrow("visit_type")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("country")}>国家{sortArrow("country")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">设备/浏览器</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("referrer")}>来源{sortArrow("referrer")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("credits_used")}>积分消耗{sortArrow("credits_used")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("page_count")}>页面数{sortArrow("page_count")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("total_visits")}>累计访问{sortArrow("total_visits")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("first_visit")}>停留时长{sortArrow("first_visit")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary select-none" onClick={() => toggleSort("last_visit")}>最近访问(北京){sortArrow("last_visit")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">当地时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-text-muted">加载中...</td></tr>
              ) : visitors.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-text-muted">暂无访客数据</td></tr>
              ) : (
                visitors.map((v, i) => (
                  <tr key={`${v.ip}-${i}`} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors">
                    <td className="px-4 py-3 text-text-primary text-xs font-mono">{v.ip}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={v.visit_type === "回头客" ? "text-amber-400" : "text-text-muted"}>{v.visit_type}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {countryZh(v.country)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {parseDevice(v.user_agent)} · {parseBrowser(v.user_agent)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs max-w-[120px] truncate" title={v.referrer || ""}>
                      {parseReferrer(v.referrer)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {v.credits_used > 0 ? <span className="text-amber-400">{v.credits_used}</span> : "0"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{v.page_count}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs font-medium">{v.total_visits || v.page_count}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{duration(v.first_visit, v.last_visit)}</td>
                    <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                      {new Date(v.last_visit).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                      {localTime(v.last_visit, v.country)}
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
