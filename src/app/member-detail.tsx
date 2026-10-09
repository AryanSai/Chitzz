import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
    deleteMember,
    generateWhatsAppReminderMessage,
    getChitByName,
    getMembers,
    getChits,
    getPaymentRows,
    ChitRecord,
    MemberRecord,
    PaymentRecord,
    parseCurrency,
    subscribeToDbChange,
    updateMember,
} from '@/lib/db';

export default function MemberDetailScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [member, setMember] = useState<MemberRecord | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [chits, setChits] = useState<ChitRecord[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editChit, setEditChit] = useState('Unassigned');
  const [editStatus, setEditStatus] = useState<MemberRecord['status']>('Active');

  const loadData = () => {
    const allMembers = getMembers();
    const found = id
      ? allMembers.find((m) => String(m.id) === id)
      : allMembers[0];
    setMember(found || null);

    if (found) {
      const allPayments = getPaymentRows();
      const p = allPayments.find((row) => row.member === found.name);
      setPayment(p || null);
    } else {
      setPayment(null);
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
        <ThemedText>{t('memberNotFound')}</ThemedText>
      </ThemedView>
    );
  }

  const handleDeleteMember = () => {
    Alert.alert(
      t('deleteMemberConfirmTitle'),
      t('deleteMemberConfirmMessage').replace('{name}', member.name),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('deleteMember'),
          style: 'destructive',
          onPress: () => {
            try {
              const deleted = deleteMember(member.id);
              if (!deleted) {
                Alert.alert(t('memberNotFound'));
                return;
              }
              router.back();
            } catch (error) {
              console.error('Unable to delete member.', error);
              Alert.alert(
                t('deleteMemberFailedTitle'),
                t('deleteMemberFailedMessage'),
              );
            }
          },
        },
      ],
    );
  };

  const openEditModal = () => {
    setEditName(member.name);
    setEditPhone(member.phone === 'N/A' ? '' : member.phone);
    setEditChit(member.chit_name);
    setEditStatus(member.status);
    setChits(getChits().filter(
      (chit) => chit.status !== 'closed' || chit.name === member.chit_name,
    ));
    setShowEditModal(true);
  };

  const handleSaveMember = () => {
    if (!editName.trim()) {
      Alert.alert(t('editMember'), t('memberNameRequired'));
      return;
    }
    try {
      if (!updateMember(member.id, {
        name: editName,
        phone: editPhone,
        chit_name: editChit,
        status: editStatus,
      })) {
        Alert.alert(t('editMember'), t('memberNameAlreadyExists'));
        return;
      }
      setShowEditModal(false);
    } catch (error) {
      console.error('Unable to update member details.', error);
      Alert.alert(t('editMember'), t('memberUpdateFailed'));
    }
  };

  const handleWhatsAppReminder = async () => {
    const dueStr = payment
      ? `₹${Math.max(0, parseCurrency(payment.due) - payment.paid_amount).toLocaleString('en-IN')}`
      : '₹3,000';
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

          <Pressable
            accessibilityRole="button"
            onPress={openEditModal}
            style={styles.editButton}>
            <ThemedText type="smallBold" style={styles.editButtonText}>
              {t('editMember')}
            </ThemedText>
          </Pressable>

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
              <ThemedText type="smallBold">
                {payment
                  ? `${t(payment.status === 'Paid' ? 'paidStatus' : payment.status === 'Partially paid' ? 'partialStatus' : 'pendingStatus')} · ${t('paidSoFar')}: ₹${payment.paid_amount.toLocaleString('en-IN')}`
                  : t('pendingStatus')}
              </ThemedText>
            </View>

            <Pressable onPress={handleWhatsAppReminder} style={styles.whatsappButton}>
              <ThemedText type="smallBold" style={styles.whatsappButtonText}>
                Send WhatsApp Reminder
              </ThemedText>
            </Pressable>
          </ThemedView>

          <Pressable
            accessibilityRole="button"
            onPress={handleDeleteMember}
            style={styles.deleteButton}>
            <ThemedText type="smallBold" style={styles.deleteButtonText}>
              {t('deleteMember')}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.editDialog, { backgroundColor: theme.background }]}>
            <ThemedText type="subtitle">{t('editMember')}</ThemedText>
            <ThemedText type="smallBold">{t('memberName')}</ThemedText>
            <TextInput value={editName} onChangeText={setEditName} style={styles.editInput} />
            <ThemedText type="smallBold">{t('phoneNumber')}</ThemedText>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              style={styles.editInput}
            />
            <ThemedText type="smallBold">{t('selectChitGroup')}</ThemedText>
            <View style={styles.editChipRow}>
              {['Unassigned', ...chits.map((chit) => chit.name)].map((chitName) => (
                <Pressable
                  key={chitName}
                  onPress={() => setEditChit(chitName)}
                  style={[styles.editChip, editChit === chitName && styles.editChipSelected]}>
                  <ThemedText
                    type="small"
                    style={{ color: editChit === chitName ? '#ffffff' : '#374151' }}>
                    {chitName === 'Unassigned' ? t('filterNoChit') : chitName}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText type="smallBold">{t('status')}</ThemedText>
            <View style={styles.editChipRow}>
              {(['Active', 'Pending', 'Picked'] as const).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setEditStatus(status)}
                  style={[styles.editChip, editStatus === status && styles.editChipSelected]}>
                  <ThemedText
                    type="small"
                    style={{ color: editStatus === status ? '#ffffff' : '#374151' }}>
                    {t(status.toLowerCase())}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowEditModal(false)} style={styles.modalAction}>
                <ThemedText type="smallBold">{t('cancel')}</ThemedText>
              </Pressable>
              <Pressable onPress={handleSaveMember} style={[styles.modalAction, styles.updateAction]}>
                <ThemedText type="smallBold" style={{ color: '#ffffff' }}>{t('updateMember')}</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  editButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  editButtonText: { color: '#ffffff' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editDialog: {
    gap: 12,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  editInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#111827',
  },
  editChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  editChipSelected: { backgroundColor: '#111827' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  modalAction: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  updateAction: { backgroundColor: '#111827' },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
});
