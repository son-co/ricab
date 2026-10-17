import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import {
  AppButton,
  AppHeader,
  Card,
  EmptyState,
  InlineNotice,
  KeyValue,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../../components/ui';
import { CAR_LABEL, getService } from '../../data/mock';
import { useRequests } from '../../store/RequestsContext';
import type { BookingRequest } from '../../types';
import { colors, fontSize, radius, space } from '../../theme';
import { formatDateShort, formatClock, formatPhone, formatVnd, relativeTime } from '../../utils/format';
import { formatKm } from '../../utils/geo';

export default function RequestDetailScreen() {
  const params = useLocalSearchParams<{ id: string; created?: string }>();
  const { getRequest, acceptQuote, rejectQuote, requestRequote, cancelRequest } = useRequests();
  const [showPhone, setShowPhone] = useState(false);

  const request = getRequest(String(params.id));
  const justCreated = params.created === '1';

  if (!request) {
    return (
      <Screen>
        <AppHeader title="Chi tiết yêu cầu" onBack={() => router.back()} />
        <EmptyState
          icon="search-outline"
          title="Không tìm thấy yêu cầu"
          subtitle="Yêu cầu này không tồn tại hoặc đã bị xóa."
          actionLabel="Về trang chủ"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const service = getService(request.serviceId);
  const quote = request.quote;

  const cancel = () =>
    Alert.alert('Hủy yêu cầu?', 'Yêu cầu sẽ chuyển sang trạng thái Đã hủy.', [
      { text: 'Giữ lại', style: 'cancel' },
      { text: 'Hủy yêu cầu', style: 'destructive', onPress: () => cancelRequest(request.id, 'Khách hàng hủy yêu cầu') },
    ]);

  const waiting = (title: string, subtitle: string, tone: 'warning' | 'success' | 'info') => (
    <Card style={styles.waitCard}>
      <View style={[styles.waitIcon, { backgroundColor: toneColor(tone) + '22' }]}>
        <Ionicons
          name={tone === 'success' ? 'checkmark-circle' : 'hourglass-outline'}
          size={26}
          color={toneColor(tone)}
        />
      </View>
      <Text style={styles.waitTitle}>{title}</Text>
      <Text style={styles.waitText}>{subtitle}</Text>
    </Card>
  );

  return (
    <Screen>
      <AppHeader
        title="Chi tiết yêu cầu"
        subtitle={request.code}
        onBack={() => (justCreated ? router.replace('/history') : router.back())}
        right={<StatusBadge status={request.status} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {justCreated ? (
          <InlineNotice
            tone="success"
            icon="checkmark-circle-outline"
            message="Yêu cầu đã được gửi tới đại lý. Trạng thái: Đang tìm xe."
          />
        ) : null}

        <Card>
          <View style={styles.headRow}>
            <View style={[styles.serviceIcon, { backgroundColor: service.soft }]}>
              <Ionicons name={service.icon} size={22} color={service.tint} />
            </View>
            <View style={styles.headBody}>
              <Text style={styles.headTitle}>{service.name}</Text>
              <Text style={styles.headSub}>Cập nhật {relativeTime(request.updatedAt)}</Text>
            </View>
            <StatusBadge status={request.status} />
          </View>

          <View style={styles.route}>
            <View style={styles.routeRow}>
              <View style={styles.dot} />
              <View style={styles.routeBody}>
                <Text style={styles.routeLabel}>Điểm đón</Text>
                <Text style={styles.routeValue}>{request.pickup.label}</Text>
                {request.pickup.address ? <Text style={styles.routeAddr}>{request.pickup.address}</Text> : null}
                {request.pickup.oldWard ? <Text style={styles.routeOld}>Tên cũ: {request.pickup.oldWard}</Text> : null}
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, styles.dotEnd]} />
              <View style={styles.routeBody}>
                <Text style={styles.routeLabel}>Điểm đến</Text>
                <Text style={styles.routeValue}>{request.dropoff.label}</Text>
                {request.dropoff.address ? <Text style={styles.routeAddr}>{request.dropoff.address}</Text> : null}
                {request.dropoff.oldWard ? <Text style={styles.routeOld}>Tên cũ: {request.dropoff.oldWard}</Text> : null}
              </View>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <KeyValue label="Ngày đi" value={formatDateShort(request.date)} icon="calendar-outline" />
          <KeyValue label="Giờ đi" value={request.timeWindow ?? request.timeLabel} icon="time-outline" />
          <KeyValue label="Số lượng khách" value={`${request.passengers} khách`} icon="people-outline" />
          {request.carClass ? <KeyValue label="Loại xe" value={CAR_LABEL[request.carClass]} icon="car-outline" /> : null}
          {request.mode ? (
            <KeyValue label="Hình thức" value={request.mode === 'shared' ? 'Đi ghép' : 'Đi riêng'} icon="git-merge-outline" />
          ) : null}
          <KeyValue label="Người đặt" value={request.customerName} icon="person-outline" />
          <KeyValue
            label="Liên hệ"
            value={showPhone ? formatPhone(request.customerPhone) : mask(request.customerPhone)}
            icon="call-outline"
          />
          <AppButton
            title={showPhone ? 'Ẩn số điện thoại' : 'Hiện số điện thoại'}
            variant="ghost"
            icon={showPhone ? 'eye-off-outline' : 'eye-outline'}
            full={false}
            style={styles.phoneToggle}
            onPress={() => setShowPhone((v) => !v)}
          />
          {request.distanceKm ? (
            <KeyValue
              label="Khoảng cách"
              value={`${formatKm(request.distanceKm)}${
                request.estimatedPrice ? ` · dự kiến ${formatVnd(request.estimatedPrice)}` : ''
              }`}
              icon="navigate-outline"
            />
          ) : null}
        </Card>

        {request.note ? (
          <View style={styles.noteBox}>
            <View style={styles.noteHead}>
              <Ionicons name="document-text-outline" size={16} color={colors.warning} />
              <Text style={styles.noteTitle}>Ghi chú của khách</Text>
            </View>
            <Text style={styles.noteText}>{request.note}</Text>
          </View>
        ) : null}

        {/* ------------------------------- Báo giá ------------------------------- */}
        <SectionHeader title="Báo giá" />

        {request.status === 'finding_vehicle' || request.status === 'submitted' ? (
          waiting('Đang tìm xe', 'Đại lý đang tìm phương tiện phù hợp. Bạn sẽ nhận thông báo ngay khi có báo giá.', 'warning')
        ) : null}

        {request.status === 'quoted' && quote ? (
          <Card style={styles.quoteCard}>
            <View style={styles.quoteTop}>
              <Text style={styles.quoteLabel}>Báo giá từ đại lý</Text>
              <Text style={styles.quoteTime}>{relativeTime(quote.createdAt)}</Text>
            </View>
            <Text style={styles.quotePrice}>{formatVnd(quote.price)}</Text>
            <View style={styles.quoteTags}>
              <View style={styles.tag}>
                <Ionicons name="car-outline" size={14} color={colors.primary} />
                <Text style={styles.tagText}>{quote.carLabel}</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name={quote.mode === 'shared' ? 'people-outline' : 'person-outline'} size={14} color={colors.primary} />
                <Text style={styles.tagText}>{quote.mode === 'shared' ? 'Đi ghép' : 'Đi riêng'}</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="alarm-outline" size={14} color={colors.primary} />
                <Text style={styles.tagText}>Đón sau ~{quote.pickupEtaMin} phút</Text>
              </View>
            </View>
            {quote.extra ? <Text style={styles.quoteExtra}>{quote.extra}</Text> : null}

            <AppButton
              title="Chấp nhận báo giá"
              icon="checkmark-circle"
              onPress={() => acceptQuote(request.id)}
              style={styles.actionGap}
            />
            <AppButton
              title="Yêu cầu báo giá lại"
              variant="outline"
              icon="refresh"
              onPress={() => requestRequote(request.id)}
              style={styles.actionGap}
            />
            <AppButton title="Từ chối báo giá" variant="danger" icon="close-circle" onPress={() => rejectQuote(request.id)} />
          </Card>
        ) : null}

        {request.status === 'awaiting_agency'
          ? waiting(
              'Đang chờ đại lý phản hồi',
              'Bạn đã chấp nhận báo giá. Đại lý sẽ sớm xác nhận khả năng phục vụ và thông báo kết quả.',
              'warning',
            )
          : null}

        {request.status === 'customer_accepted'
          ? waiting('Đang xác nhận chuyến', 'Đại lý đang hoàn tất thông tin chuyến đi.', 'info')
          : null}

        {request.status === 'confirmed'
          ? waiting('Đã xác nhận chuyến', 'Đại lý đã xác nhận. Hẹn gặp bạn đúng giờ đã hẹn!', 'success')
          : null}

        {request.status === 'completed'
          ? waiting('Đã hoàn thành', 'Cảm ơn bạn đã sử dụng dịch vụ.', 'success')
          : null}

        {request.status === 'cancelled' ? (
          <Card style={styles.waitCard}>
            <View style={[styles.waitIcon, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="close-circle" size={26} color={colors.danger} />
            </View>
            <Text style={styles.waitTitle}>Yêu cầu đã hủy</Text>
            <Text style={styles.waitText}>Bạn có thể tạo yêu cầu mới bất cứ lúc nào.</Text>
            <AppButton title="Đặt xe lại" variant="outline" onPress={() => router.replace('/booking')} style={styles.actionGap} />
          </Card>
        ) : null}

        {/* ------------------------------ Timeline ------------------------------ */}
        <SectionHeader title="Trạng thái xử lý" />
        <Card>
          {request.timeline.map((event, index) => (
            <View key={`${event.status}-${event.at}-${index}`} style={styles.tlRow}>
              <View style={styles.tlLeft}>
                <View style={styles.tlDot} />
                {index < request.timeline.length - 1 ? <View style={styles.tlBar} /> : null}
              </View>
              <View style={styles.tlBody}>
                <Text style={styles.tlTitle}>{statusText(event.status)}</Text>
                {event.note ? <Text style={styles.tlNote}>{event.note}</Text> : null}
                <Text style={styles.tlTime}>
                  {formatDateShort(new Date(event.at).toISOString().slice(0, 10))} · {formatClock(event.at)}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {['finding_vehicle', 'quoted', 'awaiting_agency'].includes(request.status) ? (
          <AppButton title="Hủy yêu cầu" variant="danger" icon="trash-outline" onPress={cancel} style={styles.cancelBtn} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function mask(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '***';
  return `${digits.slice(0, 4)} *** ${digits.slice(-3)}`;
}

function statusText(status: BookingRequest['status']): string {
  const map: Record<BookingRequest['status'], string> = {
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
  return map[status];
}

function toneColor(tone: 'warning' | 'success' | 'info'): string {
  if (tone === 'success') return colors.success;
  if (tone === 'info') return colors.info;
  return colors.warning;
}

const styles = StyleSheet.create({
  content: { padding: space(4), paddingBottom: space(10) },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  serviceIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  headBody: { flex: 1 },
  headTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  headSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  route: { marginTop: space(4), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: space(4) },
  routeRow: { flexDirection: 'row', gap: space(3) },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 },
  dotEnd: { backgroundColor: colors.warning },
  routeLine: { width: 1.5, height: 18, backgroundColor: colors.borderStrong, marginLeft: 4, marginVertical: 2 },
  routeBody: { flex: 1 },
  routeLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  routeValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: 2 },
  routeAddr: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: 2 },
  routeOld: { fontSize: fontSize.xs, color: colors.warning, marginTop: 2, fontWeight: '600' },

  section: { marginTop: space(3) },
  phoneToggle: { alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: space(2) },

  noteBox: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: space(4),
    marginTop: space(3),
    borderWidth: 1,
    borderColor: '#F3DFC7',
  },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginBottom: space(1.5) },
  noteTitle: { fontSize: fontSize.sm, fontWeight: '800', color: '#96591C' },
  noteText: { fontSize: fontSize.sm, color: '#7A4A18', lineHeight: 20 },

  waitCard: { alignItems: 'center', paddingVertical: space(6) },
  waitIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: space(3) },
  waitTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  waitText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: space(2), lineHeight: 20 },

  quoteCard: { padding: space(5), borderColor: colors.primary, borderWidth: 1.5 },
  quoteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  quoteTime: { fontSize: fontSize.xs, color: colors.textFaint },
  quotePrice: { fontSize: 34, fontWeight: '900', color: colors.primary, marginTop: space(1) },
  quoteTags: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginTop: space(3) },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
  },
  tagText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  quoteExtra: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space(3), lineHeight: 20 },
  actionGap: { marginTop: space(4) },

  tlRow: { flexDirection: 'row', gap: space(3) },
  tlLeft: { width: 20, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginTop: 4 },
  tlBar: { flex: 1, width: 2, backgroundColor: colors.borderStrong, marginTop: 4 },
  tlBody: { flex: 1, paddingBottom: space(4) },
  tlTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  tlNote: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  tlTime: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: 3 },

  cancelBtn: { marginTop: space(5) },
});
