import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function PaymentStatusToggle({
  isPaid,
  paidLabel,
  pendingLabel,
  onToggle,
}: {
  isPaid: boolean;
  paidLabel: string;
  pendingLabel: string;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isPaid }}
      accessibilityLabel={isPaid ? paidLabel : pendingLabel}
      onPress={onToggle}
      style={styles.control}>
      <Ionicons
        name={isPaid ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={isPaid ? '#15803d' : '#9ca3af'}
      />
      <ThemedText type="smallBold" style={{ color: isPaid ? '#15803d' : '#6b7280' }}>
        {isPaid ? paidLabel : pendingLabel}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
});
