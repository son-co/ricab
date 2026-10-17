import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STATUS_LABEL, STATUS_TONE } from '../data/mock';
import type { RequestStatus, StatusTone } from '../types';
import { colors, fontSize, radius, shadow, space } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/* ---------------------------------- Layout --------------------------------- */

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, onBack, right }: AppHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.headerSafe}>
      <View style={styles.headerRow}>
        <View style={styles.headerSide}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.iconButton} hitSlop={10} accessibilityLabel="Quay lại">
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.headerSide, styles.headerSideRight]}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* --------------------------------- Buttons --------------------------------- */

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  full = true,
}: AppButtonProps) {
  const palette = buttonPalette[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        full && styles.buttonFull,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={palette.text} style={styles.buttonIcon} /> : null}
          <Text style={[styles.buttonText, { color: palette.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonPalette: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: colors.primary, text: colors.white, border: colors.primary },
  accent: { bg: colors.accent, text: colors.accentInk, border: colors.accent },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', text: colors.textMuted, border: 'transparent' },
  danger: { bg: colors.dangerSoft, text: colors.danger, border: colors.dangerSoft },
};

/* --------------------------------- Badges ---------------------------------- */

const toneStyle: Record<StatusTone, { bg: string; text: string }> = {
  neutral: { bg: colors.greySoft, text: colors.textMuted },
  info: { bg: colors.infoSoft, text: colors.info },
  warning: { bg: colors.warningSoft, text: '#B4691F' },
  success: { bg: colors.successSoft, text: colors.success },
  danger: { bg: colors.dangerSoft, text: colors.danger },
};

export function StatusBadge({ status, style }: { status: RequestStatus; style?: StyleProp<ViewStyle> }) {
  const tone = toneStyle[STATUS_TONE[status]];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }, style]}>
      <Text style={[styles.badgeText, { color: tone.text }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.countBadge}>
      <Text style={styles.countBadgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: StatusTone;
}) {
  const palette = toneStyle[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

/* --------------------------------- Fields ---------------------------------- */

interface FieldProps extends Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'maxLength'> {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  editable?: boolean;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  multiline = false,
  editable = true,
  ...rest
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        editable={editable}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          !!error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
        {...rest}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
  icon,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={active ? colors.white : colors.text}
          style={styles.chipIcon}
        />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  suffix,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.stepperButton}
        hitSlop={8}
        accessibilityLabel="Giảm"
      >
        <Ionicons name="remove" size={20} color={colors.primary} />
      </Pressable>
      <Text style={styles.stepperValue}>
        {value}
        {suffix ? ` ${suffix}` : ''}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={styles.stepperButton}
        hitSlop={8}
        accessibilityLabel="Tăng"
      >
        <Ionicons name="add" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export function KeyValue({
  label,
  value,
  icon,
  emphasized = false,
}: {
  label: string;
  value: string;
  icon?: IconName;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.keyValue}>
      {icon ? <Ionicons name={icon} size={16} color={colors.textFaint} style={styles.keyValueIcon} /> : null}
      <Text style={styles.keyValueLabel}>{label}</Text>
      <Text style={[styles.keyValueValue, emphasized && styles.keyValueEmphasized]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

/* --------------------------------- States ---------------------------------- */

export function LoadingState({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.stateBox}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={28} color={colors.textFaint} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {subtitle ? <Text style={styles.stateText}>{subtitle}</Text> : null}
      {actionLabel ? (
        <AppButton title={actionLabel} onPress={onAction} variant="outline" full={false} style={styles.stateAction} />
      ) : null}
    </View>
  );
}

export function ErrorState({ message = 'Đã có lỗi xảy ra.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.stateBox}>
      <View style={[styles.stateIcon, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>Không tải được dữ liệu</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry ? (
        <AppButton title="Thử lại" onPress={onRetry} variant="outline" full={false} style={styles.stateAction} />
      ) : null}
    </View>
  );
}

export function InlineNotice({
  message,
  tone = 'info',
  icon,
}: {
  message: string;
  tone?: StatusTone;
  icon?: IconName;
}) {
  const palette = toneStyle[tone];
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg }]}>
      <Ionicons name={icon ?? 'information-circle-outline'} size={18} color={palette.text} />
      <Text style={[styles.noticeText, { color: palette.text }]}>{message}</Text>
    </View>
  );
}

/* --------------------------------- Styles ---------------------------------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerSafe: { backgroundColor: colors.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space(3), paddingVertical: space(3) },
  headerSide: { width: 76, justifyContent: 'center' },
  headerSideRight: { alignItems: 'flex-end' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  iconButton: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  cardPadded: { padding: space(4) },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space(3) },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },

  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(5),
  },
  buttonFull: { width: '100%' },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.45 },
  buttonIcon: { marginRight: space(2) },
  buttonText: { fontSize: fontSize.md, fontWeight: '700' },

  badge: { paddingHorizontal: space(3), paddingVertical: space(1.5), borderRadius: radius.pill },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },

  field: { marginBottom: space(4) },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: space(2) },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 52,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  inputDisabled: { backgroundColor: colors.greySoft, color: colors.textMuted },
  fieldError: { color: colors.danger, fontSize: fontSize.xs, marginTop: space(1.5), fontWeight: '600' },
  fieldHint: { color: colors.textFaint, fontSize: fontSize.xs, marginTop: space(1.5) },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space(3.5),
    paddingVertical: space(2.5),
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: space(2),
    marginBottom: space(2),
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { opacity: 0.8 },
  chipIcon: { marginRight: space(1.5) },
  chipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.white },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    padding: space(1),
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { minWidth: 72, textAlign: 'center', fontSize: fontSize.lg, fontWeight: '700', color: colors.text },

  keyValue: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: space(2) },
  keyValueIcon: { marginRight: space(2), marginTop: 2 },
  keyValueLabel: { width: 108, fontSize: fontSize.sm, color: colors.textMuted },
  keyValueValue: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  keyValueEmphasized: { fontSize: fontSize.md, color: colors.primary, fontWeight: '800' },

  stateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: space(10), paddingHorizontal: space(6) },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.greySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space(3),
  },
  stateTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: space(1), textAlign: 'center' },
  stateText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: space(2) },
  stateAction: { marginTop: space(4), minHeight: 44 },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    padding: space(3),
    marginBottom: space(4),
    gap: space(2),
  },
  noticeText: { flex: 1, fontSize: fontSize.sm, lineHeight: 19, fontWeight: '600' },
});
