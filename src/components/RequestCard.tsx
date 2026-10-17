import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getService } from '../data/mock';
import type { BookingRequest } from '../types';
import { colors, fontSize, radius, shadow, space } from '../theme';
import { formatDateShort, formatVnd, relativeTime } from '../utils/format';
import { StatusBadge } from './ui';

const modeLabel = (r: BookingRequest): string | null => {
  if (!r.mode) return null;
  return r.mode === 'shared' ? 'Đi ghép' : 'Đi riêng';
};

export function RequestCard({
  request,
  onPress,
  showCustomer = false,
  fresh = false,
}: {
  request: BookingRequest;
  onPress: () => void;
  showCustomer?: boolean;
  fresh?: boolean;
}) {
  const service = getService(request.serviceId);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, fresh && styles.fresh, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={[styles.serviceIcon, { backgroundColor: service.soft }]}>
          <Ionicons name={service.icon} size={18} color={service.tint} />
        </View>
        <View style={styles.topBody}>
          <Text style={styles.code}>
            {request.code} · {service.name}
          </Text>
          <Text style={styles.time}>
            {relativeTime(request.updatedAt)}
            {showCustomer ? ` · ${request.customerName}` : ''}
          </Text>
        </View>
        <StatusBadge status={request.status} />
      </View>

      <View style={styles.route}>
        <View style={styles.routeLine}>
          <View style={styles.dot} />
          <Text style={styles.routeText} numberOfLines={1}>
            {request.pickup.label}
          </Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeLine}>
          <View style={[styles.dot, styles.dotEnd]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {request.dropoff.label}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.footerText}>
            {formatDateShort(request.date)} · {request.timeWindow ?? request.timeLabel}
          </Text>
        </View>
        <View style={styles.footerRight}>
          {modeLabel(request) ? <Text style={styles.tag}>{modeLabel(request)}</Text> : null}
          <Text style={styles.price}>
            {request.quote ? formatVnd(request.quote.price) : request.estimatedPrice ? `≈ ${formatVnd(request.estimatedPrice)}` : '—'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    marginBottom: space(3),
    ...shadow.soft,
  },
  fresh: { borderColor: colors.warning, borderWidth: 1.5 },
  pressed: { opacity: 0.9 },
  top: { flexDirection: 'row', alignItems: 'center' },
  serviceIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: space(3) },
  topBody: { flex: 1 },
  code: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  time: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  route: { marginTop: space(3), paddingLeft: space(1) },
  routeLine: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: space(2) },
  dotEnd: { backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.warning },
  routeText: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  routeDivider: { height: 10, width: 1, backgroundColor: colors.borderStrong, marginLeft: 3.5, marginVertical: 1 },
  footer: {
    marginTop: space(3),
    paddingTop: space(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), flex: 1 },
  footerText: { fontSize: fontSize.xs, color: colors.textMuted, flex: 1 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  tag: {
    fontSize: fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space(2),
    paddingVertical: 3,
    borderRadius: radius.pill,
    fontWeight: '700',
    overflow: 'hidden',
  },
  price: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primary },
});
