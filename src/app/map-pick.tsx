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
import MapView, { Marker } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';

import { AppButton, AppHeader, InlineNotice } from '../components/ui';
import { useRequests } from '../store/RequestsContext';
import type { TripPoint } from '../types';
import { colors, fontSize, radius, shadow, space } from '../theme';

/** Tâm Nghệ An — vùng mặc định khi chưa có điểm nào được chọn. */
const NGHE_AN: Region = {
  latitude: 18.6796,
  longitude: 105.6813,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

/** Nominatim (OpenStreetMap) — không cần API key. Chính sách: tối đa ~1 yêu cầu/giây. */
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const NOMINATIM_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Accept-Language': 'vi',
  'User-Agent': 'DiCungBan/1.0',
};

interface NominatimReverse {
  display_name?: string;
  address?: Record<string, unknown>;
  error?: unknown;
}

interface NominatimSearchItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface SearchItem {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

type AddrState =
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lng: number; label: string; address: string }
  | { status: 'error' };

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;

/** Tên ngắn (phường/xã/đường...) lấy từ kết quả Nominatim. */
function buildLabel(displayName: string, address?: Record<string, unknown>): string {
  const specific =
    (address &&
      (str(address.road) ??
        str(address.neighbourhood) ??
        str(address.hamlet) ??
        str(address.village) ??
        str(address.town) ??
        str(address.suburb) ??
        str(address.city) ??
        str(address.county))) ??
    undefined;
  return specific ?? displayName.split(',')[0]?.trim() ?? 'Vị trí đã chọn';
}

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
  const otherLabel = params.otherLabel;

  const initialRegion = useMemo<Region>(
    () =>
      selfLat != null && selfLng != null
        ? { latitude: selfLat, longitude: selfLng, latitudeDelta: 0.045, longitudeDelta: 0.045 }
        : otherLat != null && otherLng != null
          ? { latitude: otherLat, longitude: otherLng, latitudeDelta: 0.045, longitudeDelta: 0.045 }
          : NGHE_AN,
    [selfLat, selfLng, otherLat, otherLng],
  );

  const mapRef = useRef<MapView | null>(null);
  const regionRef = useRef<Region>(initialRegion);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeAbort = useRef<AbortController | null>(null);

  const [pin, setPin] = useState<{ lat: number; lng: number }>({
    lat: initialRegion.latitude,
    lng: initialRegion.longitude,
  });
  const [addr, setAddr] = useState<AddrState>({ status: 'loading' });

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const searchAbort = useRef<AbortController | null>(null);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeAbort.current?.abort();
    geocodeTimer.current = setTimeout(async () => {
      setAddr({ status: 'loading' });
      const ctrl = new AbortController();
      geocodeAbort.current = ctrl;
      try {
        const url = `${NOMINATIM}/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`;
        const res = await fetch(url, { headers: NOMINATIM_HEADERS, signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as NominatimReverse;
        if (data.error || !data.display_name) throw new Error('no result');
        if (ctrl.signal.aborted) return;
        setAddr({
          status: 'ok',
          lat,
          lng,
          label: buildLabel(data.display_name, data.address),
          address: data.display_name,
        });
      } catch {
        if (!ctrl.signal.aborted) setAddr({ status: 'error' });
      }
    }, 700);
  }, []);

  useEffect(() => {
    reverseGeocode(initialRegion.latitude, initialRegion.longitude);
    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      geocodeAbort.current?.abort();
      searchAbort.current?.abort();
    };
  }, [initialRegion, reverseGeocode]);

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      regionRef.current = region;
      setPin({ lat: region.latitude, lng: region.longitude });
      reverseGeocode(region.latitude, region.longitude);
    },
    [reverseGeocode],
  );

  const changeQuery = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      searchAbort.current?.abort();
      setResults([]);
      setSearching(false);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      searchAbort.current?.abort();
      const ctrl = new AbortController();
      searchAbort.current = ctrl;
      try {
        const r = regionRef.current;
        const vb = `${r.longitude - 1.5},${r.latitude + 1.5},${r.longitude + 1.5},${r.latitude - 1.5}`;
        const url =
          `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=vn` +
          `&viewbox=${encodeURIComponent(vb)}&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: NOMINATIM_HEADERS, signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as NominatimSearchItem[];
        if (ctrl.signal.aborted) return;
        const items: SearchItem[] = data
          .map((item) => {
            const lat = Number.parseFloat(item.lat);
            const lng = Number.parseFloat(item.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
              id: String(item.place_id),
              label: buildLabel(item.display_name),
              address: item.display_name,
              lat,
              lng,
            };
          })
          .filter((item): item is SearchItem => item !== null);
        setResults(items);
        setSearching(false);
      } catch {
        if (!ctrl.signal.aborted) {
          setResults([]);
          setSearching(false);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const selectResult = (item: SearchItem) => {
    Keyboard.dismiss();
    setQuery(item.label);
    setResults([]);
    const region: Region = {
      latitude: item.lat,
      longitude: item.lng,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
    regionRef.current = region;
    setPin({ lat: item.lat, lng: item.lng });
    mapRef.current?.animateToRegion(region, 350);
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
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          mapType="standard"
          onPress={() => {
            Keyboard.dismiss();
            setResults([]);
          }}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {otherLat != null && otherLng != null ? (
            <Marker
              coordinate={{ latitude: otherLat, longitude: otherLng }}
              anchor={{ x: 0.5, y: 1 }}
              pinColor={colors.warning}
              title={otherLabel?.trim() || (target === 'pickup' ? 'Điểm đến' : 'Điểm đón')}
            />
          ) : null}
        </MapView>

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
