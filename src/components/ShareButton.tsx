import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { shareLink } from '@/lib/share';

export default function ShareButton({
  title,
  text,
  url,
  label = 'Compartir',
  className,
}: {
  title: string;
  text: string;
  url: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const result = await shareLink({ title, text, url });
    if (result === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        'flex items-center gap-2 rounded-pill border border-line bg-bg-surface px-4 py-2 text-sm font-bold text-ink-primary transition hover:border-lime/40'
      }
    >
      {copied ? <Check className="h-4 w-4 text-lime" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Link copiado' : label}
    </button>
  );
}
