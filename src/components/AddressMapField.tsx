import { useState } from 'react';
import { Loader2, MapPin, LocateFixed, Search } from 'lucide-react';

type Props = {
  address: string;
  onAddressChange: (value: string) => void;
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
};

/**
 * Dirección del evento con mapa integrado (OpenStreetMap, sin API key):
 * el usuario escribe la dirección y puede buscarla en el mapa (Nominatim)
 * o usar su ubicación actual; el mapa muestra un marcador de confirmación.
 */
export default function AddressMapField({ address, onAddressChange, lat, lng, onLocationChange }: Props) {
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  async function searchOnMap() {
    if (!address.trim()) {
      setMapError('Escribe primero la dirección para poder buscarla.');
      return;
    }
    setMapError(null);
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
      );
      const results = await res.json();
      if (results?.[0]) {
        onLocationChange(Number(results[0].lat), Number(results[0].lon));
      } else {
        setMapError('No pudimos ubicar esa dirección en el mapa. Puedes ajustarla o usar tu ubicación actual.');
      }
    } catch {
      setMapError('No pudimos buscar la dirección en el mapa. Puedes intentar de nuevo.');
    } finally {
      setSearching(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMapError('Tu navegador no permite compartir ubicación.');
      return;
    }
    setMapError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setMapError('No pudimos acceder a tu ubicación. Revisa los permisos del navegador.');
        setLocating(false);
      }
    );
  }

  const hasLocation = lat !== null && lng !== null;
  const delta = 0.006;
  const embedUrl = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng! - delta}%2C${lat! - delta}%2C${lng! + delta}%2C${lat! + delta}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-ink-muted">Dirección completa del lugar</label>
      <input
        required
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
        placeholder="Ej: Salón Los Tajibos, Av. San Martín #123, Santa Cruz"
      />
      <p className="mt-1 text-xs text-ink-muted">
        Dale la dirección exacta — el artista la necesita para decidir si acepta.
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={searchOnMap}
          disabled={searching}
          className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-lime/40 disabled:opacity-60"
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Buscar en el mapa
        </button>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-lime/40 disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          Usar mi ubicación actual
        </button>
      </div>

      {mapError && <p className="mt-2 text-xs text-red-400">{mapError}</p>}

      {hasLocation && embedUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          <iframe
            title="Ubicación del evento"
            src={embedUrl}
            width="100%"
            height={180}
            style={{ border: 0 }}
            loading="lazy"
          />
          <div className="flex items-center gap-1.5 bg-bg-surface px-3 py-2 text-xs text-ink-muted">
            <MapPin className="h-3.5 w-3.5 text-lime" /> Ubicación confirmada en el mapa
          </div>
        </div>
      )}
    </div>
  );
}
