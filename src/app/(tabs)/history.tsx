import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { RequestCard } from '../../components/RequestCard';
import { AppButton, AppHeader, Chip, EmptyState, LoadingState, Screen } from '../../components/ui';
import { useRequests } from '../../store/RequestsContext';
import { colors, fontSize, space } from '../../theme';

type FilterId = 'active' | 'done' | 'cancelled' | 'all';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'active', label: 'Đang xử lý' },
  { id: 'done', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
  { id: 'all', label: 'Tất cả' },
];

export default function HistoryScreen() {
  const { myRequests } = useRequests();
  const [filter, setFilter] = useState<FilterId>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const list = useMemo(() => {
    const sorted = [...myRequests].sort((a, b) => b.updatedAt - a.updatedAt);
    if (filter === 'active') {
      return sorted.filter((r) => !['completed', 'cancelled'].includes(r.status));
    }
    if (filter === 'done') return sorted.filter((r) => r.status === 'completed');
    if (filter === 'cancelled') return sorted.filter((r) => r.status === 'cancelled');
    return sorted;
  }, [myRequests, filter]);

  return (
    <Screen>
      <AppHeader title="Lịch sử yêu cầu" subtitle="Theo dõi trạng thái các chuyến đi" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              active={filter === item.id}
              onPress={() => setFilter(item.id)}
            />
          ))}
        </View>

        {loading ? (
          <LoadingState label="Đang tải lịch sử..." />
        ) : list.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="Chưa có yêu cầu nào"
            subtitle="Các chuyến đi của bạn sẽ hiển thị tại đây."
            actionLabel="Đặt xe ngay"
            onAction={() => router.push('/booking')}
          />
        ) : (
          list.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onPress={() => router.push(`/request/${request.id}`)}
            />
          ))
        )}

        <Text style={styles.privacy}>
          Lịch sử được lưu trên thiết bị này. Số điện thoại của bạn được che bớt trong danh sách.
        </Text>
        <AppButton
          title="Đặt yêu cầu mới"
          icon="add-circle"
          onPress={() => router.push('/booking')}
          style={styles.cta}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), paddingBottom: space(10) },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: space(3) },
  privacy: { fontSize: fontSize.xs, color: colors.textFaint, textAlign: 'center', marginTop: space(3), lineHeight: 18 },
  cta: { marginTop: space(4) },
});
