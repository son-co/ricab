import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';

import type {
  AppNotification,
  BookingRequest,
  CarClass,
  PlaceSuggestion,
  RequestStatus,
  ServiceId,
  StatusTone,
  TimeOption,
} from '../types';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface ServiceMeta {
  id: ServiceId;
  name: string;
  subtitle: string;
  description: string;
  icon: IconName;
  tint: string;
  soft: string;
}

export const SERVICES: ServiceMeta[] = [
  {
    id: 'taxi',
    name: 'Taxi',
    subtitle: 'Đặt xe nhanh',
    description: 'Đón tận nơi trong nội thành, báo giá trước khi đi.',
    icon: 'car-sport',
    tint: '#2E7D52',
    soft: '#DCEFE2',
  },
  {
    id: 'charter',
    name: 'Bao xe riêng',
    subtitle: 'Đi thoải mái',
    description: 'Xe nguyên chuyến theo yêu cầu: 5 chỗ, 7 chỗ, 16 chỗ.',
    icon: 'shield-checkmark',
    tint: '#5B5BD6',
    soft: '#E5E5FB',
  },
  {
    id: 'shared',
    name: 'Xe ghép',
    subtitle: 'Tiết kiệm hơn',
    description: 'Ghép chuyến cùng hướng, giá thấp hơn so với đi riêng.',
    icon: 'people',
    tint: '#D96A3F',
    soft: '#FBE5DA',
  },
  {
    id: 'delivery',
    name: 'Giao hàng',
    subtitle: 'Gửi tận nơi',
    description: 'Gửi và nhận hàng trong khu vực lân cận, giao nhanh.',
    icon: 'cube',
    tint: '#3D6FA6',
    soft: '#E2EDF9',
  },
];

export const SERVICE_MAP: Record<ServiceId, ServiceMeta> = SERVICES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<ServiceId, ServiceMeta>,
);

export const getService = (id: ServiceId): ServiceMeta => SERVICE_MAP[id];

export interface CarOption {
  id: CarClass;
  label: string;
  hint: string;
}

export const CAR_OPTIONS: CarOption[] = [
  { id: '5', label: 'Xe 5 chỗ', hint: 'Sedan / hatchback' },
  { id: '7', label: 'Xe 7 chỗ', hint: 'MPV, rộng hành lý' },
  { id: '16', label: 'Xe 16 chỗ', hint: 'Nhóm đông người' },
  { id: 'other', label: 'Xe khác', hint: 'Mô tả thêm ở ghi chú' },
];

export const CAR_LABEL: Record<CarClass, string> = {
  '5': 'Xe 5 chỗ',
  '7': 'Xe 7 chỗ',
  '16': 'Xe 16 chỗ',
  other: 'Xe khác',
};

export interface TimeOptionMeta {
  id: TimeOption;
  label: string;
  hint: string;
  icon: IconName;
}

export const TIME_OPTIONS: TimeOptionMeta[] = [
  { id: 'now', label: 'Đón ngay', hint: 'Trong vòng 15 phút', icon: 'flash' },
  { id: 'asap', label: 'Sớm nhất có thể', hint: 'Trong vòng 30 phút', icon: 'time-outline' },
  { id: 'window', label: 'Chọn giờ chính xác', hint: 'Nhập khung giờ cụ thể', icon: 'calendar-outline' },
];

export const NOTE_SUGGESTIONS: string[] = [
  'Không đi xe điện',
  'Không ngồi hàng ghế cuối',
  'Có trẻ em hoặc người lớn tuổi',
  'Có nhiều hành lý',
  'Cần hỗ trợ lấy hoặc giao hàng',
  'Yêu cầu điểm đón cụ thể',
];

export const PLACES: PlaceSuggestion[] = [
  { id: 'p-vinh', name: 'TP. Vinh', address: 'Trung tâm thành phố, Nghệ An', lat: 18.6796, lng: 105.6813 },
  { id: 'p-airport', name: 'Sân bay Vinh', address: 'Đường Nguyễn Văn Cừ, TP. Vinh', lat: 18.7357, lng: 105.6659, oldName: 'Xã Nghi Phú (cũ)' },
  { id: 'p-bus', name: 'Bến xe Vinh', address: 'Đường Phan Đình Phùng, TP. Vinh', lat: 18.6665, lng: 105.6805 },
  { id: 'p-cualo', name: 'Bãi biển Cửa Lò', address: 'Thị xã Cửa Lò, Nghệ An', lat: 18.7863, lng: 105.6963, oldName: 'Xã Hải Thành (cũ)' },
  { id: 'p-thiencam', name: 'Bãi biển Thiên Cầm', address: 'Huyện Cẩm Xuyên, Hà Tĩnh', lat: 18.6985, lng: 106.0014 },
  { id: 'p-dienchau', name: 'Diễn Châu', address: 'Huyện Diễn Châu, Nghệ An', lat: 18.7607, lng: 105.6206 },
  { id: 'p-yenthanh', name: 'Yên Thành', address: 'Huyện Yên Thành, Nghệ An', lat: 19.2165, lng: 105.4276 },
  { id: 'p-nghidan', name: 'Nghĩa Đàn', address: 'Huyện Nghĩa Đàn, Nghệ An', lat: 19.2501, lng: 105.447 },
  { id: 'p-thaihoa', name: 'Thái Hòa', address: 'Thị xã Thái Hòa, Nghệ An', lat: 19.2533, lng: 105.3233 },
  { id: 'p-quynhluu', name: 'Quỳnh Lưu', address: 'Huyện Quỳnh Lưu, Nghệ An', lat: 19.1067, lng: 105.6517 },
  { id: 'p-nghiloc', name: 'Nghi Lộc', address: 'Huyện Nghi Lộc, Nghệ An', lat: 18.8514, lng: 105.6997 },
  { id: 'p-hoangmai', name: 'Hoằng Mai', address: 'Huyện Hậu Lộc, Thanh Hóa', lat: 19.9667, lng: 105.8833 },
];

export const PLACES_BY_ID: Record<string, PlaceSuggestion> = PLACES.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {},
);

export const CURRENT_LOCATION = { label: 'Nghệ An', lat: 18.6796, lng: 105.6813 };

export const STATUS_LABEL: Record<RequestStatus, string> = {
  draft: 'Nháp',
  pending_confirm: 'Chờ khách hàng xác nhận',
  submitted: 'Đã gửi yêu cầu',
  finding_vehicle: 'Đang tìm xe',
  quoted: 'Đã có báo giá',
  customer_accepted: 'Khách đã chấp nhận báo giá',
  awaiting_agency: 'Đang chờ đại lý phản hồi',
  confirmed: 'Đã xác nhận chuyến',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

export const STATUS_TONE: Record<RequestStatus, StatusTone> = {
  draft: 'neutral',
  pending_confirm: 'warning',
  submitted: 'info',
  finding_vehicle: 'warning',
  quoted: 'info',
  customer_accepted: 'info',
  awaiting_agency: 'warning',
  confirmed: 'success',
  completed: 'success',
  cancelled: 'danger',
};

/** Trạng thái mà đại lý còn phải xử lý. */
export const AGENCY_OPEN_STATUSES: RequestStatus[] = [
  'finding_vehicle',
  'quoted',
  'awaiting_agency',
  'confirmed',
];

const now = Date.now();
const HOUR = 3600 * 1000;

function seedTimeline(status: BookingRequest['status'], at: number, note?: string) {
  return [{ status, at, note }];
}

export const INITIAL_REQUESTS: BookingRequest[] = [
  {
    id: 'r-seed-1',
    code: 'DCB-1041',
    customerId: 'me',
    customerName: 'Khách của bạn',
    customerPhone: '0912345678',
    serviceId: 'taxi',
    status: 'finding_vehicle',
    createdAt: now - 2 * HOUR,
    updatedAt: now - 2 * HOUR,
    pickup: { label: 'Bến xe Vinh', address: 'Đường Phan Đình Phùng, TP. Vinh', lat: 18.6665, lng: 105.6805 },
    dropoff: { label: 'Bãi biển Cửa Lò', address: 'Thị xã Cửa Lò, Nghệ An', lat: 18.7863, lng: 105.6963, oldWard: 'Xã Hải Thành (cũ)' },
    date: '2026-10-17',
    timeOption: 'asap',
    timeLabel: 'Sớm nhất có thể (trong vòng 30 phút)',
    passengers: 2,
    mode: 'private',
    note: 'Có nhiều hành lý.',
    distanceKm: 14.6,
    estimatedPrice: 220000,
    quote: null,
    timeline: seedTimeline('finding_vehicle', now - 2 * HOUR, 'Yêu cầu đã được gửi tới đại lý'),
  },
  {
    id: 'r-seed-2',
    code: 'DCB-1040',
    customerId: 'other-1',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0987654321',
    serviceId: 'charter',
    status: 'finding_vehicle',
    createdAt: now - 40 * 60 * 1000,
    updatedAt: now - 40 * 60 * 1000,
    pickup: { label: 'TP. Vinh', address: 'Trung tâm thành phố, Nghệ An', lat: 18.6796, lng: 105.6813 },
    dropoff: { label: 'Yên Thành', address: 'Huyện Yên Thành, Nghệ An', lat: 19.2165, lng: 105.4276 },
    date: '2026-10-18',
    timeOption: 'window',
    timeWindow: '06:00 - 07:00',
    timeLabel: '06:00 - 07:00, 18/10/2026',
    passengers: 5,
    carClass: '7',
    mode: 'private',
    note: 'Có trẻ em, cần ghế an toàn nếu có.',
    distanceKm: 58.4,
    estimatedPrice: 650000,
    quote: null,
    timeline: seedTimeline('finding_vehicle', now - 40 * 60 * 1000, 'Yêu cầu đã được gửi tới đại lý'),
  },
  {
    id: 'r-seed-3',
    code: 'DCB-1039',
    customerId: 'other-2',
    customerName: 'Trần Thị B',
    customerPhone: '0903111222',
    serviceId: 'shared',
    status: 'finding_vehicle',
    createdAt: now - 6 * 60 * 1000,
    updatedAt: now - 6 * 60 * 1000,
    pickup: { label: 'Sân bay Vinh', address: 'Đường Nguyễn Văn Cừ, TP. Vinh', lat: 18.7357, lng: 105.6659, oldWard: 'Xã Nghi Phú (cũ)' },
    dropoff: { label: 'TP. Vinh', address: 'Trung tâm thành phố, Nghệ An', lat: 18.6796, lng: 105.6813 },
    date: '2026-10-17',
    timeOption: 'now',
    timeLabel: 'Đón ngay (trong vòng 15 phút)',
    passengers: 1,
    mode: 'shared',
    note: 'Không đi xe điện.',
    distanceKm: 8.2,
    estimatedPrice: 40000,
    quote: null,
    timeline: seedTimeline('finding_vehicle', now - 6 * 60 * 1000, 'Yêu cầu đã được gửi tới đại lý'),
  },
  {
    id: 'r-seed-4',
    code: 'DCB-1032',
    customerId: 'me',
    customerName: 'Khách của bạn',
    customerPhone: '0912345678',
    serviceId: 'delivery',
    status: 'completed',
    createdAt: now - 26 * HOUR,
    updatedAt: now - 23 * HOUR,
    pickup: { label: 'Diễn Châu', address: 'Huyện Diễn Châu, Nghệ An', lat: 18.7607, lng: 105.6206 },
    dropoff: { label: 'TP. Vinh', address: 'Trung tâm thành phố, Nghệ An', lat: 18.6796, lng: 105.6813 },
    date: '2026-10-16',
    timeOption: 'window',
    timeWindow: '09:00 - 10:00',
    timeLabel: '09:00 - 10:00, 16/10/2026',
    passengers: 1,
    note: 'Gói hàng cỡ nhỏ, dễ vỡ.',
    distanceKm: 31.5,
    estimatedPrice: 170000,
    quote: {
      price: 170000,
      carLabel: 'Xe máy / xe ba gác',
      mode: 'private',
      pickupEtaMin: 20,
      extra: 'Đã giao tận nơi, có ảnh xác nhận.',
      createdAt: now - 25 * HOUR,
    },
    timeline: [
      { status: 'finding_vehicle', at: now - 26 * HOUR, note: 'Yêu cầu đã được gửi tới đại lý' },
      { status: 'quoted', at: now - 25.5 * HOUR, note: 'Đại lý gửi báo giá 170.000 ₫' },
      { status: 'awaiting_agency', at: now - 25 * HOUR, note: 'Khách hàng chấp nhận báo giá' },
      { status: 'confirmed', at: now - 24 * HOUR, note: 'Đại lý xác nhận chuyến' },
      { status: 'completed', at: now - 23 * HOUR, note: 'Chuyến hàng đã hoàn thành' },
    ],
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-seed-1',
    requestId: 'r-seed-3',
    audience: 'agency',
    title: 'Yêu cầu mới · Xe ghép',
    body: 'Trần Thị B cần ghép chuyến Sân bay Vinh → TP. Vinh, đón ngay.',
    at: now - 6 * 60 * 1000,
    read: false,
  },
  {
    id: 'n-seed-2',
    requestId: 'r-seed-2',
    audience: 'agency',
    title: 'Yêu cầu mới · Bao xe riêng',
    body: 'Nguyễn Văn A cần bao xe 7 chỗ đi Yên Thành lúc 06:00 - 07:00.',
    at: now - 40 * 60 * 1000,
    read: false,
  },
  {
    id: 'n-seed-3',
    requestId: 'r-seed-4',
    audience: 'customer',
    title: 'Chuyến hàng đã hoàn thành',
    body: 'Yêu cầu DCB-1032 đã được giao thành công.',
    at: now - 23 * HOUR,
    read: true,
  },
];

export const WHY_US = [
  { index: '01', title: 'Nhiều lựa chọn', subtitle: 'Đa dạng dịch vụ, phù hợp nhu cầu' },
  { index: '02', title: 'Báo giá minh bạch', subtitle: 'So sánh và chọn giá tốt nhất' },
];
