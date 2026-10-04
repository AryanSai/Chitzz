import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaymentStatusToggle } from '@/components/payment-status-toggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
    ChitRecord,
    closeChit,
    deleteChit,
    DrawRecord,
    generateWhatsAppReceiptMessage,
    generateWhatsAppReminderMessage,
    getChits,
    getDraws,
    getMembersByChit,
    getPaymentRows,
    MemberRecord,
    PaymentRecord,
    subscribeToDbChange,
    updatePaymentStatus,
} from '@/lib/db';

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
      const memberNames = new Set(getMembersByChit(found.name).map((member) => member.name));
      setPayments(allPayments.filter(
        (payment) => (payment.chit_name || '').toLowerCase() === found.name.toLowerCase() || memberNames.has(payment.member),
      ));
    }
  };

  const handleStatusToggle = (payment: PaymentRecord) => {
    updatePaymentStatus(
      payment.id || payment.member,
      payment.status === 'Paid' ? 'Pending' : 'Paid',
      payment.mode || 'Cash',
    );
  };

  const handleShareWhatsApp = async (member: MemberRecord, payment?: PaymentRecord, type: 'reminder' | 'receipt' = 'reminder') => {
    const dueStr = payment ? payment.due : `₹${chit?.before_pick.toLocaleString('en-IN') || 0}`;
    const modeStr = payment?.mode || 'Cash';
    const message =
      type === 'reminder'
        ? generateWhatsAppReminderMessage(member, dueStr, chit?.reminder_template, chit?.current_month, chit?.duration)
        : generateWhatsAppReceiptMessage(member, dueStr, modeStr, chit?.receipt_template, chit?.current_month, chit?.duration);

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

  const handleDeleteChit = () => {
    if (!chit) return;
    Alert.alert(
      t('deleteChitConfirmTitle'),
      t('deleteChitConfirmBody'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('deleteChit'),
          style: 'destructive',
          onPress: () => {
            deleteChit(chit.id);
            router.back();
          },
        },
      ],
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
            <ThemedText type="subtitle" style={{ flex: 1 }} numberOfLines={1}>
              {chit.name}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
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
            <Pressable
              onPress={handleDeleteChit}
              style={[styles.actionButton, { backgroundColor: '#b91c1c' }]}
              accessibilityRole="button">
              <ThemedText type="smallBold" style={styles.actionButtonText}>
                {t('deleteChit')}
              </ThemedText>
            </Pressable>
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
              members.map((member) => {
                const payment = payments.find((item) => item.member === member.name);
                const currentStatus = payment?.status || 'Pending';

                return (
                  <View key={member.id} style={styles.memberPaymentCard}>
                    <View style={styles.memberTopRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{member.name}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {member.phone} · {t('status')}: {member.status}
                        </ThemedText>
                      </View>
                      {payment && (
                        <Pressable
                          onPress={() => handleShareWhatsApp(member, payment, currentStatus === 'Paid' ? 'receipt' : 'reminder')}
                          style={styles.waBtn}>
                          <ThemedText type="small" style={{ fontSize: 11, color: '#16a34a', fontWeight: '600' }}>
                            {currentStatus === 'Paid' ? t('receipt') : t('remind')}
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                    {payment && (
                      <View style={styles.paymentControlsRow}>
                        <PaymentStatusToggle
                          isPaid={currentStatus === 'Paid'}
                          paidLabel={t('paidStatus')}
                          pendingLabel={currentStatus === 'Partially paid' ? t('partialStatus') : t('pendingStatus')}
                          onToggle={() => handleStatusToggle(payment)}
                        />
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
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
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
