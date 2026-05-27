import type { Metadata } from "next";

const LOGIN_META: Record<string, { title: string; description: string }> = {
  en: { title: "Log In — AI Painting", description: "Log in or create an account to unlock unlimited AI image generation, priority queue, and all premium models." },
  zh: { title: "登录 — AI 画境", description: "登录或创建账户，解锁无限 AI 图像生成、优先队列和所有高级模型。" },
  "zh-Hant": { title: "登入 — AI 畫境", description: "登入或建立帳戶，解鎖無限 AI 圖像生成、優先佇列和所有高級模型。" },
  ja: { title: "ログイン — AI ペインティング", description: "ログインまたはアカウントを作成して、無制限のAI画像生成、優先キュー、すべてのプレミアムモデルを利用しましょう。" },
  ko: { title: "로그인 — AI 페인팅", description: "로그인 또는 계정을 만들어 무제한 AI 이미지 생성, 우선 대기열, 모든 프리미엄 모델을 이용하세요." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = LOGIN_META[locale] || LOGIN_META.en;
  return { title: meta.title, description: meta.description };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
