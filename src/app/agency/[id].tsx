import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import {
  AppButton,
  AppHeader,
  Card,
  Chip,
  EmptyState,
  Field,
  InlineNotice,
  KeyValue,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../../components/ui';
import { CAR_LABEL, getService } from '../../data/mock';
import { useRequests } from '../../store/RequestsContext';
import type { Quote, TravelMode } from '../../types';
import { colors, fontSize, radius, shadow, space } from '../../theme';
import { formatClock, formatDateShort, formatPhone, formatVnd, relativeTime } from '../../utils/format';
import { formatDuration, formatKm } from '../../utils/geo';

const CAR_CHOICES = ['Xe 4 chỗ', 'Xe 5 chỗ', 'Xe 7 chỗ', 'Xe 16 chỗ', 'Xe khác'];
const ETA_CHOICES = [15, 30, 45, 60];

export default function AgencyRequestScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getRequest, sendQuote, confirmTrip, completeTrip, cancelRequest } = useRequests();

  const request = getRequest(String(params.id));

  const [price, setPrice] = useState('');
  const [carLabel, setCarLabel] = useState(CAR_CHOICES[0]);
  const [mode, setMode] = useState<TravelMode>('private');
  const [eta, setEta] = useState(30);
  const [extra, setExtra] = useState('');
  const [error, setError] = useState('');
  const [showPhone, setShowPhone] = useState(false);

  const service = request ? getService(request.serviceId) : undefined;

  const initialPrice = useMemo(() => {
    if (!request) return '';
    const suggested = request.estimatedPrice ?? request.quote?.price;
    return suggested ? String(suggested) : '';
  }, [request]);

  if (!request || !service) {
    return (
      <Screen>
        <AppHeader title="Yêu cầu" onBack={() => router.back()} />
        <EmptyState
          icon="search-outline"
          title="Không tìm thấy yêu cầu"
          actionLabel="Về danh sách"
          onAction={() => router.replace('/agency')}
        />
      </Screen>
    );
  }

  const canQuote = ['finding_vehicle', 'quoted', 'submitted'].includes(request.status);

  const submitQuote = () => {
    const value = Number.parseInt(price.replace(/\D/g, ''), 10);
    if (!value || value <= 0) {
      setError('Nhập giá chuyến đi (số lớn hơn 0).');
      return;
    }
    setError('');
    const quote: Quote = {
      price: value,
      carLabel,
      mode,
      pickupEtaMin: eta,
      extra: extra.trim() || undefined,
      createdAt: Date.now(),
    };
    sendQuote(request.id, quote);
  };

  const confirm = () => confirmTrip(request.id);
  const complete = () => completeTrip(request.id);
  const cancel = () =>
    Alert.alert('Hủy yêu cầu?', 'Khách hàng sẽ nhận thông báo yêu cầu đã hủy.', [
      { text: 'Giữ lại', style: 'cancel' },
      { text: 'Hủy yêu cầu', style: 'destructive', onPress: () => cancelRequest(request.id, 'Đại lý hủy yêu cầu') },
    ]);

  const priceValue = Number.parseInt(price.replace(/\D/g, ''), 10) || 0;

  return (
    <Screen>
      <AppHeader
        title="Yêu cầu của khách"
        subtitle={request.code}
        onBack={() => router.back()}
        right={<StatusBadge status={request.status} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.headRow}>
            <View style={[styles.serviceIcon, { backgroundColor: service.soft }]}>
              <Ionicons name={service.icon} size={22} color={service.tint} />
            </View>
            <View style={styles.headBody}>
              <Text style={styles.headTitle}>{request.customerName}</Text>
              <Text style={styles.headSub}>
                {service.name} · {relativeTime(request.createdAt)}
              </Text>
            </View>
            <PressableContact onPress={() => setShowPhone((v) => !v)} visible={showPhone} phone={request.customerPhone} />
          </View>

          <View style={styles.divider} />
          <KeyValue label="Điểm đón" value={request.pickup.label} icon="location-outline" emphasized />
          <KeyValue label="Điểm đến" value={request.dropoff.label} icon="flag-outline" emphasized />
          {(request.pickup.oldWard || request.dropoff.oldWard) && (
            <KeyValue
              label="Địa danh cũ"
              value={[request.pickup.oldWard, request.dropoff.oldWard].filter(Boolean).join(' · ')}
              icon="map-outline"
            />
          )}
          <KeyValue label="Ngày đi" value={formatDateShort(request.date)} icon="calendar-outline" />
          <KeyValue label="Giờ đi" value={request.timeWindow ?? request.timeLabel} icon="time-outline" />
          <KeyValue label="Số khách" value={`${request.passengers} khách`} icon="people-outline" />
          {request.carClass ? <KeyValue label="Loại xe yêu cầu" value={CAR_LABEL[request.carClass]} icon="car-outline" /> : null}
          {request.mode ? (
            <KeyValue label="Hình thức" value={request.mode === 'shared' ? 'Đi ghép' : 'Đi riêng'} icon="git-merge-outline" />
          ) : null}
          {request.distanceKm ? (
            <KeyValue
              label="Khoảng cách"
              value={`${formatKm(request.distanceKm)} · ~${formatDuration(
                Math.round((request.distanceKm / 32) * 60) + 8,
              )}`}
              icon="navigate-outline"
            />
          ) : null}
        </Card>

        {request.note ? (
          <View style={styles.noteBox}>
            <View style={styles.noteHead}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
              <Text style={styles.noteTitle}>Ghi chú cần lưu ý trước khi báo giá</Text>
            </View>
            <Text style={styles.noteText}>{request.note}</Text>
          </View>
        ) : null}

        {/* ------------------------------ Hành động ------------------------------ */}
        <SectionHeader title="Cập nhật xử lý" />

        {canQuote ? (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>{request.status === 'quoted' ? 'Gửi báo giá mới' : 'Gửi báo giá'}</Text>
            {request.estimatedPrice ? (
              <InlineNotice
                tone="info"
                icon="pricetag-outline"
                message={`Giá hệ thống ước tính: ${formatVnd(request.estimatedPrice)}. Báo giá của bạn hiển thị cho khách trước khi chấp nhận.`}
              />
            ) : null}

            <Field
              label="Giá chuyến đi (₫)"
              value={price}
              onChangeText={setPrice}
              placeholder={initialPrice || 'VD: 250000'}
              keyboardType="number-pad"
              error={error}
              hint={priceValue > 0 ? `Khách sẽ thấy: ${formatVnd(priceValue)}` : 'Nhập số tiền, ví dụ 250000'}
            />

            <Text style={styles.formLabel}>Loại xe dự kiến</Text>
            <View style={styles.chips}>
              {CAR_CHOICES.map((label) => (
                <Chip key={label} label={label} active={carLabel === label} onPress={() => setCarLabel(label)} />
              ))}
            </View>

            <Text style={styles.formLabel}>Hình thức</Text>
            <View style={styles.chips}>
              <Chip label="Đi riêng" active={mode === 'private'} onPress={() => setMode('private')} />
              <Chip label="Đi ghép" active={mode === 'shared'} onPress={() => setMode('shared')} />
            </View>

            <Text style={styles.formLabel}>Thời gian dự kiến đón</Text>
            <View style={styles.chips}>
              {ETA_CHOICES.map((value) => (
                <Chip
                  key={value}
                  label={`Sau ${value} phút`}
                  active={eta === value}
                  onPress={() => setEta(value)}
                />
              ))}
            </View>

            <Field
              label="Thông tin bổ sung"
              value={extra}
              onChangeText={setExtra}
              placeholder="VD: Xe 7 chỗ màu trắng, tài xế sẽ gọi trước 5 phút..."
              multiline
            />

            <AppButton title="Gửi báo giá cho khách" icon="paper-plane" onPress={submitQuote} />
          </Card>
        ) : null}

        {request.status === 'awaiting_agency' ? (
          <Card style={styles.actionCard}>
            <View style={styles.acceptHead}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.acceptTitle}>Khách đã chấp nhận báo giá</Text>
            </View>
            {request.quote ? (
              <KeyValue label="Giá đã chốt" value={formatVnd(request.quote.price)} icon="pricetag-outline" emphasized />
            ) : null}
            <Text style={styles.acceptHint}>Xác nhận khả năng phục vụ để hoàn tất thông tin chuyến.</Text>
            <AppButton title="Xác nhận chuyến" icon="checkmark-circle" onPress={confirm} style={styles.actionGap} />
            <AppButton title="Hủy yêu cầu" variant="danger" icon="close-circle" onPress={cancel} />
          </Card>
        ) : null}

        {request.status === 'confirmed' ? (
          <Card style={styles.actionCard}>
            <View style={styles.acceptHead}>
              <Ionicons name="car-sport" size={22} color={colors.primary} />
              <Text style={styles.acceptTitle}>Chuyến đã xác nhận</Text>
            </View>
            <Text style={styles.acceptHint}>Đánh dấu hoàn thành khi khách đã lên xe / nhận hàng xong.</Text>
            <AppButton title="Hoàn thành chuyến" icon="flag" onPress={complete} style={styles.actionGap} />
            <AppButton title="Hủy yêu cầu" variant="danger" onPress={cancel} />
          </Card>
        ) : null}

        {request.status === 'completed' || request.status === 'cancelled' ? (
          <InlineNotice
            tone={request.status === 'completed' ? 'success' : 'danger'}
            message={
              request.status === 'completed'
                ? 'Yêu cầu này đã hoàn thành.'
                : 'Yêu cầu này đã bị hủy.'
            }
          />
        ) : null}

        {request.status === 'quoted' && request.quote ? (
          <Card style={styles.actionCard}>
            <Text style={styles.acceptHint}>
              Đã gửi báo giá {formatVnd(request.quote.price)} — chờ khách xử lý. Khách sẽ chọn Chấp nhận hoặc Từ chối.
            </Text>
            <AppButton title="Về danh sách" variant="outline" onPress={() => router.replace('/agency')} />
          </Card>
        ) : null}

        <SectionHeader title="Lịch sử trạng thái" />
        <Card>
          {request.timeline.map((event, index) => (
            <View key={`${event.status}-${event.at}-${index}`} style={styles.tlRow}>
              <View style={styles.tlLeft}>
                <View style={styles.tlDot} />
                {index < request.timeline.length - 1 ? <View style={styles.tlBar} /> : null}
              </View>
              <View style={styles.tlBody}>
                <Text style={styles.tlTitle}>{event.note ?? event.status}</Text>
                <Text style={styles.tlTime}>
                  {formatDateShort(new Date(event.at).toISOString().slice(0, 10))} · {formatClock(event.at)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function PressableContact({
  visible,
  phone,
  onPress,
}: {
  visible: boolean;
  phone: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.contact}>
      <Text style={styles.contactText}>
        {visible ? formatPhone(phone) : `${phone.slice(0, 4)} *** ${phone.slice(-3)}`}
      </Text>
      <AppButton
        title={visible ? 'Ẩn' : 'Hiện SĐT'}
        variant="ghost"
        full={false}
        style={styles.contactBtn}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), paddingBottom: space(10) },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  serviceIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  headBody: { flex: 1 },
  headTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  headSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  contact: { alignItems: 'flex-end' },
  contactText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700' },
  contactBtn: { minHeight: 34, paddingHorizontal: space(2) },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space(3) },

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

  formCard: { padding: space(4), borderColor: colors.primary, borderWidth: 1.5, ...shadow.card },
  formTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: space(3) },
  formLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: space(2) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: space(3) },

  actionCard: { padding: space(4) },
  acceptHead: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginBottom: space(2) },
  acceptTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  acceptHint: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20, marginBottom: space(2) },
  actionGap: { marginTop: space(3) },

  tlRow: { flexDirection: 'row', gap: space(3) },
  tlLeft: { width: 20, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginTop: 4 },
  tlBar: { flex: 1, width: 2, backgroundColor: colors.borderStrong, marginTop: 4 },
  tlBody: { flex: 1, paddingBottom: space(4) },
  tlTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  tlTime: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: 3 },
});
