import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AppButton, AppHeader, Card, CountBadge, Screen } from '../../components/ui';
import { useRequests, type Role } from '../../store/RequestsContext';
import { colors, fontSize, radius, shadow, space } from '../../theme';
import { maskPhone } from '../../utils/format';

export default function AccountScreen() {
  const { role, setRole, myRequests, unread, resetDemo } = useRequests();

  const switchRole = (next: Role) => {
    setRole(next);
    if (next === 'agency') router.push('/agency');
  };

  const confirmReset = () =>
    Alert.alert('Đặt lại dữ liệu demo?', 'Toàn bộ yêu cầu và thông báo sẽ quay về dữ liệu mẫu.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đặt lại', style: 'destructive', onPress: () => resetDemo() },
    ]);

  return (
    <Screen>
      <AppHeader title="Tài khoản" subtitle="Thông tin & cài đặt" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={26} color={colors.primary} />
            </View>
            <View style={styles.profileBody}>
              <Text style={styles.profileName}>Khách hàng</Text>
              <Text style={styles.profilePhone}>{maskPhone('0912345678')}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{myRequests.length}</Text>
              <Text style={styles.statLabel}>yêu cầu</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Vai trò hiện tại</Text>
        <Card>
          <View style={styles.roleRow}>
            <RoleButton
              active={role === 'customer'}
              icon="person-outline"
              label="Khách hàng"
              onPress={() => switchRole('customer')}
            />
            <RoleButton
              active={role === 'agency'}
              icon="briefcase-outline"
              label="Đại lý"
              onPress={() => switchRole('agency')}
            />
          </View>
          <Text style={styles.roleHint}>
            Vai trò đại lý giúp bạn nhận yêu cầu mới, xem chi tiết nhu cầu và gửi báo giá cho khách.
          </Text>
        </Card>

        <Text style={styles.sectionLabel}>Tiện ích</Text>
        <Card padded={false}>
          <MenuRow icon="time-outline" label="Lịch sử yêu cầu" onPress={() => router.push('/history')} />
          <MenuRow
            icon="notifications-outline"
            label="Thông báo"
            badge={unread.customer + unread.agency}
            onPress={() => router.push('/notifications')}
          />
          <MenuRow icon="grid-outline" label="Tất cả dịch vụ" onPress={() => router.push('/discover')} />
          <MenuRow icon="briefcase-outline" label="Khu vực đại lý" onPress={() => router.push('/agency')} last />
        </Card>

        <Text style={styles.sectionLabel}>Bảo mật</Text>
        <Card>
          <View style={styles.securityRow}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
            <Text style={styles.securityText}>
              Số điện thoại và thông tin cá nhân được che bớt trong danh sách. Dữ liệu yêu cầu lưu trên thiết bị của
              bạn.
            </Text>
          </View>
        </Card>

        <AppButton title="Đặt lại dữ liệu demo" variant="ghost" icon="refresh-outline" onPress={confirmReset} />
        <Text style={styles.version}>Đi cùng bạn · phiên bản 1.0.0 (MVP)</Text>
      </ScrollView>
    </Screen>
  );
}

function RoleButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: 'person-outline' | 'briefcase-outline';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.roleButton, active && styles.roleButtonActive]}>
      <Ionicons name={icon} size={20} color={active ? colors.white : colors.primary} />
      <Text style={[styles.roleText, active && styles.roleTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  badge = 0,
  last = false,
}: {
  icon: 'time-outline' | 'notifications-outline' | 'grid-outline' | 'briefcase-outline';
  label: string;
  onPress: () => void;
  badge?: number;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.menuRow, last && styles.menuRowLast]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge > 0 ? <CountBadge count={badge} /> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), paddingBottom: space(10) },

  profile: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBody: { flex: 1 },
  profileName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  profilePhone: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  statBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: space(3), paddingVertical: space(2) },
  statValue: { fontSize: fontSize.lg, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: space(5),
    marginBottom: space(2),
    marginLeft: space(1),
  },

  roleRow: { flexDirection: 'row', gap: space(3) },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(2),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: space(3.5),
    backgroundColor: colors.surface,
  },
  roleButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadow.soft },
  roleText: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  roleTextActive: { color: colors.white },
  roleHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: space(3), lineHeight: 18 },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },

  securityRow: { flexDirection: 'row', gap: space(3), alignItems: 'flex-start' },
  securityText: { flex: 1, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },

  version: { textAlign: 'center', color: colors.textFaint, fontSize: fontSize.xs, marginTop: space(4) },
});
