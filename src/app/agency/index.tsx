import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { RequestCard } from '../../components/RequestCard';
import {
  AppButton,
  AppHeader,
  Chip,
  CountBadge,
  EmptyState,
  LoadingState,
  Screen,
} from '../../components/ui';
import { useRequests } from '../../store/RequestsContext';
import type { BookingRequest, RequestStatus } from '../../types';
import { colors, fontSize, radius, shadow, space } from '../../theme';

type FilterId = 'all' | 'new' | 'quoted' | 'awaiting' | 'done';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'new', label: 'Yêu cầu mới' },
  { id: 'quoted', label: 'Đã báo giá' },
  { id: 'awaiting', label: 'Chờ xác nhận' },
  { id: 'done', label: 'Hoàn thành' },
];

const DONE_STATUSES: RequestStatus[] = ['completed', 'cancelled'];

export default function AgencyInboxScreen() {
  const { requests, unread, markRead } = useRequests();
  const [filter, setFilter] = useState<FilterId>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mô phỏng tải dữ liệu mạng để thấy trạng thái loading.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const fresh = requests.filter((r) => r.status === 'finding_vehicle' && !r.quote);
    const quoted = requests.filter((r) => r.status === 'quoted');
    const waiting = requests.filter((r) => r.status === 'awaiting_agency');
    return { fresh: fresh.length, quoted: quoted.length, waiting: waiting.length, total: requests.length };
  }, [requests]);

  const filtered = useMemo(() => {
    const sorted = [...requests].sort((a, b) => b.updatedAt - a.updatedAt);
    if (filter === 'new') return sorted.filter((r) => r.status === 'finding_vehicle');
    if (filter === 'quoted') return sorted.filter((r) => r.status === 'quoted');
    if (filter === 'awaiting') return sorted.filter((r) => r.status === 'awaiting_agency');
    if (filter === 'done') return sorted.filter((r) => DONE_STATUSES.includes(r.status));
    return sorted;
  }, [requests, filter]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const open = (request: BookingRequest) => router.push(`/agency/${request.id}`);

  return (
    <Screen>
      <AppHeader
        title="Khu vực đại lý"
        subtitle={`${requests.length} yêu cầu trong khu vực`}
        onBack={() => router.back()}
        right={
          <View style={styles.bellWrap}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.bellDot}>
              <CountBadge count={unread.agency} />
            </View>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.statsRow}>
          <StatBox label="Yêu cầu mới" value={stats.fresh} tone="warning" />
          <StatBox label="Đã báo giá" value={stats.quoted} tone="info" />
          <StatBox label="Chờ xác nhận" value={stats.waiting} tone="success" />
        </View>

        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              active={filter === item.id}
              onPress={() => {
                setFilter(item.id);
                markRead('agency');
              }}
            />
          ))}
        </View>

        {loading ? (
          <LoadingState label="Đang tải yêu cầu mới..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="albums-outline"
            title="Không có yêu cầu nào"
            subtitle="Khi khách hàng gửi yêu cầu, thông báo sẽ hiển thị tại đây."
            actionLabel="Tải lại"
            onAction={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
          />
        ) : (
          filtered.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              showCustomer
              fresh={request.status === 'finding_vehicle' && !request.quote}
              onPress={() => open(request)}
            />
          ))
        )}

        <AppButton
          title="Về trang khách hàng"
          variant="ghost"
          icon="swap-horizontal"
          onPress={() => router.replace('/')}
          style={styles.switchBtn}
        />
      </ScrollView>
    </Screen>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'warning' | 'info' | 'success';
}) {
  const bg =
    tone === 'warning' ? colors.warningSoft : tone === 'info' ? colors.infoSoft : colors.successSoft;
  const fg = tone === 'warning' ? '#B4691F' : tone === 'info' ? colors.info : colors.success;
  return (
    <View style={[styles.stat, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), paddingBottom: space(10) },
  bellWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 6, right: 4 },

  statsRow: { flexDirection: 'row', gap: space(3), marginBottom: space(4) },
  stat: { flex: 1, borderRadius: radius.md, padding: space(3), alignItems: 'center', ...shadow.soft },
  statValue: { fontSize: fontSize.xxl, fontWeight: '900' },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: space(3) },
  switchBtn: { marginTop: space(4) },
});
