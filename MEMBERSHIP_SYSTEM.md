# 会员系统开发大纲

## 一、基础设施

### 1.1 Supabase 后端

- `users` 表：id, email, name, tier, credits, daily_used, daily_reset_at, role, created_at
- `subscriptions` 表：id, user_id, tier, status, creem_subscription_id, current_period_start/end
- `orders` 表：id, user_id, amount, tier, status, creem_order_id, created_at
- RLS 策略

### 1.2 客户端

- `lib/supabase-server.ts` — 服务端 Supabase（service_role）
- `lib/supabase-middleware.ts` — Middleware 用（cookie 会话）

---

## 二、认证系统

- `components/AuthProvider.tsx` — Auth Context + `useAuth()` hook
- `components/LoginModal.tsx` 改造 — 接入 Supabase 登录/注册
- `components/Header.tsx` 改造 — 登录态切换、用户下拉菜单
- `middleware.ts` 改造 — 路由保护

---

## 三、会员体系

- Dashboard 页面（用量、套餐、升级入口）
- 积分系统接入 ImageGenerator + API 限流
- 定价页改造（已登录直入支付）

---

## 四、支付集成（Creem.io）

### 4.1 Creem Checkout

- `app/api/creem/checkout/route.ts` — 创建支付会话
- `app/api/creem/webhook/route.ts` — 接收支付/订阅/退款事件
- 套餐映射：Basic $6、Premium $10、Ultimate $20

### 4.2 订阅管理

- Dashboard 展示订阅状态
- Creem Customer Portal 自助升级/降级/取消
- Webhook 同步到 Supabase

---

## 五、管理后台

### 5.1 管理员认证

- `users.role` 字段区分 `admin` / `user`
- 管理后台路由独立鉴权

### 5.2 管理后台页面

| 页面                   | 功能                                              |
| ---------------------- | ------------------------------------------------- |
| `/admin`               | 概览仪表盘：总用户数、付费率、今日收入、活跃模型  |
| `/admin/users`         | 用户列表、搜索、查看详情、禁用/启用、手动调整积分 |
| `/admin/orders`        | 订单列表、支付状态、退款处理                      |
| `/admin/subscriptions` | 订阅管理、到期时间、手动取消                      |
| `/admin/credits`       | 积分发放记录、批量赠送                            |
| `/admin/settings`      | 系统配置：模型开关、免费额度调整、公告管理        |

### 5.3 API 层

- `app/api/admin/*` — 管理端接口，校验 admin role
- 统计数据聚合、用户搜索、积分管理

---

## 六、API 层改造

- `lib/auth-guard.ts` — 鉴权辅助函数
- `POST /api/generate` — 积分校验 + 扣减
- AI 工具接口 — 每日免费次数限制

---

## 七、文件变更清单

| 操作 | 文件                                   | 说明                 |
| ---- | -------------------------------------- | -------------------- |
| 新建 | `components/AuthProvider.tsx`          | Auth Context         |
| 新建 | `lib/supabase-server.ts`               | 服务端 Supabase      |
| 新建 | `lib/supabase-middleware.ts`           | Middleware Supabase  |
| 新建 | `lib/auth-guard.ts`                    | API 鉴权             |
| 新建 | `app/[locale]/dashboard/page.tsx`      | 用户中心             |
| 新建 | `app/api/creem/checkout/route.ts`      | Creem 支付           |
| 新建 | `app/api/creem/webhook/route.ts`       | Creem Webhook        |
| 新建 | `app/[locale]/admin/page.tsx`          | 管理仪表盘           |
| 新建 | `app/[locale]/admin/users/page.tsx`    | 用户管理             |
| 新建 | `app/[locale]/admin/orders/page.tsx`   | 订单管理             |
| 新建 | `app/[locale]/admin/credits/page.tsx`  | 积分管理             |
| 新建 | `app/[locale]/admin/settings/page.tsx` | 系统设置             |
| 新建 | `app/api/admin/users/route.ts`         | 用户管理 API         |
| 新建 | `app/api/admin/orders/route.ts`        | 订单管理 API         |
| 新建 | `app/api/admin/credits/route.ts`       | 积分管理 API         |
| 新建 | `app/api/admin/stats/route.ts`         | 统计数据 API         |
| 改造 | `components/Header.tsx`                | 登录态 + 后台入口    |
| 改造 | `components/LoginModal.tsx`            | Supabase Auth        |
| 改造 | `components/ImageGenerator.tsx`        | 动态积分             |
| 改造 | `middleware.ts`                        | Session + Admin 鉴权 |
| 改造 | `app/api/generate/route.ts`            | 积分校验             |
| 改造 | `app/[locale]/layout.tsx`              | 包裹 AuthProvider    |
| 改造 | `messages/en.json`                     | 新增 i18n            |
| 改造 | `messages/zh.json`                     | 新增 i18n            |

---

## 八、开发顺序

```
第 1 步：Supabase 后端建表 + AuthProvider + LoginModal 改造
        → 注册/登录跑通

第 2 步：Header 登录态 + Middleware 路由保护
        → 前台鉴权体系完成

第 3 步：积分系统接入 ImageGenerator + API 限流
        → 免费/付费额度生效

第 4 步：Dashboard 用户中心
        → 用户查看用量、套餐、升级入口

第 5 步：Creem 支付集成 + Webhook
        → 订阅付费跑通

第 6 步：管理后台
        ├─ 6.1 管理仪表盘 + 鉴权
        ├─ 6.2 用户管理（列表/搜索/禁用/调积分）
        ├─ 6.3 订单 + 订阅管理
        └─ 6.4 系统设置（模型开关/免费额度/公告）

第 7 步：AI 工具积分集成
        → remove_bg / replace_bg / smooth 接入会员限制
```

··················································

Raphael.app 商业模式拆解
定价与你的完全一致
套餐 Raphael AI 画境（你）
Free 无限（慢速队列） 20 张/天
Premium $10/月 2000 积分 $10/月 2000 积分
Ultimate $20/月 5000 积分 $20/月 5000 积分
他们用的模型

FLUX.1-Dev（主力）→ Flux Kontext → Flux 2 → Z-Image → Qwen-Image → Nano Banana 2
核心策略：智能路由 —— 根据 prompt 类型自动选模型，不是用户手动选。

他们怎么赚钱的
策略 具体做法
Free 用户不亏 走慢速队列，GPU 空闲时批处理，成本压到接近 $0.001/张
分层模型 Free → 最便宜的 FLUX.1-Dev，Paid → Flux Pro/Nano Banana
快速模式溢价 "Fast Mode" 才是真正卖的产品，慢速只是引流
广告收入 近期加入了广告，免费用户看广告出图
有水印 Free 用户图片带水印，付费去水印
利润估算

Free 用户：无限生成 × 慢速队列 × FLUX.1-Dev $0.003/张
假设月均 300 张 = $0.90 成本 → 靠广告覆盖

Premium $10 = 2000 积分：
假设 70% 走便宜模型($0.003) + 30% 走好模型($0.01)
混合成本 ≈ 2000 × $0.005 = $10/月
毛利率 ≈ 0~10%（勉强打平）

Ultimate $20 = 5000 积分：
同样混合成本 ≈ $25/月
可能略亏，但 Ultimate 用户不会用完
关键洞察
Raphael 的 "无限免费" 不是真的无限：

慢速队列 = 你可能等 30 秒到几分钟
有水印、低分辨率
大部分用户试几次就走了，实际人均用量很低
真正重度用户会付费买快速模式
你比 Raphael 更有优势的地方：

Raphael 你（用 Runware）
Free 成本/张 ~$0.003 $0.0006 (Flux Schnell)
Premium 2000 张成本 ~$10 $2.60 (SDXL)
Premium 毛利率 ~0% 74%
需要靠广告 是 不需要
Raphael 用 $10 勉强打平，你用 Runware 同样 $10 能赚 $7.40。

这是因为 Raphael 主要用 FLUX.1-Dev（$0.003），而 Runware 的 SDXL 只要 $0.0013、Flux Schnell 只要 $0.0006，质量持平但价格低 3-5 倍。

建议：保持你现在的定价不变（和 Raphael 对标），后端切 Runware，Free 用 Flux Schnell、付费用 SDXL，整体毛利率 70%+ 完全可行。
