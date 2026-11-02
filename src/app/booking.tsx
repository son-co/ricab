import { useCallback, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { PlacePicker } from '../components/PlacePicker';
import {
  AppButton,
  AppHeader,
  Card,
  Chip,
  Field,
  InlineNotice,
  KeyValue,
  Screen,
  SectionHeader,
  Stepper,
} from '../components/ui';
import {
  CAR_OPTIONS,
  CAR_LABEL,
  NOTE_SUGGESTIONS,
  SERVICES,
  TIME_OPTIONS,
  getService,
} from '../data/mock';
import { useRequests } from '../store/RequestsContext';
import type { CarClass, ServiceId, TimeOption, TravelMode, TripPoint } from '../types';
import { colors, fontSize, radius, shadow, space } from '../theme';
import {
  addDays,
  buildTimeWindows,
  formatDateShort,
  formatVnd,
  isPhoneValid,
  toIsoDate,
} from '../utils/format';
import { estimateTrip, formatDuration, formatKm, roadDistanceKm } from '../utils/geo';

const STEP_LABELS = ['Dịch vụ & giờ', 'Hành trình', 'Thông tin khách', 'Xác nhận'];

const EMPTY_POINT: TripPoint = { label: '' };

type Errors = Record<string, string>;

export default function BookingScreen() {
  const params = useLocalSearchParams<{ service?: string }>();
  const { createRequest, mapPick, setMapPick } = useRequests();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});

  const validService = (value?: string): ServiceId | undefined =>
    value && ['taxi', 'charter', 'shared', 'delivery'].includes(value) ? (value as ServiceId) : undefined;

  const [serviceId, setServiceId] = useState<ServiceId | undefined>(validService(params.service));
  const [carClass, setCarClass] = useState<CarClass | undefined>(undefined);
  const [mode, setMode] = useState<TravelMode>('private');
  const [timeOption, setTimeOption] = useState<TimeOption | undefined>(undefined);
  const [date, setDate] = useState<string>(toIsoDate(new Date()));
  const [timeWindow, setTimeWindow] = useState<string | undefined>(undefined);

  const [pickup, setPickup] = useState<TripPoint>(EMPTY_POINT);
  const [dropoff, setDropoff] = useState<TripPoint>(EMPTY_POINT);

  // Nhận điểm vừa ghim trên bản đồ khi quay lại màn đặt xe
  useFocusEffect(
    useCallback(() => {
      if (!mapPick) return;
      if (mapPick.target === 'pickup') setPickup(mapPick.point);
      else setDropoff(mapPick.point);
      setMapPick(null);
    }, [mapPick, setMapPick]),
  );

  const openMapPick = (target: 'pickup' | 'dropoff') => {
    const self = target === 'pickup' ? pickup : dropoff;
    const other = target === 'pickup' ? dropoff : pickup;
    router.push({
      pathname: '/map-pick',
      params: {
        target,
        ...(self.lat != null && self.lng != null
          ? { lat: String(self.lat), lng: String(self.lng) }
          : {}),
        ...(other.lat != null && other.lng != null
          ? {
              otherLat: String(other.lat),
              otherLng: String(other.lng),
              ...(other.label.trim() ? { otherLabel: other.label.trim() } : {}),
            }
          : {}),
      },
    });
  };

  const [passengers, setPassengers] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [noteText, setNoteText] = useState('');

  const service = serviceId ? getService(serviceId) : undefined;
  const windows = useMemo(() => buildTimeWindows(), []);
  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

  const tripInfo = useMemo(() => {
    if (!pickup.lat || !pickup.lng || !dropoff.lat || !dropoff.lng) return undefined;
    const km = roadDistanceKm(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: dropoff.lat, lng: dropoff.lng },
    );
    if (!serviceId) return { km, durationMin: 0, price: 0, ready: false };
    const est = estimateTrip({ serviceId, km, carClass, mode });
    return { km, durationMin: est.durationMin, price: est.price, ready: true };
  }, [pickup, dropoff, serviceId, carClass, mode]);

  const timeLabel = (): string => {
    if (timeOption === 'now') return 'Đón ngay (trong vòng 15 phút)';
    if (timeOption === 'asap') return 'Sớm nhất có thể (trong vòng 30 phút)';
    return `${timeWindow ?? ''}, ${formatDateShort(date)}`;
  };

  const noteSummary = (): string =>
    [...notes, noteText.trim()].filter(Boolean).join(' · ');

  const validate = (fromStep: number): Errors => {
    const next: Errors = {};
    if (fromStep <= 0) {
      if (!serviceId) next.service = 'Bạn phải chọn dịch vụ trước khi đặt.';
      if (!timeOption) next.time = 'Chọn một trong ba phương án giờ đi.';
      if (timeOption === 'window' && !timeWindow) next.window = 'Chọn khung giờ chính xác.';
      if (serviceId === 'charter' && !carClass) next.car = 'Bao xe phải chọn loại xe (5 chỗ / 7 chỗ...).';
    }
    if (fromStep <= 1) {
      if (!pickup.label.trim()) next.pickup = 'Nhập điểm đón.';
      if (!dropoff.label.trim()) next.dropoff = 'Nhập điểm đến.';
    }
    if (fromStep <= 2) {
      if (!customerName.trim()) next.name = 'Nhập thông tin người đặt.';
      if (!isPhoneValid(customerPhone)) next.phone = 'Nhập số điện thoại liên hệ hợp lệ (10 số).';
      if (passengers < 1) next.passengers = 'Số lượng khách phải từ 1.';
    }
    return next;
  };

  const goNext = () => {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step < STEP_LABELS.length - 1) {
      setStep(step + 1);
      return;
    }
    submit();
  };

  const submit = () => {
    const found = validate(2);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStep(2);
      return;
    }
    const request = createRequest({
      serviceId: serviceId as ServiceId,
      pickup,
      dropoff,
      date: timeOption === 'window' ? date : toIsoDate(new Date()),
      timeOption: timeOption as TimeOption,
      timeWindow: timeOption === 'window' ? timeWindow : undefined,
      timeLabel: timeLabel(),
      passengers,
      carClass: serviceId === 'charter' ? carClass : undefined,
      mode: serviceId === 'shared' ? 'shared' : serviceId === 'charter' ? 'private' : mode,
      customerName: customerName.trim(),
      customerPhone: customerPhone.replace(/\D/g, ''),
      note: noteSummary(),
      distanceKm: tripInfo?.km,
      estimatedPrice: tripInfo?.ready ? tripInfo.price : undefined,
    });
    router.replace(`/request/${request.id}?created=1`);
  };

  const errorList = Object.values(errors);

  return (
    <Screen>
      <AppHeader
        title="Đặt xe"
        subtitle={`Bước ${step + 1}/4 · ${STEP_LABELS[step]}`}
        onBack={() => (step === 0 ? router.back() : setStep(step - 1))}
      />

      <View style={styles.progress}>
        {STEP_LABELS.map((label, index) => (
          <View key={label} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                index < step && styles.progressDone,
                index === step && styles.progressActive,
              ]}
            >
              <Text style={[styles.progressDotText, (index <= step) && styles.progressDotTextActive]}>
                {index + 1}
              </Text>
            </View>
            <Text
              style={[styles.progressLabel, index === step && styles.progressLabelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {errorList.length > 0 ? (
          <InlineNotice tone="danger" icon="alert-circle-outline" message={errorList.join('\n')} />
        ) : null}

        {step === 0 ? (
          <View>
            <SectionHeader title="Chọn dịch vụ" />
            <View style={styles.grid}>
              {SERVICES.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  icon={item.icon}
                  active={serviceId === item.id}
                  onPress={() => {
                    setServiceId(item.id);
                    setErrors({});
                  }}
                  style={styles.serviceChip}
                />
              ))}
            </View>
            {errors.service ? <Text style={styles.error}>{errors.service}</Text> : null}
            <Text style={styles.serviceHint}>
              {service ? service.description : 'Chọn một dịch vụ để tiếp tục.'}
            </Text>

            {serviceId === 'charter' ? (
              <View style={styles.block}>
                <SectionHeader title="Loại xe" />
                <View style={styles.grid}>
                  {CAR_OPTIONS.map((option) => (
                    <Chip
                      key={option.id}
                      label={option.label}
                      active={carClass === option.id}
                      onPress={() => {
                        setCarClass(option.id);
                        setErrors({});
                      }}
                      style={styles.serviceChip}
                    />
                  ))}
                </View>
                {errors.car ? <Text style={styles.error}>{errors.car}</Text> : null}
              </View>
            ) : null}

            {serviceId === 'taxi' ? (
              <View style={styles.block}>
                <SectionHeader title="Hình thức đi" />
                <View style={styles.grid}>
                  <Chip label="Đi riêng" active={mode === 'private'} onPress={() => setMode('private')} style={styles.serviceChip} />
                  <Chip label="Đi ghép" active={mode === 'shared'} onPress={() => setMode('shared')} style={styles.serviceChip} />
                </View>
              </View>
            ) : null}

            <View style={styles.block}>
              <SectionHeader title="Chọn giờ đi" />
              <View style={styles.timeList}>
                {TIME_OPTIONS.map((option) => (
                  <PressableRow
                    key={option.id}
                    active={timeOption === option.id}
                    icon={option.icon}
                    label={option.label}
                    hint={option.hint}
                    onPress={() => {
                      setTimeOption(option.id);
                      setErrors({});
                    }}
                  />
                ))}
              </View>
              {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}

              {timeOption === 'window' ? (
                <View style={styles.block}>
                  <Text style={styles.subLabel}>Ngày đi</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                    {dates.map((d) => {
                      const iso = toIsoDate(d);
                      return (
                        <Chip
                          key={iso}
                          label={formatDateShort(iso)}
                          active={date === iso}
                          onPress={() => setDate(iso)}
                        />
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.subLabel}>Khung giờ</Text>
                  <View style={styles.grid}>
                    {windows.map((w) => (
                      <Chip
                        key={w}
                        label={w}
                        active={timeWindow === w}
                        onPress={() => {
                          setTimeWindow(w);
                          setErrors({});
                        }}
                        style={styles.windowChip}
                      />
                    ))}
                  </View>
                  {errors.window ? <Text style={styles.error}>{errors.window}</Text> : null}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View>
            <SectionHeader title="Nhập điểm đón" />
            <PlacePicker
              label="Điểm đón"
              icon="location"
              value={pickup}
              onChange={setPickup}
              placeholder="VD: Bến xe Vinh, sân bay..."
              error={errors.pickup}
              onPickOnMap={() => openMapPick('pickup')}
            />
            <SectionHeader title="Nhập điểm đến" />
            <PlacePicker
              label="Điểm đến"
              icon="flag"
              value={dropoff}
              onChange={setDropoff}
              placeholder="VD: Cửa Lò, Yên Thành..."
              error={errors.dropoff}
              onPickOnMap={() => openMapPick('dropoff')}
            />
            <Card style={styles.estimateCard}>
              <Text style={styles.estimateTitle}>Khoảng cách & giá dự kiến</Text>
              {tripInfo ? (
                <>
                  <KeyValue label="Khoảng cách" value={formatKm(tripInfo.km)} icon="navigate-outline" />
                  <KeyValue label="Thời gian ước tính" value={formatDuration(tripInfo.durationMin)} icon="hourglass-outline" />
                  <KeyValue
                    label="Giá dự kiến"
                    value={
                      tripInfo.ready
                        ? `${formatVnd(tripInfo.price)} (chưa phải báo giá)`
                        : 'Chọn dịch vụ để xem giá'
                    }
                    icon="pricetag-outline"
                    emphasized
                  />
                </>
              ) : (
                <Text style={styles.estimateEmpty}>
                  Chưa tính được khoảng cách — hãy chọn địa điểm trong gợi ý để tự động tính khoảng cách.
                </Text>
              )}
            </Card>
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <SectionHeader title="Số lượng khách" />
            <Card>
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Số lượng khách</Text>
                <Stepper value={passengers} onChange={setPassengers} min={1} max={30} suffix="khách" />
              </View>
              {errors.passengers ? <Text style={styles.error}>{errors.passengers}</Text> : null}
            </Card>

            <View style={styles.block}>
              <Field
                label="Thông tin người đặt"
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Họ và tên"
                error={errors.name}
              />
              <Field
                label="Số điện thoại liên hệ"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="09xx xxx xxx"
                keyboardType="phone-pad"
                maxLength={11}
                error={errors.phone}
                hint="Số điện thoại chỉ dùng để liên hệ chuyến đi."
              />
            </View>

            <SectionHeader title="Ghi chú đặc biệt" />
            <View style={styles.grid}>
              {NOTE_SUGGESTIONS.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  active={notes.includes(suggestion)}
                  onPress={() =>
                    setNotes((prev) =>
                      prev.includes(suggestion)
                        ? prev.filter((s) => s !== suggestion)
                        : [...prev, suggestion],
                    )
                  }
                  style={styles.noteChip}
                />
              ))}
            </View>
            <Field
              label="Ghi chú thêm"
              value={noteText}
              onChangeText={setNoteText}
              placeholder="VD: Đón tại cổng phụ, có 2 vali..."
              multiline
            />
            <Text style={styles.noteHint}>Ghi chú được hiển thị rõ cho đại lý trước khi báo giá.</Text>
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            <SectionHeader title="Xác nhận thông tin" />
            <Card>
              <KeyValue label="Dịch vụ" value={service?.name ?? '—'} icon="grid-outline" emphasized />
              {serviceId === 'charter' && carClass ? (
                <KeyValue label="Loại xe" value={CAR_LABEL[carClass]} icon="car-outline" />
              ) : null}
              {serviceId !== 'delivery' ? (
                <KeyValue label="Hình thức" value={mode === 'shared' ? 'Đi ghép' : 'Đi riêng'} icon="people-outline" />
              ) : null}
              <KeyValue
                label="Điểm đón"
                value={`${pickup.label}${pickup.oldWard ? ` (${pickup.oldWard})` : ''}`}
                icon="location-outline"
              />
              <KeyValue
                label="Điểm đến"
                value={`${dropoff.label}${dropoff.oldWard ? ` (${dropoff.oldWard})` : ''}`}
                icon="flag-outline"
              />
              <KeyValue
                label="Ngày đi"
                value={formatDateShort(timeOption === 'window' ? date : toIsoDate(new Date()))}
                icon="calendar-outline"
              />
              <KeyValue label="Giờ đi" value={timeLabel()} icon="time-outline" />
              <KeyValue label="Số lượng khách" value={`${passengers} khách`} icon="people-outline" />
              <KeyValue label="Người đặt" value={customerName} icon="person-outline" />
              <KeyValue label="Liên hệ" value={customerPhone} icon="call-outline" />
              {tripInfo?.ready ? (
                <KeyValue label="Giá dự kiến" value={formatVnd(tripInfo.price)} icon="pricetag-outline" emphasized />
              ) : null}
              <KeyValue label="Ghi chú" value={noteSummary() || 'Không có'} icon="document-text-outline" />
            </Card>

            <View style={styles.block}>
              <InlineNotice
                tone="info"
                message="Sau khi xác nhận, yêu cầu được gửi tới đại lý và trạng thái chuyển thành “Đang tìm xe”."
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <AppButton
            title="Quay lại"
            variant="outline"
            full={false}
            style={styles.footerBack}
            onPress={() => setStep(step - 1)}
          />
        ) : null}
        <AppButton
          title={step === 3 ? 'Xác nhận yêu cầu' : 'Tiếp tục'}
          icon={step === 3 ? 'checkmark-circle' : 'arrow-forward'}
          onPress={goNext}
          style={styles.footerNext}
        />
      </View>
    </Screen>
  );
}

function PressableRow({
  active,
  icon,
  label,
  hint,
  onPress,
}: {
  active: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.timeRow, active && styles.timeRowActive]}
    >
      <View style={[styles.timeIcon, active && styles.timeIconActive]}>
        <Ionicons name={icon} size={18} color={active ? colors.white : colors.primary} />
      </View>
      <View style={styles.timeBody}>
        <Text style={[styles.timeLabel, active && styles.timeLabelActive]}>{label}</Text>
        <Text style={[styles.timeHint, active && styles.timeHintActive]}>{hint}</Text>
      </View>
      <Ionicons
        name={active ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={active ? colors.primary : colors.textFaint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    backgroundColor: colors.bg,
    gap: space(2),
  },
  progressItem: { flex: 1, alignItems: 'center', gap: 4 },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.greySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDone: { backgroundColor: colors.primarySoft },
  progressActive: { backgroundColor: colors.primary },
  progressDotText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textMuted },
  progressDotTextActive: { color: colors.white },
  progressLabel: { fontSize: 10, color: colors.textFaint, fontWeight: '600', maxWidth: '100%' },
  progressLabelActive: { color: colors.primary, fontWeight: '800' },

  content: { paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(8) },
  block: { marginTop: space(5) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  serviceChip: { minWidth: 110, justifyContent: 'center' },
  windowChip: { minWidth: 132, justifyContent: 'center' },
  noteChip: { maxWidth: '100%' },
  error: { color: colors.danger, fontSize: fontSize.xs, fontWeight: '700', marginTop: space(1) },
  serviceHint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: space(2), lineHeight: 19 },
  subLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: space(2), marginTop: space(1) },
  dateRow: { paddingRight: space(4), paddingBottom: space(1) },

  timeList: { gap: space(2) },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: space(3.5),
    marginBottom: space(2),
    gap: space(3),
  },
  timeRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  timeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeIconActive: { backgroundColor: colors.primary },
  timeBody: { flex: 1 },
  timeLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  timeLabelActive: { color: colors.primaryDark },
  timeHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  timeHintActive: { color: colors.primary },

  estimateCard: { marginTop: space(4), backgroundColor: colors.surfaceAlt },
  estimateTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: space(2) },
  estimateEmpty: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  noteHint: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: space(1) },

  footer: {
    flexDirection: 'row',
    gap: space(3),
    paddingHorizontal: space(4),
    paddingTop: space(3),
    paddingBottom: space(6),
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  footerBack: { paddingHorizontal: space(6) },
  footerNext: { flex: 1 },
});
