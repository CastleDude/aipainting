import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const META: Record<string, { title: string; description: string }> = {
  en: { title: "Privacy Policy — AI Painting", description: "How AI Painting collects, uses, and protects your data." },
  zh: { title: "隐私政策 — AI 画境", description: "AI 画境如何收集、使用和保护你的数据。" },
  "zh-Hant": { title: "隱私政策 — AI 畫境", description: "AI 畫境如何收集、使用和保護你的資料。" },
  ja: { title: "プライバシーポリシー — AI ペインティング", description: "AI ペインティングがお客様のデータをどのように収集、使用、保護するかについて。" },
  ko: { title: "개인정보처리방침 — AI 페인팅", description: "AI 페인팅이 데이터를 수집, 사용, 보호하는 방법." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return META[locale] || META.en;
}

export default async function PrivacyPage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-text-primary mb-8">{t("footer.privacy")}</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly: email address (when you sign up), generated images and prompts, and payment information (processed securely by Creem — we do not store full credit card details). We also collect usage data such as pages visited and features used.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve the Service, process payments, communicate with you about your account, and ensure the security of our platform. Generated images are automatically deleted from our servers after 10 minutes unless you choose to save or share them.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored on Supabase infrastructure with encryption at rest and in transit. We implement reasonable security measures to protect your personal information. Authentication is handled securely through Supabase Auth with industry-standard practices.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">4. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies or sell your data to advertisers. Your session cookies are necessary for the Service to function.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services: Supabase (database and authentication), Creem (payment processing), and AI model providers (DashScope, ModelScope, Volcano ARK, OpenRouter) for image generation. Each service has its own privacy policy. Your prompts are transmitted to AI model providers solely for the purpose of generating images.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">6. Data Retention</h2>
            <p>Generated images are automatically deleted after 10 minutes unless saved. Account data is retained while your account is active. You may request deletion of your account and all associated data by contacting us. Payment records are retained as required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may export your data or request account deletion at any time. To exercise these rights, contact us at support@aipaiting.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">8. Children&rsquo;s Privacy</h2>
            <p>The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance of the new policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">10. Contact</h2>
            <p>For privacy-related inquiries, please contact us at support@aipaiting.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
