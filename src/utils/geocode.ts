/**
 * Tra cứu địa lý — không cần API key.
 *
 * - Reverse (toạ độ → địa chỉ): Nominatim (OpenStreetMap) làm chính, Photon (Komoot) dự phòng.
 * - Search (từ khoá → địa điểm): Photon làm chính — kết quả tiếng Việt đúng nghĩa hơn trong
 *   các phép thử thực tế ("bến xe Vinh" ra đúng bến xe, trong khi Nominatim ra sông ở Quảng Trị)
 *   và Nominatim cấm client tự làm autocomplete; Nominatim dự phòng khi Photon lỗi/rỗng.
 *
 * Cả hai đều free theo kiểu "fair use": tối đa ~1 request/giây, User-Agent phải nhận diện
 * ứng dụng (Nominatim từng trả 403 với UA mặc định). Module này tự throttle theo từng nguồn
 * (khóa chung cho reverse + search) và chặn timeout 8 giây mỗi lần thử để không bao giờ
 * treo UI chờ địa chỉ; lỗi/treo ở nguồn này sẽ rơi sang nguồn kia.
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

/** Nhận diện ứng dụng theo usage policy của Nominatim (UA mặc định sẽ bị 403). */
const NOMINATIM_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Accept-Language': 'vi',
  'User-Agent': 'DiCungBan/1.0 (https://github.com/son-co/ricab)',
};

const JSON_HEADERS: Record<string, string> = { Accept: 'application/json' };

/** Fair-use ~1 req/giây cho từng nguồn công cộng (Nominatim bắt buộc, Photon ngầm hiểu). */
const MIN_INTERVAL_MS = 1000;
/** Mỗi lần thử tối đa 8 giây — quá là rơi sang nguồn dự phòng, không bao giờ treo UI. */
const ATTEMPT_TIMEOUT_MS = 8000;

/** Hàng đợi theo lượt cho một nguồn: các yêu cầu chạy tuần tự, cách nhau ≥1 giây. */
function makeThrottle(): () => Promise<void> {
  let last = 0;
  let queue: Promise<void> = Promise.resolve();
  return () => {
    const run = async () => {
      const wait = last + MIN_INTERVAL_MS - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      last = Date.now();
    };
    queue = queue.then(run, run);
    return queue;
  };
}

const waitTurn: Record<'nominatim' | 'photon', () => Promise<void>> = {
  nominatim: makeThrottle(),
  photon: makeThrottle(),
};

/**
 * Chờ lượt theo throttle của nguồn, gắn timeout cho lần thử,
 * và chuyển cả tín hiệu abort từ ngoài (người dùng rời màn hình...) vào fetch.
 */
async function attempt<T>(
  turn: () => Promise<void>,
  call: (signal: AbortSignal) => Promise<T>,
  external?: AbortSignal,
): Promise<T> {
  await turn();
  if (external?.aborted) throw new Error('Aborted');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ATTEMPT_TIMEOUT_MS);
  const forwardAbort = () => ctrl.abort();
  external?.addEventListener('abort', forwardAbort);
  try {
    return await call(ctrl.signal);
  } finally {
    clearTimeout(timer);
    external?.removeEventListener('abort', forwardAbort);
  }
}

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

const lat0 = (feature: PhotonFeature): number => Number(feature.geometry?.coordinates?.[1] ?? 0);

/** Trả địa chỉ (tên ngắn + địa chỉ đầy đủ) cho toạ độ; ném lỗi nếu cả hai nguồn đều hỏng. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeocodeLabel> {
  // Nominatim: display_name đầy đủ (đường, phường/xã, tỉnh) — test thực tế 200 OK.
  try {
    const data = await attempt(
      waitTurn.nominatim,
      (s) =>
        fetchJson<NominatimReverse>(
          `${NOMINATIM}/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`,
          NOMINATIM_HEADERS,
          s,
        ),
      signal,
    );
    if (!data.error && data.display_name) {
      return {
        label: labelFromNominatim(data.display_name, data.address),
        address: data.display_name,
      };
    }
  } catch {
    if (signal?.aborted) throw new Error('Aborted');
    // Nominatim 403/429/treo → Photon bên dưới
  }

  const data = await attempt(
    waitTurn.photon,
    (s) => fetchJson<PhotonResponse>(`${PHOTON}/reverse?lat=${lat}&lon=${lng}`, JSON_HEADERS, s),
    signal,
  );
  const feature = data.features?.[0];
  const result = feature ? fromPhotonFeature(feature, `rev-${lat}-${lng}`) : null;
  if (!result) throw new Error('Không tra được địa chỉ cho toạ độ này');
  return { label: result.label, address: result.address };
}

/** Tìm địa danh theo từ khoá, ưu tiên quanh vùng `bias`. Photon trước, Nominatim dự phòng. */
export async function searchPlaces(
  query: string,
  bias: Bias,
  limit: number,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  // Photon: chất lượng tiếng Việt tốt hơn (thử "bến xe Vinh", "sân bay Vinh", "Cửa Lò")
  // và không vi phạm lệnh cấm autocomplete phía client của Nominatim.
  try {
    const url = `${PHOTON}/api/?limit=${limit}&lat=${bias.lat}&lon=${bias.lng}&q=${encodeURIComponent(query)}`;
    const data = await attempt(waitTurn.photon, (s) => fetchJson<PhotonResponse>(url, JSON_HEADERS, s), signal);
    const mapped = (data.features ?? [])
      .map((feature, index) => fromPhotonFeature(feature, `p-${index}-${lat0(feature)}`))
      .filter((item): item is PlaceResult => item !== null);
    if (mapped.length > 0) return mapped;
  } catch {
    if (signal?.aborted) throw new Error('Aborted');
    // Photon lỗi → Nominatim bên dưới
  }

  const vb = `${bias.lng - 1.5},${bias.lat + 1.5},${bias.lng + 1.5},${bias.lat - 1.5}`;
  const url =
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=vn` +
    `&viewbox=${encodeURIComponent(vb)}&q=${encodeURIComponent(query)}`;
  const items = await attempt(
    waitTurn.nominatim,
    (s) => fetchJson<NominatimItem[]>(url, NOMINATIM_HEADERS, s),
    signal,
  );
  return items
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
}
