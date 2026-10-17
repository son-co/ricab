import type { CarClass, LatLng, ServiceId, TravelMode } from '../types';

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Khoảng cách đường chim bay (km). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Khoảng cách thực tế ước tính (đường bộ) lớn hơn đường chim bay một chút. */
export function roadDistanceKm(a: LatLng, b: LatLng): number {
  return Math.round(haversineKm(a, b) * 1.18 * 10) / 10;
}

export function formatKm(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatDuration(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} giờ` : `${h} giờ ${rest} phút`;
}

interface EstimateInput {
  serviceId: ServiceId;
  km: number;
  carClass?: CarClass;
  mode?: TravelMode;
}

interface Estimate {
  price: number;
  durationMin: number;
}

const round1000 = (n: number): number => Math.round(n / 1000) * 1000;

const CHARTER_RATE: Record<CarClass, { perKm: number; min: number }> = {
  '5': { perKm: 11000, min: 150000 },
  '7': { perKm: 14000, min: 200000 },
  '16': { perKm: 18000, min: 350000 },
  other: { perKm: 13000, min: 180000 },
};

/** Ước tính giá và thời gian di chuyển (chưa phải báo giá chính thức của đại lý). */
export function estimateTrip(input: EstimateInput): Estimate {
  const { serviceId, km, carClass, mode } = input;
  const durationMin = Math.round((km / 32) * 60) + 8;
  let price = 40000;

  if (serviceId === 'charter') {
    const rate = CHARTER_RATE[carClass ?? '5'];
    price = Math.max(rate.min, rate.perKm * km);
  } else if (serviceId === 'shared') {
    price = Math.max(20000, 10000 + 3500 * km);
  } else if (serviceId === 'delivery') {
    price = Math.max(20000, 12000 + 5000 * km);
  } else if (mode === 'shared') {
    price = Math.max(20000, 10000 + 3500 * km);
  } else {
    price = Math.max(40000, 12000 + 14000 * km);
  }

  return { price: round1000(price), durationMin };
}
