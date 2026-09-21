import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import { fetchDeviceContacts, DeviceContact } from '@/lib/contacts';
import { createMember, getChits, ChitRecord } from '@/lib/db';

const memberStatuses: ('Active' | 'Pending' | 'Picked')[] = ['Active', 'Pending', 'Picked'];

export default function AddMemberScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tickets, setTickets] = useState('1');
  const [chits, setChits] = useState<ChitRecord[]>([]);
  const [selectedChit, setSelectedChit] = useState<string>('Unassigned');
  const [status, setStatus] = useState<'Active' | 'Pending' | 'Picked'>('Active');

  // Contact Picker State
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    const list = getChits();
    setChits(list);
  }, []);

  const handleOpenContactPicker = async () => {
    setLoadingContacts(true);
    const contacts = await fetchDeviceContacts();
    setLoadingContacts(false);

    if (contacts === null) {
      Alert.alert(
        'Notice',
        'Device contact picker is available when running native dev builds with Expo Contacts. You can enter member details manually below.'
      );
      return;
    }

    if (contacts.length > 0) {
      setDeviceContacts(contacts.filter((c) => c.name));
      setShowContactPicker(true);
    } else {
      Alert.alert('No Contacts', 'No contacts found on device.');
    }
  };

  const handleSelectContact = (c: DeviceContact) => {
    setName(c.name || '');
    const phoneNum = c.phoneNumbers && c.phoneNumbers.length > 0 ? c.phoneNumbers[0].number : '';
    setPhone(phoneNum || '');
    setShowContactPicker(false);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim() || 'N/A';
    const ticketNum = Math.max(1, Number(tickets) || 1);

    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter member name.');
      return;
    }

    createMember({
      name: trimmedName,
      phone: trimmedPhone,
      chit_name: selectedChit,
      status,
      tickets: ticketNum,
    });

    const targetGroup = selectedChit === 'Unassigned' ? 'directory' : selectedChit;
    const msg = ticketNum > 1
      ? `${ticketNum} tickets for ${trimmedName} added to ${targetGroup}.`
      : `${trimmedName} added to ${targetGroup}.`;
    Alert.alert('Member Saved', msg);
    router.back();
  };

  const filteredContacts = deviceContacts.filter((c) =>
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase())
  );

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
            <ThemedText type="subtitle">{t('addNewMember')}</ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.formCard}>
            <Pressable onPress={handleOpenContactPicker} style={styles.syncButton}>
              <ThemedText type="smallBold" style={{ color: '#111827' }}>
                {loadingContacts ? 'Reading Contacts...' : 'Sync / Pick from Phone Contacts'}
              </ThemedText>
            </Pressable>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('memberName')} *</ThemedText>
              <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Anand Arvapelly" />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('phoneNumber')}</ThemedText>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                placeholder="Leave blank or enter number"
              />
            </View>

            <View style={styles.twoColumn}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <ThemedText type="smallBold">Ticket / Slot Count</ThemedText>
                <TextInput
                  value={tickets}
                  onChangeText={setTickets}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('selectChitGroup')}</ThemedText>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setSelectedChit('Unassigned')}
                  style={[
                    styles.chip,
                    selectedChit === 'Unassigned' && styles.chipActive,
                  ]}>
                  <ThemedText
                    type="small"
                    style={[
                      styles.chipText,
                      selectedChit === 'Unassigned' && styles.chipTextActive,
                    ]}>
                    None (Unassigned)
                  </ThemedText>
                </Pressable>

                {chits.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedChit(c.name)}
                    style={[
                      styles.chip,
                      selectedChit === c.name && styles.chipActive,
                    ]}>
                    <ThemedText
                      type="small"
                      style={[
                        styles.chipText,
                        selectedChit === c.name && styles.chipTextActive,
                      ]}>
                      {c.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('status')}</ThemedText>
              <View style={styles.chipRow}>
                {memberStatuses.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    onPress={() => setStatus(item)}
                    style={[styles.chip, item === status && styles.chipActive]}>
                    <ThemedText
                      type="small"
                      style={[styles.chipText, item === status && styles.chipTextActive]}>
                      {item}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable onPress={handleSave} style={styles.primaryButton}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                {t('saveMember')}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </ScrollView>

      {/* Phone Contact Selection Modal */}
      <Modal visible={showContactPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Select Phone Contact</ThemedText>
              <Pressable onPress={() => setShowContactPicker(false)}>
                <ThemedText type="smallBold">Close</ThemedText>
              </Pressable>
            </View>

            <TextInput
              value={contactSearch}
              onChangeText={setContactSearch}
              placeholder="Search contacts..."
              style={styles.searchInput}
            />

            <ScrollView style={{ maxHeight: 350 }}>
              {filteredContacts.slice(0, 50).map((c) => {
                const ph = c.phoneNumbers && c.phoneNumbers.length > 0 ? c.phoneNumbers[0].number : 'No number';
                return (
                  <Pressable
                    key={c.id || c.name}
                    onPress={() => handleSelectContact(c)}
                    style={styles.contactRow}>
                    <View>
                      <ThemedText type="smallBold">{c.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {ph}
                      </ThemedText>
                    </View>
                    <ThemedText type="linkPrimary">Select</ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
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
    gap: Spacing.two,
  },
  backButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  formCard: {
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  syncButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fieldGroup: { gap: 8 },
  twoColumn: { flexDirection: 'row', gap: Spacing.two },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#111827',
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchInput: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
});
