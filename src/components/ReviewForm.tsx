import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import StarRating from './StarRating';
import { createReview } from '@/lib/reviews';

type Props = {
  bookingId: string;
  artistId: string;
  clientId: string;
  artistName: string;
  onDone: () => void;
};

/** Formulario para dejar una reseña — solo aparece cuando el servicio ya está completado (regla de la DB). */
export default function ReviewForm({ bookingId, artistId, clientId, artistName, onDone }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating === 0) {
      setError('Elige al menos una estrella.');
      return;
    }
    if (!comment.trim()) {
      setError('Escribe un comentario breve sobre tu experiencia.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createReview({ bookingId, artistId, clientId, rating, comment: comment.trim() });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tu reseña. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-line bg-bg-base p-3">
      <p className="mb-2 text-xs font-semibold text-ink-primary">¿Cómo estuvo tu experiencia con {artistName}?</p>
      <StarRating value={rating} size={22} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="mt-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
        placeholder="Cuenta cómo fue el servicio..."
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-pill bg-lime px-4 py-2 text-xs font-bold text-bg-base hover:bg-lime-dark disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Enviar reseña
      </button>
    </div>
  );
}
