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
  role: string;
  country?: string;
  created_at: string;
}

function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const a = 0x1F1E6 - 65 + code.toUpperCase().charCodeAt(0);
  const b = 0x1F1E6 - 65 + code.toUpperCase().charCodeAt(1);
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

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ tier: "", credits: "", daily_used: "", tools_daily_used: "", role: "", country: "" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setEditForm({ tier: u.tier, credits: String(u.credits), daily_used: String(u.daily_used || 0), tools_daily_used: String(u.tools_daily_used || 0), role: u.role, country: u.country || "" });
  };

  const saveEdit = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        updates: {
          tier: editForm.tier,
          credits: parseInt(editForm.credits) || 0,
          daily_used: parseInt(editForm.daily_used) || 0,
          tools_daily_used: parseInt(editForm.tools_daily_used) || 0,
          role: editForm.role,
          country: editForm.country,
        },
      }),
    });
    setEditingId(null);
    fetchUsers();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const ids = Array.from(selected);
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Delete failed");
      } else {
        setSelected(new Set());
        setConfirmDelete(false);
        fetchUsers();
      }
    } catch {
      setDeleteError("Network error");
    }
    setDeleting(false);
  };

  if (!profile || profile.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-4">{t("users_title")}</h1>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 w-64"
        />
        {selected.size > 0 && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {t("delete_selected")} ({selected.size})
          </button>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border/50 bg-bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-2">{t("delete_confirm_title")}</h3>
            <p className="text-sm text-text-secondary mb-1">{t("delete_confirm").replace("[[COUNT]]", String(selected.size))}</p>
            <p className="text-xs text-red-400 mb-5">{t("delete_warning")}</p>
            {deleteError && (
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
                className="rounded-lg border border-border/50 px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deleting ? "..." : t("confirm_delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-bg-secondary/50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selected.size === users.length}
                    onChange={toggleSelectAll}
                    className="rounded border-border/50 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_user")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_email")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_tier")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_credits")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_daily_used")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_role")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_country")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_created")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-text-muted">{t("loading")}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-text-muted">{t("no_data")}</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        className="rounded border-border/50 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-primary font-medium truncate max-w-[140px] inline-block align-bottom" title={(u.name?.length || 0) > 30 ? u.name : undefined}>{u.name || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <select
                          value={editForm.tier}
                          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                          className="rounded border border-border bg-bg-primary px-1.5 py-0.5 text-xs outline-none"
                        >
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                          <option value="ultimate">Ultimate</option>
                        </select>
                      ) : (
                        <span className={u.tier === "free" ? "text-text-muted" : "text-accent"}>{t(u.tier)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <input type="number" value={editForm.credits} onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })} className="w-20 rounded border border-border bg-bg-primary px-1.5 py-0.5 text-xs outline-none" />
                      ) : (
                        <span className="text-text-secondary">{u.credits}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={editForm.daily_used} onChange={(e) => setEditForm({ ...editForm, daily_used: e.target.value })} className="w-12 rounded border border-border bg-bg-primary px-1 py-0.5 text-xs outline-none" title={t("title_ai_gen")} />
                          <span className="text-text-muted text-[10px]">+</span>
                          <input type="number" value={editForm.tools_daily_used} onChange={(e) => setEditForm({ ...editForm, tools_daily_used: e.target.value })} className="w-12 rounded border border-border bg-bg-primary px-1 py-0.5 text-xs outline-none" title={t("title_tools")} />
                        </div>
                      ) : (
                        <span className="text-text-secondary">{(u.daily_used || 0) + (u.tools_daily_used || 0)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="rounded border border-border bg-bg-primary px-1.5 py-0.5 text-xs outline-none">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={u.role === "admin" ? "text-purple-400" : "text-text-muted"}>{u.role === "admin" ? t("role_admin") : t("role_user")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <input type="text" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value.toUpperCase().slice(0, 2) })} placeholder="CN" className="w-12 rounded border border-border bg-bg-primary px-1.5 py-0.5 text-xs outline-none" maxLength={2} />
                      ) : (
                        <span className="text-text-secondary text-xs">{countryFlag(u.country)} {countryName(u.country)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => saveEdit(u.id)} className="rounded bg-accent px-2 py-0.5 text-xs text-white hover:bg-accent-hover">{t("save")}</button>
                          <button onClick={() => setEditingId(null)} className="rounded border border-border/50 px-2 py-0.5 text-xs text-text-muted hover:text-text-primary">{t("cancel_edit")}</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(u)} className="rounded border border-border/50 px-2 py-0.5 text-xs text-text-muted hover:text-text-primary hover:border-accent/30 transition-colors">{t("edit")}</button>
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
    </div>
  );
}
