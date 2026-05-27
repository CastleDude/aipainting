# Raphael.app 分析报告 & 复刻计划

## 一、网站风格

- **极简主义设计**：深色主题为主，界面干净，聚焦核心功能"输入提示词→生成图片"
- **零门槛体验**：无需注册，打开即用，只有输入框和参数选择器
- **Landing Page** 展示高质量AI生成样图、社会证明（4.9/5评分、25K+用户）
- 整体视觉语言偏现代科技感，与 Midjourney/Leonardo.AI 类似但更轻量

## 二、开发技术

| 层级 | 技术选型 |
|------|----------|
| **前端框架** | Next.js 14 (App Router) |
| **样式方案** | TailwindCSS |
| **数据库/认证** | Supabase (PostgreSQL) |
| **图片存储** | Cloudflare R2 (10分钟自动删除) |
| **部署平台** | Vercel / Cloudflare Pages (边缘部署) |
| **支付服务** | Creem.io (Merchant of Record 模式) |
| **机器人防护** | Cloudflare Turnstile |
| **AI 路由** | OpenAI API + OpenRouter (多模型调度) |
| **开发工具** | 自带 Cursor Rules，Cursor AI 友好 |

## 三、开发难度

**整体评级：中等偏低**

- 技术栈成熟稳定，Next.js + Supabase 有大量文档和社区支持
- 核心复杂度在 **多AI模型的路由调度** 和 **高并发图片生成队列管理**
- 支付集成使用 Creem.io 的 MoR 模式，降低合规和税务复杂性
- 多语言（32种）的工程化管理有一定工作量
- 创始人本身将其定位为"新手也能做"的产品，配套开源 starter kit (raphael-starterkit-v1)

## 四、网站架构

```
用户浏览器
    │
    ▼
Cloudflare CDN / Turnstile
    │
    ▼
Next.js 14 (Vercel/Cloudflare Pages 边缘部署)
    │
    ├──► Supabase (认证 + 用户数据 + PostgreSQL)
    │
    ├──► OpenAI API / OpenRouter ─► GPT-4o Image
    │                              ├─► Flux Kontext/Kontext Max
    │                              ├─► Flux 2 Pro/Flex
    │                              ├─► Gemini 3/2.5/3.1 Flash
    │                              └─► Seedream 4/4.5/5.0
    │
    ├──► Cloudflare R2 (临时图片存储，10分钟TTL)
    │
    └──► Creem.io (支付处理)
```

## 五、网站功能

| 功能 | 说明 |
|------|------|
| **文生图** | 输入提示词（最长500字符），一次生成4张变体 |
| **图生图** | 上传参考图片（JPG/PNG，≤20MB），可调节影响度 |
| **AI 图片编辑** | 风格混合、细节增强、色彩调整、扩图/外绘、背景消除/抠图 |
| **AI 视频生成** | 关联视频创作工具 |
| **Negative Prompt** | 指定要排除的元素 |
| **风格控制** | 写实摄影、艺术插画、动漫、电影风格、吉卜力、油画等 |
| **分辨率** | 最高支持 4K（4096×4096），多种宽高比（1:1 到 8:1） |
| **隐私保护** | 零数据留存，提示词和图片不存服务器，10分钟后自动删除 |
| **商用授权** | 声称生成的图片可用于个人及商业用途 |

## 六、使用的 AI 模型

| 模型 | 提供商 |
|------|--------|
| **GPT-4o Image** | OpenAI |
| **Flux Kontext Pro / Max** | Black Forest Labs |
| **Flux 2 Pro / Flex** | Black Forest Labs |
| **Gemini 3 Pro Image** | Google |
| **Gemini 2.5 / 3.1 Flash Image** | Google |
| **Seedream 4 / 4.5 / 5.0** | 字节跳动 |
| **Nano Banana 系列** | 付费会员专享 |

共 9+ 模型，通过 OpenRouter 统一调度。

## 七、会员机制

| | Free | Premium | Ultimate |
|------|------|------|------|
| **价格** | 免费 | $10/月 | $20/月 |
| **月度积分** | 10积分/天 | 2,000积分/月 | 5,000积分/月 |
| **快速生成** | 10张/天 | 2,000张/月 | 5,000张/月 |
| **基础生成** | 无限（慢速排队） | 无限 | 无限 |
| **视频生成** | 2个/天 | 400个/月 | 1,000个/月 |
| **队列优先级** | 普通 | 优先 | 最高优先 |
| **最高分辨率** | 基础 | 1K (Pro) | 2K (Ultra) |
| **广告/水印** | 有 | 无 | 无 |
| **退款政策** | - | 不支持退款 | 不支持退款 |

## 八、变现方式

1. **Freemium 模式**：免费版吸引流量（月活100万+），广告+功能限制引导付费
2. **订阅收入**：Premium ($10/月) + Ultimate ($20/月)
3. **按需付费**：Pay As You Go，不订阅也可单次购买积分
4. **广告收入**：免费用户使用时展示广告
5. **知识付费**：创始人通过"Idea To Business"课程+开源 Starter Kit 建立个人品牌

## 九、支付方式

- **支付服务商**：Creem.io
- **支付模式**：Merchant of Record (MoR)，Creem 作为法定商户处理税务/合规/发票
- **支持方式**：全球信用卡 (Visa/Mastercard)
- **对中国商家优势**：支持中国大陆开发者收款，无需海外公司主体
- **退款政策**：明确声明不支持退款

## 十、SEO 优化

| 优化维度 | 具体措施 |
|------|------|
| **核心关键词** | 首页 H1 精准定位 `Free Unlimited AI Image Generator` |
| **长尾词矩阵** | 为每个功能页面铺设长尾关键词 |
| **结构化数据** | FAQ 区域围绕核心关键词优化 |
| **Hreflang** | 32 种语言均配 hreflang 标签，避免多语言被判重复 |
| **外链策略** | 高质量自然外链（AI工具导航站、博客评测、社媒传播） |
| **社会证明** | 首页展示评分 + 用户数，提升CTR和转化率 |
| **流量成果** | 直接访问占 59.16%，月访问约 100 万 |

## 十一、多语言

**支持 32 种语言**，核心语言：英语、简繁体中文、日语、韩语、德语、俄语、菲律宾语。

流量地理分布：中国大陆 20.45%、美国 12.57%、中国台湾 9.11%，其余来自 150+ 国家。

---

## 服务器配置分析

### raphael.app 实际使用的服务器

- DNS 解析到 Meta/Facebook 边缘网络 (IPv6 含 `face:b00c` 标志)
- 前端：Vercel Serverless Functions / Cloudflare Pages
- 后端：Supabase 托管 PostgreSQL
- 图片存储：Cloudflare R2 对象存储
- AI 推理：早期用自建 A100 GPU 跑 FLUX.1-Dev，v2.0 后全部转为 OpenAI/Google/OpenRouter API 调用

### 搭建成本估算 (纯 API 模式)

| 组件 | 方案 | 月费 |
|------|------|------|
| 前端托管 | Vercel Hobby | $0 |
| 数据库 | Supabase 免费版 | $0 |
| 存储 | Cloudflare R2 10GB | $0 |
| 认证 | Supabase Auth | $0 |
| 支付 | Creem.io | 按交易抽成 |
| AI API | OpenRouter 按量 | $50-200 (MVP阶段) |

### GPU 自托管成本参考

| GPU | 显存 | 云计算月租 | FLUX生成速度 |
|------|------|------|------|
| RTX 4090 | 24GB | $300-600 | 3-5秒/张 |
| A100 40GB | 40GB | $1,200-1,800 | 1-2秒/张 |
| A100 80GB | 80GB | $1,500-2,500 | <1秒/张 |

---

## 复刻路线图

### 第一阶段：MVP (月成本 $50-200)
- 基于 raphael-starterkit-v1 脚手架
- 走纯 API 调用，不买 GPU
- 免费额度 5张/天，超额付费
- 接 2-3 个模型：Flux 2 Flex + Seedream 4 + Gemini 3 Flash

### 第二阶段：PMF 验证 (月成本 $500-2,000)
- 根据用户反馈迭代
- 增加模型种类
- 优化成本结构

### 第三阶段：自托管转型 (API费用 > $5,000/月)
- 租用 A100 跑高频模型
- 长尾模型继续走 API

### 避免的坑
- ❌ 不要完全免费起步（没有免费GPU资源）
- ❌ 不要10分钟删图（存R2成本极低）
- ❌ 不要先免费再收割（用户反弹大）
- ✅ 第一天就设免费额度 + 透明定价
- ✅ 选一个细分场景做深（电商产品图/头像/动漫/壁纸）
- ✅ 上线即配好 hreflang + 核心关键词
