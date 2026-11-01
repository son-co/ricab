/**
 * Tra cứu địa lý — Nominatim (OpenStreetMap) làm chính, Photon (Komoot) dự phòng.
 *
 * Nominatim rất hay trả 403/429 với IP datacenter hoặc IP di động (CGNAT),
 * nên mọi truy vấn đều rơi sang Photon khi gặp lỗi. Cả hai đều không cần API key.
 */

export interface GeocodeLabel {
  label: string;
  address: string;
}

export interface PlaceResult {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Bias {
  lat: number;
  lng: number;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const PHOTON = 'https://photon.komoot.io';

const NOMINATIM_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Accept-Language': 'vi',
  'User-Agent': 'DiCungBan/1.0',
};

const JSON_HEADERS: Record<string, string> = { Accept: 'application/json' };

interface NominatimReverse {
  display_name?: string;
  address?: Record<string, unknown>;
  error?: unknown;
}

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface PhotonFeature {
  geometry?: { coordinates?: number[] };
  properties?: Record<string, unknown>;
}

type PhotonResponse = { features?: PhotonFeature[] };

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;

const first = (...vals: (string | undefined)[]): string | undefined => {
  for (const v of vals) if (v) return v;
  return undefined;
};

/** Ghép các tầng địa danh, bỏ rỗng và bỏ trùng. */
const joinParts = (...vals: (string | undefined)[]): string =>
  vals.filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i).join(', ');

async function fetchJson<T>(url: string, headers: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { headers, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

function labelFromNominatim(displayName: string, address?: Record<string, unknown>): string {
  const specific =
    address &&
    (str(address.road) ??
      str(address.neighbourhood) ??
      str(address.hamlet) ??
      str(address.village) ??
      str(address.town) ??
      str(address.suburb) ??
      str(address.city) ??
      str(address.county));
  return specific ?? displayName.split(',')[0]?.trim() ?? 'Vị trí đã chọn';
}

function fromPhotonFeature(feature: PhotonFeature, id: string): PlaceResult | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const p = feature.properties ?? {};
  const label =
    first(str(p.name), str(p.street), str(p.road), str(p.locality), str(p.city), str(p.county), str(p.state)) ??
    'Địa điểm';
  const address =
    joinParts(str(p.street), str(p.city), str(p.district), str(p.county), str(p.state), str(p.country)) ||
    label;
  return { id, label, address, lat, lng };
}

/** Trả địa chỉ (tên ngắn + địa chỉ đầy đủ) cho toạ độ; ném lỗi nếu cả hai nguồn đều hỏng. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeocodeLabel> {
  try {
    const data = await fetchJson<NominatimReverse>(
      `${NOMINATIM}/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`,
      NOMINATIM_HEADERS,
      signal,
    );
    if (!data.error && data.display_name) {
      return {
        label: labelFromNominatim(data.display_name, data.address),
        address: data.display_name,
      };
    }
  } catch {
    // rơi xuống Photon bên dưới
  }

  const data = await fetchJson<PhotonResponse>(`${PHOTON}/reverse?lat=${lat}&lon=${lng}`, JSON_HEADERS, signal);
  const feature = data.features?.[0];
  const result = feature ? fromPhotonFeature(feature, `rev-${lat}-${lng}`) : null;
  if (!result) throw new Error('Không tra được địa chỉ cho toạ độ này');
  return { label: result.label, address: result.address };
}

/** Tìm địa danh theo từ khoá, ưu tiên quanh vùng `bias`. */
export async function searchPlaces(
  query: string,
  bias: Bias,
  limit: number,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  try {
    const vb = `${bias.lng - 1.5},${bias.lat + 1.5},${bias.lng + 1.5},${bias.lat - 1.5}`;
    const url =
      `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=vn` +
      `&viewbox=${encodeURIComponent(vb)}&q=${encodeURIComponent(query)}`;
    const items = await fetchJson<NominatimItem[]>(url, NOMINATIM_HEADERS, signal);
    const mapped: PlaceResult[] = items
      .map((item) => {
        const lat = Number.parseFloat(item.lat);
        const lng = Number.parseFloat(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          id: `n-${item.place_id}`,
          label: labelFromNominatim(item.display_name),
          address: item.display_name,
          lat,
          lng,
        };
      })
      .filter((item): item is PlaceResult => item !== null);
    if (mapped.length > 0) return mapped;
  } catch {
    if (signal?.aborted) throw new Error('Aborted');
    // Nominatim lỗi hoặc rỗng → thử Photon
  }

  const url = `${PHOTON}/api/?limit=${limit}&lat=${bias.lat}&lon=${bias.lng}&q=${encodeURIComponent(query)}`;
  const data = await fetchJson<PhotonResponse>(url, JSON_HEADERS, signal);
  return (data.features ?? [])
    .map((feature, index) => fromPhotonFeature(feature, `p-${index}-${lat0(feature)}`))
    .filter((item): item is PlaceResult => item !== null);
}

const lat0 = (feature: PhotonFeature): number => Number(feature.geometry?.coordinates?.[1] ?? 0);
