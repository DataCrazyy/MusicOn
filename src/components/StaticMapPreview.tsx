import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

const TILE_SIZE = 256;

function lonToTileX(lon: number, zoom: number) {
  return ((lon + 180) / 360) * 2 ** zoom;
}
function latToTileY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  height?: number;
};

/**
 * Mapa de referencia, solo para visualizar (58) — sin arrastre, sin búsqueda, sin
 * geolocalización: el punto queda fijo en el centro y no se puede editar desde acá.
 * Si la ubicación necesita cambiar, el usuario debe volver al flujo correspondiente
 * antes de firmar (51/58) — nunca se edita en la revisión del contrato.
 */
export default function StaticMapPreview({ lat, lng, zoom = 15, height = 160 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 320, h: height });

  useEffect(() => {
    function measure() {
      if (containerRef.current) setSize({ w: containerRef.current.clientWidth, h: height });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [height]);

  const cx = lonToTileX(lng, zoom);
  const cy = latToTileY(lat, zoom);
  const tilesAcross = Math.ceil(size.w / TILE_SIZE) + 2;
  const tilesDown = Math.ceil(size.h / TILE_SIZE) + 2;
  const startX = Math.floor(cx - tilesAcross / 2);
  const startY = Math.floor(cy - tilesDown / 2);
  const maxTile = 2 ** zoom;
  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  for (let ix = 0; ix < tilesAcross; ix++) {
    for (let iy = 0; iy < tilesDown; iy++) {
      const tx = startX + ix;
      const ty = startY + iy;
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

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg border border-line bg-bg-raised"
      style={{ height }}
    >
      <div className="absolute inset-0">
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
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <MapPin className="h-7 w-7 fill-lime text-bg-base drop-shadow" />
      </div>
    </div>
  );
}
