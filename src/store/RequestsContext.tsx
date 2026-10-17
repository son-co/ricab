import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';

import { INITIAL_NOTIFICATIONS, INITIAL_REQUESTS, getService } from '../data/mock';
import type {
  AppNotification,
  Audience,
  BookingRequest,
  Quote,
  TimelineEvent,
} from '../types';
import { formatVnd } from '../utils/format';

const STORAGE_KEY = '@di-cung-ban/state/v1';

export type Role = 'customer' | 'agency';

interface PersistedState {
  requests: BookingRequest[];
  notifications: AppNotification[];
  role: Role;
}

interface State extends PersistedState {
  hydrated: boolean;
}

type Action =
  | { type: 'hydrate'; payload: PersistedState }
  | { type: 'create'; request: BookingRequest; notification: AppNotification }
  | {
      type: 'update';
      id: string;
      patch: Partial<BookingRequest>;
      event?: TimelineEvent;
      notification?: AppNotification;
    }
  | { type: 'read'; audience: Audience }
  | { type: 'role'; role: Role };

const initialState: State = {
  requests: INITIAL_REQUESTS,
  notifications: INITIAL_NOTIFICATIONS,
  role: 'customer',
  hydrated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, hydrated: true };

    case 'create':
      return {
        ...state,
        requests: [action.request, ...state.requests],
        notifications: [action.notification, ...state.notifications],
      };

    case 'update': {
      const requests = state.requests.map((r) =>
        r.id === action.id
          ? {
              ...r,
              ...action.patch,
              updatedAt: Date.now(),
              timeline: action.event ? [...r.timeline, action.event] : r.timeline,
            }
          : r,
      );
      return {
        ...state,
        requests,
        notifications: action.notification
          ? [action.notification, ...state.notifications]
          : state.notifications,
      };
    }

    case 'read':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.audience === action.audience ? { ...n, read: true } : n,
        ),
      };

    case 'role':
      return { ...state, role: action.role };

    default:
      return state;
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function nextCode(requests: BookingRequest[]): string {
  const nums = requests
    .map((r) => Number.parseInt(r.code.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 1040;
  return `DCB-${max + 1}`;
}

export interface NewRequestInput {
  serviceId: BookingRequest['serviceId'];
  pickup: BookingRequest['pickup'];
  dropoff: BookingRequest['dropoff'];
  date: string;
  timeOption: BookingRequest['timeOption'];
  timeWindow?: string;
  timeLabel: string;
  passengers: number;
  carClass?: BookingRequest['carClass'];
  mode?: BookingRequest['mode'];
  customerName: string;
  customerPhone: string;
  note: string;
  distanceKm?: number;
  estimatedPrice?: number;
}

interface RequestsContextValue extends PersistedState {
  hydrated: boolean;
  myRequests: BookingRequest[];
  unread: Record<Audience, number>;
  getRequest: (id: string) => BookingRequest | undefined;
  notificationsFor: (audience: Audience) => AppNotification[];
  markRead: (audience: Audience) => void;
  setRole: (role: Role) => void;
  createRequest: (input: NewRequestInput) => BookingRequest;
  sendQuote: (id: string, quote: Quote) => void;
  acceptQuote: (id: string) => void;
  rejectQuote: (id: string) => void;
  requestRequote: (id: string) => void;
  confirmTrip: (id: string) => void;
  completeTrip: (id: string) => void;
  cancelRequest: (id: string, reason: string) => void;
  resetDemo: () => void;
}

const RequestsContext = createContext<RequestsContextValue | null>(null);

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as PersistedState;
            dispatch({ type: 'hydrate', payload: parsed });
            return;
          } catch {
            // dữ liệu hỏng -> dùng dữ liệu mẫu
          }
        }
        dispatch({ type: 'hydrate', payload: { requests: INITIAL_REQUESTS, notifications: INITIAL_NOTIFICATIONS, role: 'customer' } });
      })
      .catch(() => {
        dispatch({ type: 'hydrate', payload: { requests: INITIAL_REQUESTS, notifications: INITIAL_NOTIFICATIONS, role: 'customer' } });
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const payload: PersistedState = {
      requests: state.requests,
      notifications: state.notifications.slice(0, 50),
      role: state.role,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [state.hydrated, state.requests, state.notifications, state.role]);

  const createRequest = useCallback(
    (input: NewRequestInput): BookingRequest => {
      const at = Date.now();
      const service = getService(input.serviceId);
      const request: BookingRequest = {
        ...input,
        id: makeId('r'),
        code: nextCode(state.requests),
        customerId: 'me',
        status: 'finding_vehicle',
        createdAt: at,
        updatedAt: at,
        quote: null,
        timeline: [{ status: 'finding_vehicle', at, note: 'Yêu cầu đã được gửi tới đại lý' }],
      };
      const notification: AppNotification = {
        id: makeId('n'),
        requestId: request.id,
        audience: 'agency',
        title: `Yêu cầu mới · ${service.name}`,
        body: `${request.customerName}: ${request.pickup.label} → ${request.dropoff.label}, ${request.timeLabel}.`,
        at,
        read: false,
      };
      dispatch({ type: 'create', request, notification });
      return request;
    },
    [state.requests],
  );

  const update = useCallback(
    (
      id: string,
      patch: Partial<BookingRequest>,
      event: TimelineEvent | undefined,
      notification: AppNotification | undefined,
    ) => {
      dispatch({ type: 'update', id, patch, event, notification });
    },
    [],
  );

  const sendQuote = useCallback(
    (id: string, quote: Quote) => {
      const request = state.requests.find((r) => r.id === id);
      if (!request) return;
      const at = Date.now();
      update(
        id,
        { status: 'quoted', quote },
        { status: 'quoted', at, note: `Đại lý gửi báo giá ${formatVnd(quote.price)} · ${quote.carLabel}` },
        {
          id: makeId('n'),
          requestId: id,
          audience: 'customer',
          title: `Đã có báo giá · ${request.code}`,
          body: `${formatVnd(quote.price)} · ${quote.carLabel}, đón sau khoảng ${quote.pickupEtaMin} phút.`,
          at,
          read: false,
        },
      );
    },
    [state.requests, update],
  );

  const acceptQuote = useCallback(
    (id: string) => {
      const request = state.requests.find((r) => r.id === id);
      if (!request) return;
      const at = Date.now();
      update(
        id,
        { status: 'awaiting_agency' },
        { status: 'awaiting_agency', at, note: 'Khách hàng chấp nhận báo giá' },
        {
          id: makeId('n'),
          requestId: id,
          audience: 'agency',
          title: `Khách đã chấp nhận báo giá · ${request.code}`,
          body: `${request.customerName} chấp nhận ${formatVnd(request.quote?.price ?? 0)}. Vui lòng xác nhận chuyến.`,
          at,
          read: false,
        },
      );
    },
    [state.requests, update],
  );

  const rejectQuote = useCallback(
    (id: string) => {
      const request = state.requests.find((r) => r.id === id);
      if (!request) return;
      const at = Date.now();
      update(
        id,
        { status: 'finding_vehicle', quote: null },
        { status: 'finding_vehicle', at, note: 'Khách hàng từ chối báo giá, tiếp tục tìm xe' },
        {
          id: makeId('n'),
          requestId: id,
          audience: 'agency',
          title: `Khách từ chối báo giá · ${request.code}`,
          body: `${request.customerName} từ chối báo giá. Hãy gửi báo giá mới nếu phù hợp.`,
          at,
          read: false,
        },
      );
    },
    [state.requests, update],
  );

  const requestRequote = useCallback(
    (id: string) => {
      const request = state.requests.find((r) => r.id === id);
      if (!request) return;
      const at = Date.now();
      update(
        id,
        { status: 'finding_vehicle', quote: null },
        { status: 'finding_vehicle', at, note: 'Khách hàng yêu cầu báo giá lại' },
        {
          id: makeId('n'),
          requestId: id,
          audience: 'agency',
          title: `Yêu cầu báo giá lại · ${request.code}`,
          body: `${request.customerName} muốn nhận thêm thông tin hoặc báo giá khác.`,
          at,
          read: false,
        },
      );
    },
    [state.requests, update],
  );

  const confirmTrip = useCallback(
    (id: string) => {
      const request = state.requests.find((r) => r.id === id);
      if (!request) return;
      const at = Date.now();
      update(
        id,
        { status: 'confirmed' },
        { status: 'confirmed', at, note: 'Đại lý xác nhận khả năng phục vụ' },
        {
          id: makeId('n'),
          requestId: id,
          audience: 'customer',
          title: `Đã xác nhận chuyến · ${request.code}`,
          body: 'Đại lý đã xác nhận. Hẹn gặp bạn đúng giờ!',
          at,
          read: false,
        },
      );
    },
    [state.requests, update],
  );

  const completeTrip = useCallback(
    (id: string) => {
      const request = state.requests.find((r) => r.id === id);
      if (!request) return;
      const at = Date.now();
      update(
        id,
        { status: 'completed' },
        { status: 'completed', at, note: 'Chuyến đi đã hoàn thành' },
        {
          id: makeId('n'),
          requestId: id,
          audience: 'customer',
          title: `Chuyến đi hoàn thành · ${request.code}`,
          body: 'Cảm ơn bạn đã sử dụng dịch vụ.',
          at,
          read: false,
        },
      );
    },
    [state.requests, update],
  );

  const cancelRequest = useCallback(
    (id: string, reason: string) => {
      const request = state.requests.find((r) => r.id === id);
      if (!request) return;
      const at = Date.now();
      const byCustomer = request.customerId === 'me';
      update(
        id,
        { status: 'cancelled' },
        { status: 'cancelled', at, note: reason },
        {
          id: makeId('n'),
          requestId: id,
          audience: byCustomer ? 'agency' : 'customer',
          title: `Yêu cầu đã hủy · ${request.code}`,
          body: reason,
          at,
          read: false,
        },
      );
    },
    [state.requests, update],
  );

  const markRead = useCallback((audience: Audience) => dispatch({ type: 'read', audience }), []);
  const setRole = useCallback((role: Role) => dispatch({ type: 'role', role }), []);

  const resetDemo = useCallback(() => {
    dispatch({
      type: 'hydrate',
      payload: { requests: INITIAL_REQUESTS, notifications: INITIAL_NOTIFICATIONS, role: 'customer' },
    });
  }, []);

  const value = useMemo<RequestsContextValue>(() => {
    const unread: Record<Audience, number> = {
      customer: state.notifications.filter((n) => n.audience === 'customer' && !n.read).length,
      agency: state.notifications.filter((n) => n.audience === 'agency' && !n.read).length,
    };
    return {
      requests: state.requests,
      notifications: state.notifications,
      role: state.role,
      hydrated: state.hydrated,
      myRequests: state.requests.filter((r) => r.customerId === 'me'),
      unread,
      getRequest: (id: string) => state.requests.find((r) => r.id === id),
      notificationsFor: (audience: Audience) => state.notifications.filter((n) => n.audience === audience),
      markRead,
      setRole,
      createRequest,
      sendQuote,
      acceptQuote,
      rejectQuote,
      requestRequote,
      confirmTrip,
      completeTrip,
      cancelRequest,
      resetDemo,
    };
  }, [
    state.requests,
    state.notifications,
    state.role,
    state.hydrated,
    markRead,
    setRole,
    createRequest,
    sendQuote,
    acceptQuote,
    rejectQuote,
    requestRequote,
    confirmTrip,
    completeTrip,
    cancelRequest,
    resetDemo,
  ]);

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

export function useRequests(): RequestsContextValue {
  const ctx = useContext(RequestsContext);
  if (!ctx) throw new Error('useRequests phải được dùng bên trong RequestsProvider');
  return ctx;
}
