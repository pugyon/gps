import React, { useEffect, useRef } from 'react';

export type MapTileLayer = 'none' | 'satellite' | 'street' | 'dark';

interface RadarMapCanvasProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  effectiveRange: number; // in meters (e.g. 20, 50, 200, 1000)
  mapLayer: MapTileLayer;
  headingUp?: boolean;
}

// Tile Cache in memory
const tileCache = new Map<string, HTMLImageElement>();

function latLonToTileFraction(lat: number, lon: number, zoom: number) {
  const x = ((lon + 180) / 360) * Math.pow(2, zoom);
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom);
  return { x, y };
}

// Map effective range (meters) to slippy tile zoom level
function rangeToZoom(meters: number): number {
  if (meters <= 30) return 19;
  if (meters <= 80) return 18;
  if (meters <= 250) return 17;
  if (meters <= 800) return 16;
  if (meters <= 2500) return 15;
  if (meters <= 8000) return 14;
  return 13;
}

function getTileUrl(layer: MapTileLayer, z: number, x: number, y: number): string {
  const maxTile = Math.pow(2, z);
  const wrappedX = ((x % maxTile) + maxTile) % maxTile;

  if (layer === 'satellite') {
    // Esri World Imagery (Satellite / 航空写真) - Free, No API key required
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${wrappedX}`;
  } else if (layer === 'dark') {
    // CartoDB Dark Matter (Cyberpunk dark road map) - Free, No API key required
    const sub = ['a', 'b', 'c', 'd'][Math.abs((x + y) % 4)];
    return `https://${sub}.basemaps.cartocdn.com/rastertiles/dark_all/${z}/${wrappedX}/${y}.png`;
  } else {
    // OpenStreetMap Standard - Free, No API key required
    return `https://tile.openstreetmap.org/${z}/${wrappedX}/${y}.png`;
  }
}

export const RadarMapCanvas: React.FC<RadarMapCanvasProps> = ({
  latitude,
  longitude,
  heading,
  effectiveRange,
  mapLayer,
  headingUp = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mapLayer === 'none' || latitude === null || longitude === null) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const zoom = rangeToZoom(effectiveRange);
    const { x: centerTileX, y: centerTileY } = latLonToTileFraction(latitude, longitude, zoom);

    const baseTileX = Math.floor(centerTileX);
    const baseTileY = Math.floor(centerTileY);

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Heading-Up Rotation (rotates map opposite to phone heading so 12 o'clock is forward)
      if (headingUp && heading !== null) {
        ctx.translate(centerX, centerY);
        ctx.rotate((-heading * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // Draw 3x3 or 5x5 tile window around current location
      const range = 2; // -2 to +2 tiles
      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          const tileX = baseTileX + dx;
          const tileY = baseTileY + dy;

          // Check Y bounds
          if (tileY < 0 || tileY >= Math.pow(2, zoom)) continue;

          const url = getTileUrl(mapLayer, zoom, tileX, tileY);
          const px = centerX + (tileX - centerTileX) * 256;
          const py = centerY + (tileY - centerTileY) * 256;

          let img = tileCache.get(url);
          if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, px, py, 256, 256);
          } else {
            if (!img) {
              img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = url;
              img.onload = () => {
                render();
              };
              tileCache.set(url, img);
            }
          }
        }
      }

      ctx.restore();
    };

    render();
  }, [latitude, longitude, heading, effectiveRange, mapLayer, headingUp]);

  if (mapLayer === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
        mapLayer === 'satellite'
          ? 'opacity-70 filter brightness-90 contrast-125'
          : mapLayer === 'dark'
          ? 'opacity-80 filter brightness-95 contrast-110'
          : 'opacity-60 filter brightness-85 contrast-115 invert-[0.15]'
      }`}
    />
  );
};
