import type { TileLayerOptions } from 'leaflet'

/** Keep every map on the same provider, with a key-free default. */
export function getMapTileConfig(): { url: string; options: TileLayerOptions } {
  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim()
  const attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  if (cartoKey) {
    return {
      url: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`,
      options: {
        attribution: `${attribution} © <a href="https://carto.com/">CARTO</a>`,
        maxZoom: 20,
      },
    }
  }

  return {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution,
      maxNativeZoom: 19,
      maxZoom: 20,
    },
  }
}
