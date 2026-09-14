import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Check, Shield, Music,
  ChevronDown, ChevronUp, Plus, Sparkles, Info,
} from 'lucide-react';
import { getArtist, getComboDiscount, ARTISTS, type Artist } from '@/data';

const SERVICE_EXTRAS = [
  { id: 'sound', label: 'Equipo de sonido', price: 150 },
  { id: 'lights', label: 'Iluminación', price: 120 },
  { id: 'transport', label: 'Traslado', price: 80 },
  { id: 'setup', label: 'Montaje temprano', price: 60 },
];

type ExtrasMap = Record<string, Record<string, boolean>>;

export default function BookingForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const comboIds = params.get('combo');
  const singleArtistId = params.get('id');

  const comboArtists: Artist[] = comboIds
    ? comboIds.split(',').map((id) => getArtist(id)).filter(Boolean) as Artist[]
    : singleArtistId
      ? [getArtist(singleArtistId)].filter(Boolean) as Artist[]
      : [];

  const isCombo = comboIds !== null && comboArtists.length > 1;
  const discount = isCombo ? getComboDiscount(comboArtists.length) : 0;

  const [selectedArtist, setSelectedArtist] = useState(singleArtistId || '');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState('');
  const [notes, setNotes] = useState('');
  const [extras, setExtras] = useState<ExtrasMap>({});
  const [openExtraArtist, setOpenExtraArtist] = useState<string | null>(null);

  const artists = isCombo ? comboArtists : (selectedArtist ? [getArtist(selectedArtist)].filter(Boolean) as Artist[] : []);

  const subtotal = artists.reduce((s, a) => {
    const base = a.pricePer === 'hour' ? a.priceFrom * duration : a.priceFrom;
    return s + base;
  }, 0);

  const extrasTotal = artists.reduce((s, a) => {
    const aExtras = extras[a.id] || {};
    return s + SERVICE_EXTRAS.reduce((es, ex) => es + (aExtras[ex.id] ? ex.price : 0), 0);
  }, 0);

  const discountAmount = Math.round(subtotal * discount);
  const commission = Math.round((subtotal - discountAmount + extrasTotal) * 0.15);
  const grandTotal = subtotal - discountAmount + extrasTotal + commission;

  const canSubmit = (isCombo || selectedArtist) && eventDate && startTime && venue && eventType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const navParams = new URLSearchParams();
    if (isCombo) {
      navParams.set('combo', comboArtists.map((a) => a.id).join(','));
    } else {
      navParams.set('artist', selectedArtist);
    }
    navParams.set('date', eventDate);
    navParams.set('event', eventType);
    navParams.set('total', grandTotal.toString());
    navParams.set('extras', extrasTotal.toString());
    navigate(`/payment?${navParams.toString()}`);
  };

  const toggleExtra = (artistId: string, extraId: string) => {
    setExtras((prev) => ({
      ...prev,
      [artistId]: { ...(prev[artistId] || {}), [extraId]: !prev[artistId]?.[extraId] },
    }));
  };

  const eventTypes = ['Wedding', 'Corporate', 'Private Party', 'Club Night', 'Festival', 'Ceremony'];

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link to={isCombo ? '/explore' : (selectedArtist ? `/profile/${selectedArtist}` : '/explore')} className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="mb-2 font-display text-3xl font-bold text-ink-primary">
          {isCombo ? 'Reservar combo de artistas' : 'Request a Booking'}
        </h1>
        <p className="mb-8 text-sm text-ink-muted">
          {isCombo ? 'Completá los datos del evento para todos los artistas del combo.' : 'Fill in the details and we will send a request to the artist.'}
        </p>

        {/* Combo summary */}
        {isCombo && (
          <section className="mb-6 rounded-card border border-lime/20 bg-bg-surface p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-primary">
              <Sparkles className="h-5 w-5 text-lime" /> Tu combo de artistas
            </h2>
            <div className="space-y-3">
              {comboArtists.map((a) => {
                const base = a.pricePer === 'hour' ? a.priceFrom * duration : a.priceFrom;
                return (
                  <div key={a.id} className="flex items-center gap-3 border-b border-line/50 pb-3 last:border-0">
                    <img src={a.photo} alt={a.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-bold text-ink-primary">{a.name}</p>
                      <p className="text-xs text-ink-muted">
                        {a.genre} · ${a.priceFrom}/{a.pricePer}
                        {a.pricePer === 'hour' && ` · ${duration}h`}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-ink-primary">${base.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Subtotal</span>
                <span className="font-semibold text-ink-primary">${subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 font-medium text-lime">
                    <Sparkles className="h-3.5 w-3.5" /> Descuento combo ({Math.round(discount * 100)}%)
                  </span>
                  <span className="font-bold text-lime">−${discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <span className="font-bold text-ink-primary">Total con descuento</span>
                <span className="font-display text-2xl font-extrabold text-lime">${(subtotal - discountAmount).toLocaleString()}</span>
              </div>
            </div>
          </section>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Artist selection (only for non-combo) */}
            {!isCombo && (
              <section className="rounded-card border border-line bg-bg-surface p-6">
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-primary">
                  <Music className="h-5 w-5 text-lime" /> Select Artist
                </h2>
                {selectedArtist && getArtist(selectedArtist) ? (
                  <div className="flex items-center gap-3 rounded-xl border border-lime/30 bg-lime/5 p-3">
                    <img src={getArtist(selectedArtist)!.photo} alt={getArtist(selectedArtist)!.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-ink-primary">{getArtist(selectedArtist)!.name}</p>
                      <p className="text-xs text-ink-muted">{getArtist(selectedArtist)!.genre} · {getArtist(selectedArtist)!.city}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedArtist('')} className="text-sm text-ink-muted hover:text-coral">
                      Change
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedArtist}
                    onChange={(e) => setSelectedArtist(e.target.value)}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-3 text-sm text-ink-primary focus:border-lime/50 focus:outline-none"
                  >
                    <option value="">Choose an artist...</option>
                    {ARTISTS.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} — {a.genre} (${a.priceFrom}/{a.pricePer})</option>
                    ))}
                  </select>
                )}
              </section>
            )}

            {/* Event details */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink-primary">
                <Calendar className="h-5 w-5 text-lime" /> Event Details
              </h2>
              {isCombo && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-lime/5 px-3 py-2">
                  <Info className="h-4 w-4 flex-shrink-0 text-lime" />
                  <p className="text-xs text-ink-muted">Estos datos aplican para todos los artistas del combo</p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Event type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary focus:border-lime/50 focus:outline-none"
                  >
                    <option value="">Select type...</option>
                    {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary focus:border-lime/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Start time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary focus:border-lime/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                    Duration: {duration} hour{duration !== 1 ? 's' : ''}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-3 w-full"
                  />
                </div>
              </div>
            </section>

            {/* Venue */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-primary">
                <MapPin className="h-5 w-5 text-lime" /> Venue
              </h2>
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Venue name and address"
                className="w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes for the artist..."
                rows={3}
                className="mt-3 w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
              />
            </section>

            {/* Per-artist extras accordion */}
            {artists.length > 0 && (
              <section className="rounded-card border border-line bg-bg-surface p-6">
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-primary">
                  <Plus className="h-5 w-5 text-lime" /> Servicios adicionales
                </h2>
                {isCombo && (
                  <p className="mb-4 text-xs text-ink-muted">Agregá extras específicos para cada artista del combo.</p>
                )}
                <div className="space-y-3">
                  {artists.map((a) => {
                    const isOpen = openExtraArtist === a.id;
                    const aExtras = extras[a.id] || {};
                    const artistExtrasTotal = SERVICE_EXTRAS.reduce((s, ex) => s + (aExtras[ex.id] ? ex.price : 0), 0);
                    return (
                      <div key={a.id} className="rounded-xl border border-line bg-bg-raised">
                        <button
                          type="button"
                          onClick={() => setOpenExtraArtist(isOpen ? null : a.id)}
                          className="flex w-full items-center gap-3 p-3 text-left"
                        >
                          <img src={a.photo} alt={a.name} className="h-8 w-8 rounded-lg object-cover" />
                          <span className="flex-1 text-sm font-semibold text-ink-primary">{a.name}</span>
                          {artistExtrasTotal > 0 && (
                            <span className="text-xs font-bold text-lime">+${artistExtrasTotal}</span>
                          )}
                          {isOpen ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
                        </button>
                        {isOpen && (
                          <div className="animate-slide-up space-y-2 border-t border-line p-3">
                            {SERVICE_EXTRAS.map((ex) => (
                              <label key={ex.id} className="flex cursor-pointer items-center justify-between rounded-lg bg-bg-surface px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!aExtras[ex.id]}
                                    onChange={() => toggleExtra(a.id, ex.id)}
                                    className="h-4 w-4 accent-lime"
                                  />
                                  <span className="text-sm text-ink-primary">{ex.label}</span>
                                </div>
                                <span className="text-sm font-medium text-ink-muted">+${ex.price}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            <div className="sticky top-20 rounded-card border border-line bg-bg-surface p-6">
              <h3 className="font-display text-lg font-bold text-ink-primary">Summary</h3>
              {artists.length > 0 ? (
                <>
                  <div className="mt-4 space-y-2">
                    {artists.map((a) => {
                      const base = a.pricePer === 'hour' ? a.priceFrom * duration : a.priceFrom;
                      const aExtras = extras[a.id] || {};
                      const artistExtras = SERVICE_EXTRAS.reduce((s, ex) => s + (aExtras[ex.id] ? ex.price : 0), 0);
                      return (
                        <div key={a.id} className="flex items-center gap-2 border-b border-line/50 pb-2 last:border-0">
                          <img src={a.photo} alt={a.name} className="h-8 w-8 rounded object-cover" />
                          <span className="flex-1 truncate text-xs font-semibold text-ink-primary">{a.name}</span>
                          <span className="text-xs font-semibold text-ink-primary">${(base + artistExtras).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                    <Row label="Subtotal" value={`$${subtotal.toLocaleString()}`} />
                    {discount > 0 && (
                      <Row label={`Descuento combo (${Math.round(discount * 100)}%)`} value={`−$${discountAmount.toLocaleString()}`} lime />
                    )}
                    {extrasTotal > 0 && <Row label="Extras" value={`+$${extrasTotal.toLocaleString()}`} />}
                    <Row label="Comisión MusicOn (15%)" value={`$${commission.toLocaleString()}`} />
                    <div className="border-t border-line pt-2">
                      <Row label="Total" value={`$${grandTotal.toLocaleString()}`} bold />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-lime/5 p-3">
                    <Shield className="h-4 w-4 flex-shrink-0 text-lime" />
                    <p className="text-xs text-ink-muted">Anticipo del 30% se paga ahora. El resto el día del evento.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {canSubmit ? (
                      <>Confirmar y pagar anticipo →</>
                    ) : (
                      'Fill in all fields'
                    )}
                  </button>
                </>
              ) : (
                <p className="mt-4 text-sm text-ink-muted">Select an artist to see pricing.</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value, bold, lime }: { label: string; value: string; bold?: boolean; lime?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-bold text-ink-primary' : (lime ? 'font-medium text-lime' : 'text-ink-muted')}>{label}</span>
      <span className={bold ? 'font-display text-lg font-bold text-lime' : (lime ? 'font-bold text-lime' : 'font-semibold text-ink-primary')}>{value}</span>
    </div>
  );
}
