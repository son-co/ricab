import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CURRENT_LOCATION,
  SERVICES,
  WHY_US,
} from '../../data/mock';
import { RequestCard } from '../../components/RequestCard';
import {
  AppButton,
  Card,
  CountBadge,
  EmptyState,
  SectionHeader,
} from '../../components/ui';
import { useRequests } from '../../store/RequestsContext';
import { colors, fontSize, radius, shadow, space } from '../../theme';
import { formatDateLong } from '../../utils/format';

export default function HomeScreen() {
  const { myRequests, unread } = useRequests();
  const [menuOpen, setMenuOpen] = useState(false);

  const now = new Date();
  const recent = myRequests.slice(0, 3);
  const latest = myRequests[0];

  const goBooking = (service?: string) => {
    setMenuOpen(false);
    router.push(service ? `/booking?service=${service}` : '/booking');
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable style={styles.headerIcon} onPress={() => setMenuOpen(true)} hitSlop={8} accessibilityLabel="Menu">
          <Ionicons name="menu" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="car-sport" size={18} color={colors.white} />
          </View>
          <Text style={styles.brandText}>Đi cùng bạn</Text>
        </View>
        <Pressable
          style={styles.headerIcon}
          onPress={() => router.push('/notifications')}
          hitSlop={8}
          accessibilityLabel="Thông báo"
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <View style={styles.bellDot}>
            <CountBadge count={unread.customer} />
          </View>
        </Pressable>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.date}>{formatDateLong(now)}</Text>
        <Text style={styles.greeting}>
          Xin chào, <Text style={styles.greetingBold}>bạn!</Text>
        </Text>

        <Pressable style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={18} color={colors.primary} />
          </View>
          <View style={styles.locationBody}>
            <Text style={styles.locationLabel}>Vị trí hiện tại</Text>
            <Text style={styles.locationValue}>{CURRENT_LOCATION.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
        </Pressable>

        <View style={styles.banner}>
          <View style={styles.bannerBlob} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerEyebrow}>ĐẶT XE DỄ DÀNG</Text>
            <Text style={styles.bannerTitle}>
              Đi đâu cũng{'\n'}được,{'\n'}
              <Text style={styles.bannerTitleAccent}>đã có Đi cùng bạn.</Text>
            </Text>
            <Text style={styles.bannerSubtitle}>Gửi yêu cầu và nhận báo giá phù hợp từ đại lý</Text>
            <Pressable style={styles.bannerButton} onPress={() => goBooking()}>
              <Text style={styles.bannerButtonText}>Đặt xe ngay</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.accentInk} />
            </Pressable>
          </View>
          <View style={styles.bannerCar}>
            <Ionicons name="car-sport" size={54} color={colors.accent} />
          </View>
        </View>

        <SectionHeader
          title="Dịch vụ của chúng tôi"
          actionLabel="Xem tất cả"
          onAction={() => router.push('/discover')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.services}
        >
          {SERVICES.map((service) => (
            <Pressable
              key={service.id}
              style={styles.serviceCard}
              onPress={() => goBooking(service.id)}
            >
              <View style={[styles.serviceIcon, { backgroundColor: service.soft }]}>
                <Ionicons name={service.icon} size={26} color={service.tint} />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.blockLabel}>Yêu cầu gần đây</Text>
        {latest ? (
          recent.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onPress={() => router.push(`/request/${request.id}`)}
            />
          ))
        ) : (
          <Card>
            <EmptyState
              icon="car-outline"
              title="Chưa có chuyến đi nào"
              subtitle="Gửi yêu cầu đầu tiên để nhận báo giá từ đại lý."
              actionLabel="Đặt xe ngay"
              onAction={() => goBooking()}
            />
          </Card>
        )}
        {latest ? (
          <Pressable style={styles.linkRow} onPress={() => router.push('/history')}>
            <Text style={styles.linkText}>Xem tất cả yêu cầu</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        ) : null}

        <Text style={styles.blockLabel}>Vì sao chọn chúng tôi?</Text>
        <View style={styles.whyRow}>
          {WHY_US.map((item) => (
            <View key={item.index} style={styles.whyItem}>
              <Text style={styles.whyIndex}>{item.index}</Text>
              <Text style={styles.whyTitle}>{item.title}</Text>
              <Text style={styles.whySubtitle}>{item.subtitle}</Text>
            </View>
          ))}
        </View>

        <Card style={styles.agencyCard}>
          <View style={styles.agencyRow}>
            <View style={styles.agencyIcon}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.agencyBody}>
              <Text style={styles.agencyTitle}>Bạn là đại lý?</Text>
              <Text style={styles.agencySubtitle}>Nhận yêu cầu, tìm xe và gửi báo giá</Text>
            </View>
          </View>
          <AppButton
            title="Vào khu vực đại lý"
            icon="arrow-forward"
            variant="accent"
            onPress={() => {
              router.push('/agency');
            }}
          />
        </Card>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>Đi cùng bạn</Text>
            {[
              { icon: 'time-outline' as const, label: 'Lịch sử yêu cầu', onPress: () => { setMenuOpen(false); router.push('/history'); } },
              { icon: 'notifications-outline' as const, label: 'Thông báo', onPress: () => { setMenuOpen(false); router.push('/notifications'); } },
              { icon: 'grid-outline' as const, label: 'Tất cả dịch vụ', onPress: () => { setMenuOpen(false); router.push('/discover'); } },
              { icon: 'briefcase-outline' as const, label: 'Khu vực đại lý', onPress: () => { setMenuOpen(false); router.push('/agency'); } },
              { icon: 'person-outline' as const, label: 'Tài khoản', onPress: () => { setMenuOpen(false); router.push('/account'); } },
            ].map((item) => (
              <Pressable key={item.label} style={styles.menuItem} onPress={item.onPress}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <Text style={styles.menuItemText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
              </Pressable>
            ))}
            <AppButton title="Đóng" variant="ghost" onPress={() => setMenuOpen(false)} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(4),
    paddingVertical: space(2),
    backgroundColor: colors.bg,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellDot: { position: 'absolute', top: 6, right: 6 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },

  content: { paddingHorizontal: space(4), paddingBottom: space(10) },
  date: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space(4) },
  greeting: { fontSize: fontSize.xxl, fontWeight: '400', color: colors.text, marginTop: space(1) },
  greetingBold: { fontWeight: '800' },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    marginTop: space(4),
    ...shadow.soft,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space(3),
  },
  locationBody: { flex: 1 },
  locationLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  locationValue: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginTop: 2 },

  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    marginTop: space(5),
    padding: space(5),
    overflow: 'hidden',
    minHeight: 230,
    ...shadow.card,
  },
  bannerBlob: {
    position: 'absolute',
    right: -50,
    top: -30,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(242, 212, 121, 0.25)',
  },
  bannerContent: { flex: 1, zIndex: 2 },
  bannerEyebrow: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1.2 },
  bannerTitle: { color: colors.white, fontSize: fontSize.xxl, fontWeight: '800', marginTop: space(3), lineHeight: 34 },
  bannerTitleAccent: { color: colors.accent },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.sm, marginTop: space(3), maxWidth: '85%' },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space(2),
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: space(5),
    paddingVertical: space(3),
    marginTop: space(4),
  },
  bannerButtonText: { color: colors.accentInk, fontWeight: '800', fontSize: fontSize.md },
  bannerCar: { position: 'absolute', right: 16, bottom: 26, opacity: 0.9 },

  services: { paddingRight: space(4), paddingBottom: space(2) },
  serviceCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    marginRight: space(3),
    ...shadow.soft,
  },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space(3),
  },
  serviceName: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text, textAlign: 'center' },
  serviceSubtitle: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: 2 },

  blockLabel: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: space(6), marginBottom: space(3) },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', paddingVertical: space(2) },
  linkText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },

  whyRow: { flexDirection: 'row', gap: space(4) },
  whyItem: { flex: 1, borderTopWidth: 1.5, borderTopColor: colors.borderStrong, paddingTop: space(3) },
  whyIndex: { color: colors.warning, fontWeight: '800', fontSize: fontSize.sm },
  whyTitle: { color: colors.text, fontWeight: '800', fontSize: fontSize.md, marginTop: space(1.5) },
  whySubtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: space(1) },

  agencyCard: { marginTop: space(6), gap: space(4) },
  agencyRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  agencyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agencyBody: { flex: 1 },
  agencyTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  agencySubtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(10, 25, 18, 0.45)', justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space(5),
    paddingBottom: space(8),
  },
  menuTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: space(3) },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    marginBottom: space(2),
  },
  menuItemText: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
});
