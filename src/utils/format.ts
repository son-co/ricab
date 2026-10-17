const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

export const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

export function groupDots(n: number): string {
  const sign = n < 0 ? '-' : '';
  const digits = Math.abs(Math.round(n)).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 150000 -> "150.000 ₫" */
export function formatVnd(n: number): string {
  return `${groupDots(n)} ₫`;
}

export function formatDateLong(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${pad2(d.getDate())} tháng ${d.getMonth() + 1}`;
}

/** 2026-10-09 -> "09/10/2026" */
export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/** "16:00 - 17:00" */
export function buildTimeWindows(): string[] {
  const windows: string[] = [];
  for (let h = 5; h <= 22; h += 1) {
    windows.push(`${pad2(h)}:00 - ${pad2(h + 1)}:00`);
  }
  return windows;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/** Che bớt số điện thoại trong danh sách. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '***';
  return `${digits.slice(0, 4)} *** ${digits.slice(-3)}`;
}

export function isPhoneValid(phone: string): boolean {
  return /^0\d{9}$/.test(phone.replace(/\D/g, ''));
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} giờ trước`;
  const day = Math.floor(hour / 24);
  if (day === 1) return 'Hôm qua';
  if (day < 7) return `${day} ngày trước`;
  return formatDateShort(new Date(ts).toISOString().slice(0, 10));
}

export function formatClock(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
