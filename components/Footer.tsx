interface FooterProps {
  locale: string;
  messages: {
    copyright: string;
    terms: string;
    privacy: string;
  };
}

export function Footer({ locale, messages }: FooterProps) {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-sm text-text-muted">{messages.copyright}</p>
        <div className="flex items-center gap-6">
          <a href="https://www.easytoolhub.top" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted transition-colors hover:text-text-secondary">
            EasyToolHub
          </a>
          <span className="text-border/50">|</span>
          <a href={`/${locale}/terms`} className="text-sm text-text-muted transition-colors hover:text-text-secondary">
            {messages.terms}
          </a>
          <a href={`/${locale}/privacy`} className="text-sm text-text-muted transition-colors hover:text-text-secondary">
            {messages.privacy}
          </a>
        </div>
      </div>
    </footer>
  );
}
