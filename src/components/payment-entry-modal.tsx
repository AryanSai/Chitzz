import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { PaymentMode } from '@/lib/db';

type PaymentEntryModalProps = {
  visible: boolean;
  memberName: string;
  due: string;
  paidAmount: number;
  mode: PaymentMode;
  title: string;
  paidSoFarLabel: string;
  paymentModeLabel: string;
  cashLabel: string;
  upiLabel: string;
  cancelLabel: string;
  saveLabel: string;
  amountError: (due: string) => string;
  onCancel: () => void;
  onSave: (paidAmount: number, mode: PaymentMode) => void;
};

export function PaymentEntryModal({
  visible,
  memberName,
  due,
  paidAmount,
  mode,
  title,
  paidSoFarLabel,
  paymentModeLabel,
  cashLabel,
  upiLabel,
  cancelLabel,
  saveLabel,
  amountError,
  onCancel,
  onSave,
}: PaymentEntryModalProps) {
  const theme = useTheme();
  const [amount, setAmount] = useState(String(paidAmount));
  const [selectedMode, setSelectedMode] = useState<PaymentMode>(mode);
  const numericAmount = Number(amount);

  const handleSave = () => {
    if (
      !amount.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount < 0 ||
      numericAmount > Number(due.replace(/[^\d.]/g, ''))
    ) {
      Alert.alert(title, amountError(due));
      return;
    }
    onSave(Math.round(numericAmount), selectedMode);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.background }]}>
          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText type="small">{memberName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {paidSoFarLabel} · {due}
          </ThemedText>
          <TextInput
            autoFocus
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.input}
            accessibilityLabel={paidSoFarLabel}
          />

          <ThemedText type="smallBold">{paymentModeLabel}</ThemedText>
          <View style={styles.modeRow}>
            {([
              ['Cash', cashLabel],
              ['UPI', upiLabel],
            ] as const).map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedMode === value }}
                onPress={() => setSelectedMode(value)}
                style={[styles.modeButton, selectedMode === value && styles.modeButtonSelected]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: selectedMode === value ? '#ffffff' : '#374151' }}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.actionButton}>
              <ThemedText type="smallBold">{cancelLabel}</ThemedText>
            </Pressable>
            <Pressable onPress={handleSave} style={[styles.actionButton, styles.saveButton]}>
              <ThemedText type="smallBold" style={styles.saveText}>{saveLabel}</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    gap: 12,
    borderRadius: 18,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#111827',
    fontSize: 18,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  modeButtonSelected: {
    backgroundColor: '#111827',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: '#111827',
  },
  saveText: {
    color: '#ffffff',
  },
});
