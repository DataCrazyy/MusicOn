import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Loader2, MapPin, LocateFixed, Search, Move, Plus, Minus } from 'lucide-react';

type Props = {
  address: string;
  onAddressChange: (value: string) => void;
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
};

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 16;
// Centro de Santa Cruz de la Sierra — punto de partida razonable si todavía no hay ubicación.
const DEFAULT_CENTER = { lat: -17.7833, lng: -63.1821 };

function lonToTileX(lon: number, zoom: number) {
  return ((lon + 180) / 360) * 2 ** zoom;
}
function latToTileY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}
function tileXToLon(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180;
}
function tileYToLat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/**
 * Ubicación del evento con mapa interactivo (tiles de OpenStreetMap, sin API key ni
 * librerías nuevas): el usuario busca su dirección o usa su ubicación actual para
 * centrar el mapa, y después puede arrastrarlo para ajustar manualmente el punto
 * exacto — el marcador queda siempre fijo en el centro del mapa mientras se arrastra
 * el fondo debajo (el mismo patrón que apps de delivery/transporte para afinar un pin).
 */
export default function AddressMapField({ address, onAddressChange, lat, lng, onLocationChange }: Props) {
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [size, setSize] = useState({ w: 320, h: 220 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number } | null>(null);
  const [dragPx, setDragPx] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const hasLocation = lat !== null && lng !== null;
  const center = hasLocation ? { lat: lat!, lng: lng! } : DEFAULT_CENTER;

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setSize({ w: containerRef.current.clientWidth, h: 220 });
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  async function reverseGeocode(rLat: number, rLng: number) {
    setDetecting(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${rLat}&lon=${rLng}`
      );
      const data = await res.json();
      setDetectedAddress(data?.display_name ?? null);
    } catch {
      setDetectedAddress(null);
    } finally {
      setDetecting(false);
    }
  }

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
        const newLat = Number(results[0].lat);
        const newLng = Number(results[0].lon);
        onLocationChange(newLat, newLng);
        setDetectedAddress(results[0].display_name ?? null);
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
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setMapError('No pudimos acceder a tu ubicación. Revisa los permisos del navegador.');
        setLocating(false);
      }
    );
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!hasLocation) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY };
    setDragging(true);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    setDragPx({ x: e.clientX - dragState.current.startX, y: e.clientY - dragState.current.startY });
  }

  function handlePointerUp() {
    if (!dragState.current) return;
    const { x, y } = dragPx;
    dragState.current = null;
    setDragging(false);
    setDragPx({ x: 0, y: 0 });
    if (x === 0 && y === 0) return;

    // El marcador queda fijo en el centro: arrastrar el mapa "dx,dy" píxeles equivale a
    // mover el centro en sentido contrario, en coordenadas de tile de Web Mercator.
    const cx = lonToTileX(center.lng, zoom) - x / TILE_SIZE;
    const cy = latToTileY(center.lat, zoom) - y / TILE_SIZE;
    const newLat = tileYToLat(cy, zoom);
    const newLng = tileXToLon(cx, zoom);
    onLocationChange(newLat, newLng);
    reverseGeocode(newLat, newLng);
  }

  function zoomBy(delta: number) {
    if (!hasLocation) return;
    setZoom((z) => Math.min(19, Math.max(13, z + delta)));
  }

  // Tiles necesarios para cubrir el contenedor alrededor del centro actual.
  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  if (hasLocation) {
    const cx = lonToTileX(center.lng, zoom);
    const cy = latToTileY(center.lat, zoom);
    const tilesAcross = Math.ceil(size.w / TILE_SIZE) + 2;
    const tilesDown = Math.ceil(size.h / TILE_SIZE) + 2;
    const startX = Math.floor(cx - tilesAcross / 2);
    const startY = Math.floor(cy - tilesDown / 2);
    for (let ix = 0; ix < tilesAcross; ix++) {
      for (let iy = 0; iy < tilesDown; iy++) {
        const tx = startX + ix;
        const ty = startY + iy;
        const maxTile = 2 ** zoom;
        if (ty < 0 || ty >= maxTile) continue;
        const wrappedX = ((tx % maxTile) + maxTile) % maxTile;
        tiles.push({
          x: wrappedX,
          y: ty,
          left: (tx - cx) * TILE_SIZE + size.w / 2,
          top: (ty - cy) * TILE_SIZE + size.h / 2,
        });
      }
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-ink-muted">Ubicación del evento</label>
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

      {hasLocation && (
        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative overflow-hidden bg-bg-raised touch-none select-none"
            style={{ height: 220, cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <div
              className="absolute inset-0"
              style={{ transform: `translate(${dragPx.x}px, ${dragPx.y}px)` }}
            >
              {tiles.map((t) => (
                <img
                  key={`${zoom}-${t.x}-${t.y}`}
                  src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute"
                  style={{ left: t.left, top: t.top, width: TILE_SIZE, height: TILE_SIZE }}
                />
              ))}
            </div>

            {/* Marcador fijo en el centro — el mapa se arrastra debajo para ajustarlo */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <MapPin className="h-8 w-8 fill-lime text-bg-base drop-shadow" />
            </div>

            <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-pill bg-bg-base/90 px-2 py-1 text-[10px] font-semibold text-ink-muted">
              <Move className="h-3 w-3" /> Arrastra para ajustar el punto exacto
            </div>

            <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-lg border border-line bg-bg-base/90">
              <button
                type="button"
                onClick={() => zoomBy(1)}
                className="flex h-7 w-7 items-center justify-center text-ink-primary hover:bg-bg-raised"
                aria-label="Acercar"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => zoomBy(-1)}
                className="flex h-7 w-7 items-center justify-center border-t border-line text-ink-primary hover:bg-bg-raised"
                aria-label="Alejar"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-bg-surface px-3 py-2 text-xs text-ink-muted">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-lime" />
            {detecting ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Detectando dirección...
              </span>
            ) : (
              <span className="truncate">
                {detectedAddress ? `Dirección detectada: ${detectedAddress}` : 'Ubicación confirmada en el mapa'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
