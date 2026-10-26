import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PLACES } from '../data/mock';
import type { TripPoint } from '../types';
import { colors, fontSize, radius, shadow, space } from '../theme';

interface PlacePickerProps {
  label: string;
  icon: 'location' | 'flag';
  value: TripPoint;
  onChange: (point: TripPoint) => void;
  placeholder?: string;
  error?: string;
  /** Mở màn chọn điểm trên bản đồ (map-pick). */
  onPickOnMap?: () => void;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export function PlacePicker({
  label,
  icon,
  value,
  onChange,
  placeholder,
  error,
  onPickOnMap,
}: PlacePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return PLACES;
    return PLACES.filter((p) => normalize(`${p.name} ${p.address}`).includes(q));
  }, [query]);

  const openPicker = () => {
    setQuery('');
    setOpen(true);
  };

  const pick = (point: TripPoint) => {
    onChange(point);
    setOpen(false);
  };

  const hasValue = value.label.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={openPicker} style={[styles.field, !!error && styles.fieldError]}>
        <View style={styles.fieldIcon}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.fieldBody}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {hasValue ? (
            <Text style={styles.fieldValue} numberOfLines={1}>
              {value.label}
            </Text>
          ) : (
            <Text style={styles.fieldPlaceholder}>{placeholder ?? 'Nhập hoặc chọn địa điểm'}</Text>
          )}
        </View>
        <Ionicons name="search" size={18} color={colors.textFaint} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hasValue && value.address ? (
        <Text style={styles.address} numberOfLines={2}>
          {value.address}
        </Text>
      ) : null}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm địa điểm, xã/phường..."
              placeholderTextColor={colors.textFaint}
              style={styles.searchInput}
              autoFocus
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>Không tìm thấy địa điểm phù hợp. Bạn có thể nhập tay bên dưới.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={() =>
                  pick({
                    label: item.name,
                    address: item.address,
                    lat: item.lat,
                    lng: item.lng,
                    oldWard: item.oldName,
                  })
                }
              >
                <View style={styles.itemIcon}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                  {item.oldName ? <Text style={styles.itemOld}>Tên cũ: {item.oldName}</Text> : null}
                </View>
              </Pressable>
            )}
            ListFooterComponent={
              query.trim().length > 0 ? (
                <Pressable
                  style={[styles.item, styles.manualItem]}
                  onPress={() => pick({ label: query.trim() })}
                >
                  <View style={[styles.itemIcon, { backgroundColor: colors.greySoft }]}>
                    <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName}>Nhập tay: “{query.trim()}”</Text>
                    <Text style={styles.itemAddress}>Dùng địa chỉ tự nhập, chưa tính khoảng cách tự động</Text>
                  </View>
                </Pressable>
              ) : undefined
            }
          />

          {onPickOnMap ? (
            <Pressable
              style={({ pressed }) => [styles.mapRow, pressed && styles.mapRowPressed]}
              onPress={() => {
                setOpen(false);
                onPickOnMap();
              }}
            >
              <View style={styles.mapRowIcon}>
                <Ionicons name="map" size={20} color={colors.primary} />
              </View>
              <View style={styles.mapRowBody}>
                <Text style={styles.mapRowTitle}>Chọn vị trí trên bản đồ</Text>
                <Text style={styles.mapRowHint}>
                  Di chuyển bản đồ để ghim chính xác {icon === 'location' ? 'điểm đón' : 'điểm đến'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: space(3) },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: space(3.5),
  },
  fieldError: { borderColor: colors.danger },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space(3),
  },
  fieldBody: { flex: 1 },
  fieldLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  fieldValue: { fontSize: fontSize.md, color: colors.text, fontWeight: '700', marginTop: 2 },
  fieldPlaceholder: { fontSize: fontSize.md, color: colors.textFaint, marginTop: 2 },
  error: { color: colors.danger, fontSize: fontSize.xs, marginTop: space(1.5), fontWeight: '600' },
  address: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: space(1.5), marginLeft: space(1) },

  modal: { flex: 1, backgroundColor: colors.bg, padding: space(4) },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space(4) },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: space(3.5),
    marginBottom: space(3),
  },
  searchInput: { flex: 1, paddingVertical: space(3.5), marginLeft: space(2), fontSize: fontSize.md, color: colors.text },
  list: { paddingBottom: space(6) },
  empty: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: space(8) },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(3),
    marginBottom: space(2),
    ...shadow.soft,
  },
  itemPressed: { opacity: 0.8 },
  manualItem: { borderStyle: 'dashed' },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space(3),
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  itemAddress: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  itemOld: { fontSize: fontSize.xs, color: colors.warning, marginTop: 2, fontWeight: '600' },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: space(3),
    marginTop: space(2),
  },
  mapRowPressed: { opacity: 0.8 },
  mapRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space(3),
  },
  mapRowBody: { flex: 1 },
  mapRowTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.primaryDark },
  mapRowHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
