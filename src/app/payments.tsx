import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getPaymentRows,
  updatePaymentStatus,
  generateWhatsAppReminderMessage,
  generateWhatsAppReceiptMessage,
  getMembers,
  PaymentRecord,
  PaymentMode,
  subscribeToDbChange,
} from '@/lib/db';

const paymentStatuses: ('Pending' | 'Partially paid' | 'Paid')[] = ['Pending', 'Partially paid', 'Paid'];
const paymentModes: PaymentMode[] = ['Cash', 'UPI'];

export default function PaymentsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [paymentRows, setPaymentRows] = useState<PaymentRecord[]>([]);

  const loadData = useCallback(() => {
    setPaymentRows(getPaymentRows());
  }, []);

  useFocusEffect(loadData);

  useEffect(() => {
    const unsubscribe = subscribeToDbChange(loadData);
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const handleStatusUpdate = (row: PaymentRecord, status: 'Pending' | 'Partially paid' | 'Paid', mode?: PaymentMode) => {
    const activeMode = mode || row.mode || 'Cash';
    updatePaymentStatus(row.id || row.member, status, activeMode);
  };

  const handleModeUpdate = (row: PaymentRecord, mode: PaymentMode) => {
    updatePaymentStatus(row.id || row.member, row.status === 'Pending' ? 'Paid' : row.status, mode);
  };

  const handleShareWhatsApp = async (row: PaymentRecord, type: 'reminder' | 'receipt') => {
    const members = getMembers();
    const memberObj = members.find((m) => m.name === row.member) || {
      name: row.member,
      phone: '',
      chit_name: row.chit_name || 'Chit',
    };

    const message =
      type === 'reminder'
        ? generateWhatsAppReminderMessage(memberObj, row.due)
        : generateWhatsAppReceiptMessage(memberObj, row.due, row.mode || 'Cash');

    const cleanPhone = memberObj.phone ? memberObj.phone.replace(/[^\d+]/g, '') : '';
    const targetPhone = cleanPhone ? cleanPhone.replace('+', '') : '';
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(type === 'reminder' ? 'Reminder' : 'Receipt', message);
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: safeAreaInsets.top + Spacing.three,
            paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.five,
          },
        ]}>
        <View style={styles.page}>
          <View style={styles.headerRow}>
            <ThemedText type="subtitle">Collections</ThemedText>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {paymentRows.filter((r) => r.status === 'Paid').length}/{paymentRows.length} Paid
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.listCard}>
            {paymentRows.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                No active collection records. Add members to track dues.
              </ThemedText>
            ) : (
              paymentRows.map((row) => (
                <View key={row.id || row.member} style={styles.row}>
                  <View style={styles.leftBlock}>
                    <ThemedText type="smallBold">{row.member}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {row.chit_name || 'Chit'} · {row.due}
                    </ThemedText>
                    {row.status !== 'Pending' && (
                      <View style={styles.modeRow}>
                        <ThemedText type="small" style={{ fontSize: 10, color: '#6b7280' }}>
                          Mode:
                        </ThemedText>
                        {paymentModes.map((m) => (
                          <Pressable
                            key={m}
                            onPress={() => handleModeUpdate(row, m)}
                            style={[
                              styles.modeChip,
                              (row.mode || 'Cash') === m && styles.modeChipActive,
                            ]}>
                            <ThemedText
                              type="small"
                              style={[
                                styles.modeChipText,
                                (row.mode || 'Cash') === m && styles.modeChipTextActive,
                              ]}>
                              {m === 'Cash' ? 'Cash' : 'UPI'}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.rightBlock}>
                    <View style={styles.statusChips}>
                      {paymentStatuses.map((st) => (
                        <Pressable
                          key={st}
                          onPress={() => handleStatusUpdate(row, st)}
                          style={[
                            styles.chip,
                            row.status === st && styles.chipActive,
                          ]}>
                          <ThemedText
                            type="small"
                            style={[
                              styles.chipText,
                              row.status === st && styles.chipTextActive,
                            ]}>
                            {st === 'Partially paid' ? 'Partial' : st}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => handleShareWhatsApp(row, row.status === 'Paid' ? 'receipt' : 'reminder')}
                      style={styles.waBtn}>
                      <ThemedText type="small" style={{ fontSize: 11, color: '#16a34a', fontWeight: '600' }}>
                        {row.status === 'Paid' ? 'Receipt' : 'Remind'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ThemedView>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.four, alignItems: 'center' },
  page: { width: '100%', maxWidth: MaxContentWidth, gap: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  listCard: { borderRadius: 14, padding: 14, gap: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  leftBlock: { gap: 4 },
  rightBlock: { alignItems: 'flex-end', gap: 6 },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  modeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modeChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  modeChipText: {
    fontSize: 9,
    color: '#374151',
  },
  modeChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  statusChips: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#111827',
  },
  chipText: {
    fontSize: 10,
    color: '#374151',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  waBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
