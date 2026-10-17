import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AppHeader, EmptyState, Screen, SectionHeader } from '../../components/ui';
import { CURRENT_LOCATION, PLACES, SERVICES } from '../../data/mock';
import { colors, fontSize, radius, shadow, space } from '../../theme';
import { formatKm, haversineKm } from '../../utils/geo';

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withDistance = PLACES.map((place) => ({
      ...place,
      km: Math.round(haversineKm(CURRENT_LOCATION, place) * 1.18 * 10) / 10,
    })).sort((a, b) => a.km - b.km);
    if (!q) return withDistance;
    return withDistance.filter((p) => `${p.name} ${p.address}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <Screen>
      <AppHeader title="Khám phá" subtitle="Dịch vụ & địa điểm lân cận" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm địa điểm, xã/phường..."
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.chipRow}>
          {['Vinh', 'Cửa Lò', 'Diễn Châu', 'Yên Thành'].map((label) => (
            <Pressable key={label} style={styles.quickChip} onPress={() => setQuery(label)}>
              <Text style={styles.quickChipText}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Dịch vụ của chúng tôi" />
        <View style={styles.services}>
          {SERVICES.map((service) => (
            <Pressable
              key={service.id}
              style={styles.serviceCard}
              onPress={() => router.push(`/booking?service=${service.id}`)}
            >
              <View style={[styles.serviceIcon, { backgroundColor: service.soft }]}>
                <Ionicons name={service.icon} size={24} color={service.tint} />
              </View>
              <View style={styles.serviceBody}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {service.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Địa điểm lân cận" />
        {results.length === 0 ? (
          <EmptyState
            icon="location-outline"
            title="Không tìm thấy địa điểm"
            subtitle="Thử từ khóa khác hoặc nhập tay trong form đặt xe."
          />
        ) : (
          results.map((place) => (
            <Pressable
              key={place.id}
              style={styles.placeRow}
              onPress={() => router.push('/booking?service=taxi')}
            >
              <View style={styles.placeIcon}>
                <Ionicons name="location" size={16} color={colors.primary} />
              </View>
              <View style={styles.placeBody}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddress} numberOfLines={1}>
                  {place.address}
                </Text>
                {place.oldName ? <Text style={styles.placeOld}>Tên cũ: {place.oldName}</Text> : null}
              </View>
              <Text style={styles.placeKm}>{formatKm(place.km)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), paddingBottom: space(10) },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: space(4),
    ...shadow.soft,
  },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: space(1) },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginTop: space(3) },
  quickChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: space(3.5),
    paddingVertical: space(2),
  },
  quickChipText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },

  services: { gap: space(2) },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(3.5),
    ...shadow.soft,
  },
  serviceIcon: { width: 46, height: 46, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  serviceBody: { flex: 1 },
  serviceName: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  serviceDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 17 },

  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(3.5),
    marginBottom: space(2),
  },
  placeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBody: { flex: 1 },
  placeName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  placeAddress: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  placeOld: { fontSize: fontSize.xs, color: colors.warning, marginTop: 2 },
  placeKm: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primary },
});
