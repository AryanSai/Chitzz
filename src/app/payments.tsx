import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaymentStatusToggle } from '@/components/payment-status-toggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
    generateWhatsAppReceiptMessage,
    generateWhatsAppReminderMessage,
    getChitByName,
    getMembers,
    getPaymentRows,
    PaymentRecord,
    subscribeToDbChange,
    updatePaymentStatus,
} from '@/lib/db';

export default function PaymentsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();

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

  const handleStatusToggle = (row: PaymentRecord) => {
    updatePaymentStatus(
      row.id || row.member,
      row.status === 'Paid' ? 'Pending' : 'Paid',
      row.mode || 'Cash',
    );
  };

  const handleShareWhatsApp = async (row: PaymentRecord, type: 'reminder' | 'receipt') => {
    const members = getMembers();
    const memberObj = members.find((m) => m.name === row.member) || {
      name: row.member,
      phone: '',
      chit_name: row.chit_name || 'Chit',
    };
    const chit = row.chit_name ? getChitByName(row.chit_name) : undefined;

    const message =
      type === 'reminder'
        ? generateWhatsAppReminderMessage(memberObj, row.due, undefined, chit?.current_month, chit?.duration)
        : generateWhatsAppReceiptMessage(memberObj, row.due, row.mode || 'Cash', undefined, chit?.current_month, chit?.duration);

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
                  </View>

                  <View style={styles.rightBlock}>
                    <PaymentStatusToggle
                      isPaid={row.status === 'Paid'}
                      paidLabel={t('paidStatus')}
                      pendingLabel={row.status === 'Partially paid' ? t('partialStatus') : t('pendingStatus')}
                      onToggle={() => handleStatusToggle(row)}
                    />

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
  waBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
