import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AppHeader, EmptyState, Screen } from '../components/ui';
import { useRequests } from '../store/RequestsContext';
import { colors, fontSize, radius, shadow, space } from '../theme';
import { relativeTime } from '../utils/format';

export default function NotificationsScreen() {
  const { role, notificationsFor, markRead } = useRequests();
  const items = useMemo(() => notificationsFor(role), [notificationsFor, role]);

  useEffect(() => {
    markRead(role);
  }, [markRead, role]);

  const open = (requestId?: string) => {
    if (!requestId) return;
    router.push(role === 'agency' ? `/agency/${requestId}` : `/request/${requestId}`);
  };

  return (
    <Screen>
      <AppHeader
        title="Thông báo"
        subtitle={role === 'agency' ? 'Khu vực đại lý' : 'Tài khoản khách hàng'}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="Chưa có thông báo"
            subtitle="Thông báo về yêu cầu và báo giá sẽ hiển thị tại đây."
          />
        ) : (
          items.map((item) => (
            <Pressable key={item.id} style={styles.row} onPress={() => open(item.requestId)}>
              <View style={[styles.icon, !item.read && styles.iconUnread]}>
                <Ionicons
                  name={item.read ? 'notifications-outline' : 'notifications'}
                  size={18}
                  color={item.read ? colors.textFaint : colors.primary}
                />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.text}>{item.body}</Text>
                <Text style={styles.time}>{relativeTime(item.at)}</Text>
              </View>
              {!item.read ? <View style={styles.dot} /> : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), paddingBottom: space(10) },
  row: {
    flexDirection: 'row',
    gap: space(3),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    marginBottom: space(2),
    ...shadow.soft,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.greySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnread: { backgroundColor: colors.primarySoft },
  body: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  text: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2, lineHeight: 19 },
  time: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, marginTop: 4 },
});
