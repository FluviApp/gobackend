// libs/geo.js
// Utilidades de geo compartidas para cobertura por zona (área) y comuna.
import Comunas from '../models/Comunas.js';

// Nombre de comuna → slug normalizado (sin tildes, minúsculas, guiones).
// DEBE coincidir con el slug guardado en el catálogo Comunas.
export const slugifyComuna = (s = '') =>
    String(s)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// Point-in-polygon (ray casting). polygon = [{ lat, lng }], point = { lat, lng }.
export const isPointInPolygon = (point, polygon) => {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;
    let inside = false;
    const x = point.lat, y = point.lng;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-10) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// Dado un conjunto de zonas, arma un mapa { slug: polygon } del catálogo Comunas
// para las zonas tipo 'comuna' (una sola consulta).
export const buildComunaPolyMap = async (zones) => {
    const slugs = [...new Set(
        (zones || [])
            .filter((z) => z?.type === 'comuna')
            .map((z) => slugifyComuna(z.comuna))
            .filter(Boolean)
    )];
    if (!slugs.length) return {};
    const docs = await Comunas.find({ slug: { $in: slugs } }, { slug: 1, polygon: 1, _id: 0 }).lean();
    return Object.fromEntries(docs.map((d) => [d.slug, d.polygon || []]));
};

// Polígono efectivo de una zona: 'area' usa su propio polygon; 'comuna' usa el del catálogo.
export const zonePolygon = (zone, comunaMap = {}) =>
    zone?.type === 'comuna' ? (comunaMap[slugifyComuna(zone.comuna)] || []) : (zone?.polygon || []);
