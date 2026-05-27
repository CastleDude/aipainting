import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const META: Record<string, { title: string; description: string }> = {
  en: { title: "Terms of Service — AI Painting", description: "Terms and conditions for using AI Painting." },
  zh: { title: "服务条款 — AI 画境", description: "使用 AI 画境的服务条款与条件。" },
  "zh-Hant": { title: "服務條款 — AI 畫境", description: "使用 AI 畫境的服務條款與條件。" },
  ja: { title: "利用規約 — AI ペインティング", description: "AI ペインティングの利用規約。" },
  ko: { title: "이용약관 — AI 페인팅", description: "AI 페인팅 이용약관입니다." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return META[locale] || META.en;
}

export default async function TermsPage() {
  const t = await getTranslations();
  const locale = t("site.name") ? "en" : "en"; // locale available from params

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-text-primary mb-8">{t("footer.terms")}</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using AI Painting (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">2. Description of Service</h2>
            <p>AI Painting provides an AI-powered image generation platform. We offer both free and paid subscription tiers. Features and limits vary by tier as described on our pricing page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information when creating an account. You may not share your account or use another person&rsquo;s account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to generate or distribute content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. This includes but is not limited to content that infringes intellectual property rights, violates privacy, or promotes discrimination.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">5. Intellectual Property</h2>
            <p>Images you generate using the Service belong to you, subject to the terms of the underlying AI models. AI Painting does not claim ownership of your generated content. You grant us a limited license to display shared/gallery images within the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">6. Payment and Subscriptions</h2>
            <p>Paid plans are billed in advance on a monthly basis. All payments are processed securely through Creem. You may cancel your subscription at any time through the customer portal. Cancellations take effect at the end of the current billing period. No refunds are provided for partial months.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">7. Limitation of Liability</h2>
            <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTY OF ANY KIND. AI Painting shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms. We will notify users of material changes via email or through the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">9. Contact</h2>
            <p>For questions about these Terms, please contact us at support@aipaiting.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
