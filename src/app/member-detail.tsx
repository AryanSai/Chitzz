import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
    generateWhatsAppReminderMessage,
    getChitByName,
    getMembers,
    getPaymentRows,
    MemberRecord,
    PaymentRecord,
    subscribeToDbChange,
} from '@/lib/db';

export default function MemberDetailScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [member, setMember] = useState<MemberRecord | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  const loadData = () => {
    const allMembers = getMembers();
    const found = allMembers.find((m) => String(m.id) === id) || allMembers[0];
    setMember(found || null);

    if (found) {
      const allPayments = getPaymentRows();
      const p = allPayments.find((row) => row.member === found.name);
      setPayment(p || null);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDbChange(loadData);
    return () => {
      unsubscribe();
    };
  }, [id]);

  if (!member) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Member not found.</ThemedText>
      </ThemedView>
    );
  }

  const handleWhatsAppReminder = async () => {
    const dueStr = payment ? payment.due : '₹3,000';
    const chit = getChitByName(member.chit_name);
    const message = generateWhatsAppReminderMessage(
      member,
      dueStr,
      undefined,
      chit?.current_month,
      chit?.duration,
    );
    const cleanPhone = member.phone.replace(/[^\d+]/g, '');
    const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Reminder Message', message);
      }
    } catch {
      Alert.alert('Reminder Message', message);
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
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ThemedText type="smallBold">← Back</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">Member Details</ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.profileCard}>
            <View style={styles.avatar}>
              <ThemedText type="subtitle" style={{ color: '#ffffff' }}>
                {member.name.charAt(0)}
              </ThemedText>
            </View>
            <ThemedText type="subtitle" style={{ marginTop: 8 }}>
              {member.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {member.phone}
            </ThemedText>

            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <ThemedText type="smallBold">{member.chit_name}</ThemedText>
              </View>
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor:
                      member.status === 'Picked'
                        ? '#dcfce7'
                        : member.status === 'Pending'
                          ? '#fef3c7'
                          : '#dbeafe',
                  },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{
                    color:
                      member.status === 'Picked'
                        ? '#15803d'
                        : member.status === 'Pending'
                          ? '#b45309'
                          : '#1d4ed8',
                  }}>
                  {member.status}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Monthly Payment Status</ThemedText>
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">
                Amount Due
              </ThemedText>
              <ThemedText type="smallBold">{payment?.due ?? '₹3,000'}</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary">
                Status
              </ThemedText>
              <ThemedText type="smallBold">{payment?.status ?? 'Pending'}</ThemedText>
            </View>

            <Pressable onPress={handleWhatsAppReminder} style={styles.whatsappButton}>
              <ThemedText type="smallBold" style={styles.whatsappButtonText}>
                Send WhatsApp Reminder
              </ThemedText>
            </Pressable>
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
  },
  backButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  profileCard: {
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  card: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  whatsappButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  whatsappButtonText: {
    color: '#ffffff',
  },
});
