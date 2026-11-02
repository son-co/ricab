import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { LeafletMap } from '../components/LeafletMap';
import type { LeafletMapHandle, MapMarker } from '../components/LeafletMap';
import { AppButton, AppHeader, InlineNotice } from '../components/ui';
import { useRequests } from '../store/RequestsContext';
import { reverseGeocode as fetchAddress, searchPlaces } from '../utils/geocode';
import type { PlaceResult } from '../utils/geocode';
import type { TripPoint } from '../types';
import { colors, fontSize, radius, shadow, space } from '../theme';

/** Tâm Nghệ An — vùng mặc định khi chưa có điểm nào được chọn. */
const NGHE_AN = { lat: 18.6796, lng: 105.6813 };

type AddrState =
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lng: number; label: string; address: string }
  | { status: 'error' };

const parseNum = (v?: string): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export default function MapPickScreen() {
  const params = useLocalSearchParams<{
    target?: string;
    lat?: string;
    lng?: string;
    otherLat?: string;
    otherLng?: string;
    otherLabel?: string;
  }>();

  const target: 'pickup' | 'dropoff' = params.target === 'dropoff' ? 'dropoff' : 'pickup';
  const { setMapPick } = useRequests();

  const selfLat = parseNum(params.lat);
  const selfLng = parseNum(params.lng);
  const otherLat = parseNum(params.otherLat);
  const otherLng = parseNum(params.otherLng);
  const otherLabel = params.otherLabel?.trim();

  // useMemo để identity ổn định — nếu tạo object mới mỗi render thì effect địa chỉ sẽ lặp vô hạn.
  const initialCenter = useMemo(
    () =>
      selfLat != null && selfLng != null
        ? { lat: selfLat, lng: selfLng }
        : otherLat != null && otherLng != null
          ? { lat: otherLat, lng: otherLng }
          : NGHE_AN,
    [selfLat, selfLng, otherLat, otherLng],
  );
  const initialZoom = initialCenter === NGHE_AN ? 11 : 14;

  const otherMarker = useMemo<MapMarker | null>(
    () =>
      otherLat != null && otherLng != null
        ? {
            lat: otherLat,
            lng: otherLng,
            label: otherLabel || (target === 'pickup' ? 'Điểm đến' : 'Điểm đón'),
          }
        : null,
    [otherLat, otherLng, otherLabel, target],
  );

  const mapRef = useRef<LeafletMapHandle>(null);
  const centerRef = useRef(initialCenter);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeAbort = useRef<AbortController | null>(null);

  const [pin, setPin] = useState<{ lat: number; lng: number }>(initialCenter);
  const [addr, setAddr] = useState<AddrState>({ status: 'loading' });

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  /** Từ khoá đã tìm xong — để hiện "không tìm thấy" đúng với từ khoá hiện tại. */
  const [searchedQ, setSearchedQ] = useState<string | null>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Nhãn vừa chọn trong danh sách — lần chọn này không cần tự tìm lại. */
  const pickedRef = useRef<string | null>(null);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeAbort.current?.abort();
    geocodeTimer.current = setTimeout(async () => {
      setAddr({ status: 'loading' });
      const ctrl = new AbortController();
      geocodeAbort.current = ctrl;
      try {
        const result = await fetchAddress(lat, lng, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setAddr({ status: 'ok', lat, lng, label: result.label, address: result.address });
      } catch {
        if (!ctrl.signal.aborted) setAddr({ status: 'error' });
      }
    }, 700);
  }, []);

  useEffect(() => {
    reverseGeocode(initialCenter.lat, initialCenter.lng);
    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      geocodeAbort.current?.abort();
      searchAbort.current?.abort();
    };
  }, [initialCenter, reverseGeocode]);

  const handleMoveEnd = useCallback(
    (lat: number, lng: number) => {
      centerRef.current = { lat, lng };
      setPin({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    searchAbort.current?.abort();
    const ctrl = new AbortController();
    searchAbort.current = ctrl;
    try {
      const items = await searchPlaces(q, centerRef.current, 6, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setResults(items);
      setSearchedQ(q);
      setSearching(false);
    } catch {
      if (!ctrl.signal.aborted) {
        setResults([]);
        setSearchedQ(q);
        setSearching(false);
      }
    }
  }, []);

  // Tự tìm sau 500ms ngừng gõ; vừa chọn xong một kết quả thì bỏ qua lần tìm trùng.
  useEffect(() => {
    if (pickedRef.current !== null) {
      const samePick = pickedRef.current === query.trim();
      pickedRef.current = null;
      if (samePick) return;
    }
    const q = query.trim();
    if (q.length < 2) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchTimer.current = null;
      doSearch(q);
    }, 500);
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    };
  }, [query, doSearch]);

  const changeQuery = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
      searchAbort.current?.abort();
      setResults([]);
      setSearchedQ(null);
      setSearching(false);
    }
  };

  /** Bấm nút "search" trên bàn phím → tìm ngay, không chờ debounce. */
  const submitSearch = () => {
    const q = query.trim();
    if (q.length < 2) return;
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }
    Keyboard.dismiss();
    doSearch(q);
  };

  const selectResult = (item: PlaceResult) => {
    Keyboard.dismiss();
    pickedRef.current = item.label;
    setQuery(item.label);
    setResults([]);
    setSearchedQ(null);
    centerRef.current = { lat: item.lat, lng: item.lng };
    setPin({ lat: item.lat, lng: item.lng });
    mapRef.current?.setView(item.lat, item.lng, 16);
    reverseGeocode(item.lat, item.lng);
  };

  /** Địa chỉ đã khớp với toạ độ đang ghim (tránh hiển thị địa chỉ cũ khi vừa di chuyển). */
  const resolved =
    addr.status === 'ok' && addr.lat === pin.lat && addr.lng === pin.lng
      ? { label: addr.label, address: addr.address }
      : null;

  const confirming = useRef(false);
  const confirm = () => {
    if (confirming.current) return; // chống bấm đúp làm lọt qua luôn màn đặt xe
    confirming.current = true;
    const point: TripPoint = {
      label: resolved ? resolved.label : 'Vị trí trên bản đồ',
      address: resolved ? resolved.address : `Toạ độ ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`,
      lat: pin.lat,
      lng: pin.lng,
    };
    setMapPick({ target, point });
    router.back();
  };

  const targetLabel = target === 'pickup' ? 'điểm đón' : 'điểm đến';

  return (
    <View style={styles.root}>
      <AppHeader
        title="Chọn trên bản đồ"
        subtitle={`Di chuyển bản đồ để ghim ${targetLabel}`}
        onBack={() => router.back()}
      />

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={changeQuery}
            placeholder="Tìm địa danh (VD: Cửa Lò, bến xe Vinh...)"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
          />
          {query ? (
            <Pressable onPress={() => changeQuery('')} hitSlop={10}>
              {searching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="close-circle" size={18} color={colors.textFaint} />
              )}
            </Pressable>
          ) : null}
        </View>

        {searchedQ === query.trim() && !searching && results.length === 0 && query.trim().length >= 2 ? (
          <View style={styles.resultsCard}>
            <View style={styles.emptyRow}>
              <Ionicons name="search-outline" size={16} color={colors.textFaint} />
              <Text style={styles.emptyText}>Không tìm thấy địa danh nào cho “{query.trim()}”</Text>
            </View>
          </View>
        ) : null}

        {results.length > 0 ? (
          <View style={styles.resultsCard}>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.resultItem, pressed && styles.resultPressed]}
                  onPress={() => selectResult(item)}
                >
                  <View style={styles.resultIcon}>
                    <Ionicons name="location-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.resultBody}>
                    <Text style={styles.resultLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={styles.resultAddress} numberOfLines={2}>
                      {item.address}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.mapArea}>
        <LeafletMap
          ref={mapRef}
          center={initialCenter}
          zoom={initialZoom}
          other={otherMarker}
          onMoveEnd={handleMoveEnd}
        />

        <View pointerEvents="none" style={styles.pinWrap}>
          <Ionicons name="location" size={46} color={colors.primary} style={styles.pin} />
        </View>

        <View pointerEvents="none" style={styles.hintPill}>
          <Text style={styles.hintText}>Di chuyển bản đồ để chọn vị trí chính xác</Text>
        </View>

        {!resolved && addr.status !== 'error' ? (
          <View pointerEvents="none" style={styles.loadingChip}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Đang lấy địa chỉ...</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.addrRow}>
          <View style={styles.addrIcon}>
            <Ionicons name={target === 'pickup' ? 'location' : 'flag'} size={20} color={colors.primary} />
          </View>
          <View style={styles.addrBody}>
            <Text style={styles.addrLabel} numberOfLines={1}>
              {resolved ? resolved.label : `Vị trí ${targetLabel}`}
            </Text>
            <Text style={styles.addrText} numberOfLines={2}>
              {resolved
                ? resolved.address
                : `Toạ độ ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)} — ${
                    addr.status === 'error' ? 'không tra được địa chỉ' : 'đang xác định địa chỉ...'
                  }`}
            </Text>
          </View>
        </View>

        {addr.status === 'error' && !resolved ? (
          <InlineNotice
            tone="danger"
            icon="cloud-offline-outline"
            message="Không tra được địa chỉ (kiểm tra mạng). Bạn vẫn có thể dùng tọa độ đã ghim."
          />
        ) : null}

        <AppButton title="Sử dụng vị trí này" icon="checkmark-circle" onPress={confirm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  searchWrap: {
    position: 'relative',
    zIndex: 20,
    paddingHorizontal: space(4),
    paddingTop: space(1),
    paddingBottom: space(2),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: space(3.5),
    paddingVertical: space(3),
    ...shadow.soft,
  },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text, padding: 0 },
  resultsCard: {
    position: 'absolute',
    top: '100%',
    left: space(4),
    right: space(4),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  resultsList: { maxHeight: 260 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultPressed: { backgroundColor: colors.greySoft },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space(3),
  },
  resultBody: { flex: 1 },
  resultLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  resultAddress: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    padding: space(3.5),
  },
  emptyText: { flex: 1, fontSize: fontSize.xs, color: colors.textMuted },

  mapArea: { flex: 1, overflow: 'hidden' },
  pinWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    transform: [{ translateY: -23 }],
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  hintPill: {
    position: 'absolute',
    top: space(2),
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: space(3.5),
    paddingVertical: space(1.5),
    ...shadow.soft,
  },
  hintText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  loadingChip: {
    position: 'absolute',
    bottom: space(3),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.pill,
    paddingHorizontal: space(3.5),
    paddingVertical: space(2),
    ...shadow.soft,
  },
  loadingText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' },

  bottomCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    padding: space(4),
    paddingBottom: space(7),
    gap: space(3),
    ...shadow.card,
  },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  addrIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrBody: { flex: 1 },
  addrLabel: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  addrText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
});
