import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
  getChits,
  getMembersByChit,
  getDraws,
  getPaymentRows,
  updatePaymentStatus,
  generateWhatsAppReminderMessage,
  generateWhatsAppReceiptMessage,
  closeChit,
  ChitRecord,
  MemberRecord,
  DrawRecord,
  PaymentRecord,
  PaymentMode,
  subscribeToDbChange,
} from '@/lib/db';

const paymentStatuses: ('Pending' | 'Partially paid' | 'Paid')[] = ['Pending', 'Partially paid', 'Paid'];
const paymentModes: PaymentMode[] = ['Cash', 'UPI'];

export default function ChitDetailScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useTranslation();

  const [chit, setChit] = useState<ChitRecord | null>(null);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [draws, setDraws] = useState<DrawRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const loadData = () => {
    const allChits = getChits();
    const found = allChits.find((c) => String(c.id) === id) || allChits[0];
    setChit(found || null);

    if (found) {
      setMembers(getMembersByChit(found.name));
      setDraws(getDraws(found.name));
      const allPayments = getPaymentRows();
      setPayments(allPayments.filter((p) => (p.chit_name || '').toLowerCase() === found.name.toLowerCase() || p.member));
    }
  };

  const handleStatusUpdate = (payment: PaymentRecord, status: 'Pending' | 'Partially paid' | 'Paid', mode?: PaymentMode) => {
    const activeMode = mode || payment.mode || 'Cash';
    updatePaymentStatus(payment.id || payment.member, status, activeMode);
  };

  const handleModeUpdate = (payment: PaymentRecord, mode: PaymentMode) => {
    updatePaymentStatus(payment.id || payment.member, payment.status === 'Pending' ? 'Paid' : payment.status, mode);
  };

  const handleShareWhatsApp = async (member: MemberRecord, payment?: PaymentRecord, type: 'reminder' | 'receipt' = 'reminder') => {
    const dueStr = payment ? payment.due : `₹${chit?.before_pick.toLocaleString('en-IN') || 0}`;
    const modeStr = payment?.mode || 'Cash';
    const message =
      type === 'reminder'
        ? generateWhatsAppReminderMessage(member, dueStr, chit?.reminder_template)
        : generateWhatsAppReceiptMessage(member, dueStr, modeStr, chit?.receipt_template);

    const cleanPhone = member.phone ? member.phone.replace(/[^\d+]/g, '') : '';
    const targetPhone = cleanPhone ? cleanPhone.replace('+', '') : '';
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(type === 'reminder' ? t('remind') : t('receipt'), message);
    }
  };

  const handleCloseChit = () => {
    if (!chit) return;
    Alert.alert(
      t('closeConfirmTitle'),
      t('closeConfirmBody'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('closeGroup'),
          style: 'destructive',
          onPress: () => {
            closeChit(chit.id);
            Alert.alert(t('closed'), `Chit group "${chit.name}" closed.`);
            router.back();
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDbChange(loadData);
    return () => {
      unsubscribe();
    };
  }, [id]);

  if (!chit) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Chit not found.</ThemedText>
      </ThemedView>
    );
  }

  const getStatusLabel = (st: string) => {
    if (st === 'Pending') return t('pendingStatus');
    if (st === 'Partially paid') return t('partialStatus');
    if (st === 'Paid') return t('paidStatus');
    return st;
  };

  const getModeLabel = (mode: string) => {
    if (mode === 'Cash') return t('cashMode');
    if (mode === 'UPI') return t('upiMode');
    return mode;
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
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ThemedText type="smallBold">{t('back')}</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">{chit.name}</ThemedText>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={() => router.push('/record-draw' as any)}
                style={styles.actionButton}>
                <ThemedText type="smallBold" style={styles.actionButtonText}>
                  {t('draw')}
                </ThemedText>
              </Pressable>
              {chit.status !== 'closed' && (
                <Pressable
                  onPress={handleCloseChit}
                  style={[styles.actionButton, { backgroundColor: '#dc2626' }]}>
                  <ThemedText type="smallBold" style={styles.actionButtonText}>
                    {t('close')}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {/* Overview Card */}
          <ThemedView type="backgroundElement" style={styles.overviewCard}>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('totalValue')}
                </ThemedText>
                <ThemedText type="subtitle">
                  ₹{chit.total_value.toLocaleString('en-IN')}
                </ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('currentMonth')}
                </ThemedText>
                <ThemedText type="subtitle">
                  {chit.current_month} / {chit.duration}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('beforePickDue')}
                </ThemedText>
                <ThemedText type="smallBold">
                  ₹{chit.before_pick.toLocaleString('en-IN')}
                </ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('afterPickDue')}
                </ThemedText>
                <ThemedText type="smallBold">
                  ₹{chit.after_pick.toLocaleString('en-IN')}
                </ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('startDate')}
                </ThemedText>
                <ThemedText type="smallBold">
                  {chit.start_date || t('na')}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Members & Payment Status Assignment */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('membersAndDues')} ({members.length})</ThemedText>
            <Pressable onPress={() => router.push('/add-member')}>
              <ThemedText type="linkPrimary">{t('addMember')}</ThemedText>
            </Pressable>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            {members.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                {t('noMembers')}
              </ThemedText>
            ) : (
              members.map((m) => {
                const payment = payments.find((p) => p.member === m.name);
                const currentStatus = payment?.status || 'Pending';
                const currentMode = payment?.mode || 'Cash';

                return (
                  <View key={m.id} style={styles.memberPaymentCard}>
                    <View style={styles.memberTopRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{m.name}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {m.phone} · {t('status')}: {m.status}
                        </ThemedText>
                      </View>
                      {payment && (
                        <Pressable
                          onPress={() => handleShareWhatsApp(m, payment, currentStatus === 'Paid' ? 'receipt' : 'reminder')}
                          style={styles.waBtn}>
                          <ThemedText type="small" style={{ fontSize: 11, color: '#16a34a', fontWeight: '600' }}>
                            {currentStatus === 'Paid' ? t('receipt') : t('remind')}
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>

                    {/* Status & Payment Mode Assignment Row */}
                    {payment && (
                      <View style={styles.paymentControlsRow}>
                        <View style={styles.statusChips}>
                          {paymentStatuses.map((st) => (
                            <Pressable
                              key={st}
                              onPress={() => handleStatusUpdate(payment, st)}
                              style={[
                                styles.chip,
                                currentStatus === st && styles.chipActive,
                              ]}>
                              <ThemedText
                                type="small"
                                style={[
                                  styles.chipText,
                                  currentStatus === st && styles.chipTextActive,
                                ]}>
                                {getStatusLabel(st)}
                              </ThemedText>
                            </Pressable>
                          ))}
                        </View>

                        {currentStatus !== 'Pending' && (
                          <View style={styles.modeRow}>
                            <ThemedText type="small" style={{ fontSize: 10, color: '#6b7280' }}>
                              Mode:
                            </ThemedText>
                            {paymentModes.map((mode) => (
                              <Pressable
                                key={mode}
                                onPress={() => handleModeUpdate(payment, mode)}
                                style={[
                                  styles.modeChip,
                                  currentMode === mode && styles.modeChipActive,
                                ]}>
                                <ThemedText
                                  type="small"
                                  style={[
                                    styles.modeChipText,
                                    currentMode === mode && styles.modeChipTextActive,
                                  ]}>
                                  {getModeLabel(mode)}
                                </ThemedText>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ThemedView>

          {/* Draw History */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('drawHistory')} ({draws.length})</ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            {draws.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                {t('noDraws')}
              </ThemedText>
            ) : (
              draws.map((d) => (
                <View key={d.id} style={styles.row}>
                  <View>
                    <ThemedText type="smallBold">
                      {t('currentMonthLabel')} {d.cycle_month} - {d.winner_name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('date')}: {d.draw_date}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold">
                    ₹{d.payout_amount.toLocaleString('en-IN')}
                  </ThemedText>
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
  page: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  backButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  actionButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  overviewCard: {
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  card: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: 12,
  },
  memberPaymentCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  memberTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
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
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  waBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
});
