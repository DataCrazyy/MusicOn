import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel = 'Explorar artistas',
  ctaTo = '/explore',
}: {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-raised text-ink-muted">
        {icon}
      </div>
      <h1 className="font-display text-2xl font-bold text-ink-primary">{title}</h1>
      <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      <Link
        to={ctaTo}
        className="mt-2 flex items-center gap-2 rounded-pill bg-lime px-6 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
      >
        {ctaLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
