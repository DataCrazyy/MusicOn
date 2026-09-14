import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Check, ArrowRight, Sparkles, Tag } from 'lucide-react';
import {
  ARTISTS, COMBO_CATEGORIES, POPULAR_COMBOS, getComboDiscount,
  getArtistForCategory, getArtist, type ComboCategory, type Artist,
} from '@/data';
import { useToast } from '@/components/Toast';

type Selections = Partial<Record<ComboCategory, Artist>>;

export default function ComboBuilder() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selections, setSelections] = useState<Selections>({});
  const [modalCategory, setModalCategory] = useState<ComboCategory | null>(null);

  const selectedArtists = Object.values(selections).filter(Boolean) as Artist[];
  const filledCount = selectedArtists.length;
  const discount = getComboDiscount(filledCount);
  const subtotal = selectedArtists.reduce((s, a) => s + a.priceFrom, 0);
  const discountAmount = Math.round(subtotal * discount);
  const total = subtotal - discountAmount;

  const selectArtist = (category: ComboCategory, artist: Artist) => {
    setSelections((prev) => {
      const next = { ...prev };
      for (const cat of Object.keys(next) as ComboCategory[]) {
        if (next[cat]?.id === artist.id) delete next[cat];
      }
      next[category] = artist;
      return next;
    });
    setModalCategory(null);
  };

  const removeArtist = (category: ComboCategory) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const applyCombo = (artistIds: string[]) => {
    const newSelections: Selections = {};
    const categories = [...COMBO_CATEGORIES];
    for (const id of artistIds) {
      const artist = getArtist(id);
      if (!artist) continue;
      const availableCat = categories.find((c) => !newSelections[c.id]);
      if (availableCat) newSelections[availableCat.id] = artist;
    }
    setSelections(newSelections);
    showToast('Combo cargado en el constructor');
  };

  const handleBookCombo = () => {
    if (filledCount < 2) {
      showToast('Seleccioná al menos 2 artistas para reservar el combo');
      return;
    }
    const ids = selectedArtists.map((a) => a.id).join(',');
    navigate(`/booking?combo=${ids}&discount=${discount}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-pill bg-lime/10 px-4 py-1.5">
          <Sparkles className="h-4 w-4 text-lime" />
          <span className="text-sm font-bold text-lime">Ahorra hasta 20%</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-extrabold text-ink-primary sm:text-4xl">
          🎯 Armá tu evento completo
        </h2>
        <p className="mt-2 text-base text-ink-muted">Combiná artistas y conseguí hasta 20% de descuento</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Slots */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {COMBO_CATEGORIES.map((cat) => {
              const selected = selections[cat.id];
              return (
                <div key={cat.id}>
                  {selected ? (
                    <FilledSlot
                      emoji={cat.emoji}
                      label={cat.label}
                      artist={selected}
                      onRemove={() => removeArtist(cat.id)}
                    />
                  ) : (
                    <EmptySlot
                      emoji={cat.emoji}
                      label={cat.label}
                      required={cat.required}
                      onClick={() => setModalCategory(cat.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Popular combos */}
          <div className="mt-8">
            <h3 className="mb-4 font-display text-lg font-bold text-ink-primary">Combos populares</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {POPULAR_COMBOS.map((combo) => {
                const artists = combo.artistIds.map((id) => getArtist(id)).filter(Boolean) as Artist[];
                const comboSubtotal = artists.reduce((s, a) => s + a.priceFrom, 0);
                const comboDiscount = getComboDiscount(artists.length);
                const comboTotal = Math.round(comboSubtotal * (1 - comboDiscount));
                return (
                  <div
                    key={combo.id}
                    className="group rounded-card border border-line bg-bg-surface p-5 transition hover:border-lime/30 glow-lime-hover"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{combo.emoji}</span>
                      <h4 className="font-display text-base font-bold text-ink-primary">{combo.name}</h4>
                    </div>
                    <p className="mt-2 text-xs text-ink-muted leading-relaxed">{combo.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {artists.map((a) => (
                        <span key={a.id} className="rounded-pill bg-bg-raised px-2 py-0.5 text-xs text-ink-muted">
                          {a.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-xl font-bold text-lime">${comboTotal.toLocaleString()}</span>
                      <span className="text-xs text-ink-muted line-through">${comboSubtotal.toLocaleString()}</span>
                      <span className="text-xs font-bold text-lime">-{Math.round(comboDiscount * 100)}%</span>
                    </div>
                    <button
                      onClick={() => applyCombo(combo.artistIds)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-pill bg-lime py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
                    >
                      <Tag className="h-3.5 w-3.5" /> Armar este combo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Price summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-card border border-lime/20 bg-bg-surface p-6">
            <h3 className="font-display text-lg font-bold text-ink-primary">Resumen del combo</h3>

            {selectedArtists.length === 0 ? (
              <div className="mt-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-bg-raised">
                  <Plus className="h-8 w-8 text-ink-muted" />
                </div>
                <p className="text-sm text-ink-muted">Agregá artistas a tu combo para ver el precio acá</p>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {selectedArtists.map((artist) => (
                    <div key={artist.id} className="flex items-center gap-3">
                      <img src={artist.photo} alt={artist.name} className="h-10 w-10 rounded-lg object-cover" />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-ink-primary">{artist.name}</p>
                        <p className="text-xs text-ink-muted">{artist.genre}</p>
                      </div>
                      <span className="text-sm font-semibold text-ink-primary">${artist.priceFrom}</span>
                    </div>
                  ))}
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
                    <span className="font-bold text-ink-primary">Total</span>
                    <span className="font-display text-2xl font-extrabold text-lime">${total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleBookCombo}
                  disabled={filledCount < 2}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-ink-muted"
                >
                  {filledCount >= 2 ? (
                    <>Reservar combo completo <ArrowRight className="h-4 w-4" /></>
                  ) : (
                    'Seleccioná al menos 2'
                  )}
                </button>
              </>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-lime/5 p-3">
              <Check className="h-4 w-4 flex-shrink-0 text-lime" />
              <p className="text-xs text-ink-muted">Más artistas = más descuento. 2: 10% · 3: 15% · 4: 20%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Artist picker modal */}
      {modalCategory && (
        <ArtistPickerModal
          category={modalCategory}
          selectedIds={selectedArtists.map((a) => a.id)}
          onSelect={(artist) => selectArtist(modalCategory, artist)}
          onClose={() => setModalCategory(null)}
        />
      )}
    </div>
  );
}

function EmptySlot({ emoji, label, required, onClick }: { emoji: string; label: string; required: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-lime/30 bg-lime/5 p-6 transition hover:border-lime/60 hover:bg-lime/10"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime/10">
        <Plus className="h-6 w-6 text-lime" />
      </div>
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-semibold text-ink-primary">Agregar {label}</span>
      {required && (
        <span className="rounded-pill bg-coral/10 px-2 py-0.5 text-xs font-medium text-coral">Requerido</span>
      )}
    </button>
  );
}

function FilledSlot({ emoji, label, artist, onRemove }: { emoji: string; label: string; artist: Artist; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-lime/30 bg-bg-surface p-4">
      <img src={artist.photo} alt={artist.name} className="h-14 w-14 rounded-lg object-cover" />
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{emoji}</span>
          <p className="truncate text-sm font-bold text-ink-primary">{artist.name}</p>
        </div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="mt-0.5 font-display text-sm font-bold text-lime">${artist.priceFrom}</p>
      </div>
      <button
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:bg-coral/10 hover:text-coral"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ArtistPickerModal({ category, selectedIds, onSelect, onClose }: {
  category: ComboCategory;
  selectedIds: string[];
  onSelect: (artist: Artist) => void;
  onClose: () => void;
}) {
  const cat = COMBO_CATEGORIES.find((c) => c.id === category)!;
  const artists = getArtistForCategory(category);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-bg-base/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="animate-slide-up flex w-full max-w-lg flex-col rounded-card border border-line bg-bg-surface p-6 shadow-2xl"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cat.emoji}</span>
            <h2 className="font-display text-lg font-bold text-ink-primary">Elegir {cat.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:text-ink-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {artists.map((artist) => {
            const isSelected = selectedIds.includes(artist.id);
            return (
              <button
                key={artist.id}
                onClick={() => onSelect(artist)}
                disabled={isSelected}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-lime/30 bg-lime/5 opacity-50'
                    : 'border-line bg-bg-raised hover:border-lime/30'
                }`}
              >
                <img src={artist.photo} alt={artist.name} className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-primary">{artist.name}</p>
                  <p className="text-xs text-ink-muted">{artist.genre} · {artist.city}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-sm font-bold text-lime">${artist.priceFrom}</span>
                    <span className="flex items-center gap-0.5 text-xs text-ink-muted">
                      ⭐ {artist.rating}
                    </span>
                  </div>
                </div>
                {isSelected ? (
                  <Check className="h-5 w-5 text-lime" />
                ) : (
                  <Plus className="h-5 w-5 text-ink-muted" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
