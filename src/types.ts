export type ServiceId = 'taxi' | 'charter' | 'shared' | 'delivery';

export type CarClass = '5' | '7' | '16' | 'other';

export type TravelMode = 'private' | 'shared';

export type TimeOption = 'now' | 'asap' | 'window';

export type RequestStatus =
  | 'draft'
  | 'pending_confirm'
  | 'submitted'
  | 'finding_vehicle'
  | 'quoted'
  | 'customer_accepted'
  | 'awaiting_agency'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  oldName?: string;
}

/** Một đầu điểm của hành trình: có thể chọn từ gợi ý hoặc tự nhập tay. */
export interface TripPoint {
  label: string;
  address?: string;
  oldWard?: string;
  lat?: number;
  lng?: number;
}

export interface Quote {
  price: number;
  carLabel: string;
  mode: TravelMode;
  pickupEtaMin: number;
  extra?: string;
  createdAt: number;
}

export interface TimelineEvent {
  status: RequestStatus;
  at: number;
  note?: string;
}

export interface BookingRequest {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: ServiceId;
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
  pickup: TripPoint;
  dropoff: TripPoint;
  /** ISO date YYYY-MM-DD */
  date: string;
  timeOption: TimeOption;
  timeWindow?: string;
  timeLabel: string;
  passengers: number;
  carClass?: CarClass;
  mode?: TravelMode;
  note: string;
  distanceKm?: number;
  estimatedPrice?: number;
  quote?: Quote | null;
  timeline: TimelineEvent[];
}

export type Audience = 'customer' | 'agency';

export interface AppNotification {
  id: string;
  requestId?: string;
  audience: Audience;
  title: string;
  body: string;
  at: number;
  read: boolean;
}
