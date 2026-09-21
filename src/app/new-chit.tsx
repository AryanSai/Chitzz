import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import { createChit, calculateChitPayout } from '@/lib/db';

export default function NewChitScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const todayStr = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [totalValue, setTotalValue] = useState('50000');
  const [currentMonth, setCurrentMonth] = useState('1');
  const [duration, setDuration] = useState('20');
  const [memberCount, setMemberCount] = useState('20');
  const [beforePick, setBeforePick] = useState('2500');
  const [afterPick, setAfterPick] = useState('3000');
  const [firstMonthPayout, setFirstMonthPayout] = useState('47500');
  const [payoutIncrement, setPayoutIncrement] = useState('500');
  const [startDate, setStartDate] = useState(todayStr);

  // Date Picker Modal state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDay, setPickerDay] = useState(String(new Date().getDate()));
  const [pickerMonth, setPickerMonth] = useState(String(new Date().getMonth() + 1));
  const [pickerYear, setPickerYear] = useState(String(new Date().getFullYear()));

  const curMonthNum = Math.max(1, Number(currentMonth) || 1);
  const fPayoutNum = Number(firstMonthPayout) || 0;
  const incNum = Number(payoutIncrement) || 0;
  const calculatedCurrentPayout = calculateChitPayout(fPayoutNum, incNum, curMonthNum);

  const handleApplyCustomDate = () => {
    const d = String(pickerDay).padStart(2, '0');
    const m = String(pickerMonth).padStart(2, '0');
    const y = String(pickerYear);
    if (!d || !m || !y || isNaN(Number(d)) || isNaN(Number(m)) || isNaN(Number(y))) {
      Alert.alert('Invalid Date', 'Enter valid numbers for day, month, and year.');
      return;
    }
    setStartDate(`${y}-${m}-${d}`);
    setShowDatePicker(false);
  };

  const setPresetDate = (preset: 'today' | 'firstThisMonth' | 'firstNextMonth') => {
    const now = new Date();
    if (preset === 'today') {
      setStartDate(now.toISOString().split('T')[0]);
    } else if (preset === 'firstThisMonth') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
    } else if (preset === 'firstNextMonth') {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const y = nextMonth.getFullYear();
      const m = String(nextMonth.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
    }
    setShowDatePicker(false);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Missing name', 'Choose a chit name before saving.');
      return;
    }

    createChit({
      name: trimmedName,
      total_value: Number(totalValue) || 0,
      current_month: curMonthNum,
      duration: Number(duration) || 1,
      member_count: Number(memberCount) || 1,
      before_pick: Number(beforePick) || 0,
      after_pick: Number(afterPick) || 0,
      first_month_payout: fPayoutNum,
      payout_increment: incNum,
      payout: `₹${calculatedCurrentPayout.toLocaleString('en-IN')}`,
      start_date: startDate.trim() || todayStr,
    });

    Alert.alert('Chit saved', `${trimmedName} starting ${startDate} has been added.`);
    router.back();
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
            <ThemedText type="subtitle">{t('createNewChitTitle')}</ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('groupName')}</ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Group A"
                style={styles.input}
              />
            </View>

            {/* Start Date Field with Date Picker Trigger */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('startDate')}</ThemedText>
              <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerTrigger}>
                <ThemedText type="smallBold">{startDate}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Select Date</ThemedText>
              </Pressable>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{t('totalChitValue')}</ThemedText>
                <TextInput
                  value={totalValue}
                  onChangeText={setTotalValue}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{t('currentMonth')}</ThemedText>
                <TextInput
                  value={currentMonth}
                  onChangeText={setCurrentMonth}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{t('durationMonths')}</ThemedText>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{t('numberOfMembers')}</ThemedText>
                <TextInput
                  value={memberCount}
                  onChangeText={setMemberCount}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{t('beforePickDue')}</ThemedText>
                <TextInput
                  value={beforePick}
                  onChangeText={setBeforePick}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{t('afterPickDue')}</ThemedText>
                <TextInput
                  value={afterPick}
                  onChangeText={setAfterPick}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Configurable Payout Formula Section */}
            <View style={styles.sectionDivider} />
            <ThemedText type="smallBold">Payout Calculation Rules</ThemedText>

            <View style={styles.twoColumn}>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{t('firstMonthPayout')}</ThemedText>
                <TextInput
                  value={firstMonthPayout}
                  onChangeText={setFirstMonthPayout}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">{t('monthlyIncrement')}</ThemedText>
                <TextInput
                  value={payoutIncrement}
                  onChangeText={setPayoutIncrement}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.payoutPreviewCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Calculated Payout ({t('currentMonthLabel')} {curMonthNum}):
              </ThemedText>
              <ThemedText type="subtitle" style={{ color: '#16a34a' }}>
                ₹{calculatedCurrentPayout.toLocaleString('en-IN')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                Formula: ₹{fPayoutNum.toLocaleString('en-IN')} + ({curMonthNum - 1} × ₹{incNum.toLocaleString('en-IN')})
              </ThemedText>
            </View>

            <Pressable onPress={handleSave} style={styles.primaryButton}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                {t('createGroupBtn')}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Select Start Date</ThemedText>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <ThemedText type="smallBold">Close</ThemedText>
              </Pressable>
            </View>

            <ThemedText type="smallBold">Quick Presets</ThemedText>
            <View style={styles.presetRow}>
              <Pressable onPress={() => setPresetDate('today')} style={styles.presetBtn}>
                <ThemedText type="small">Today</ThemedText>
              </Pressable>
              <Pressable onPress={() => setPresetDate('firstThisMonth')} style={styles.presetBtn}>
                <ThemedText type="small">1st This Month</ThemedText>
              </Pressable>
              <Pressable onPress={() => setPresetDate('firstNextMonth')} style={styles.presetBtn}>
                <ThemedText type="small">1st Next Month</ThemedText>
              </Pressable>
            </View>

            <ThemedText type="smallBold" style={{ marginTop: 8 }}>Custom Date (DD / MM / YYYY)</ThemedText>
            <View style={styles.threeColumn}>
              <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textSecondary">Day</ThemedText>
                <TextInput
                  value={pickerDay}
                  onChangeText={setPickerDay}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="01"
                />
              </View>
              <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textSecondary">Month</ThemedText>
                <TextInput
                  value={pickerMonth}
                  onChangeText={setPickerMonth}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="09"
                />
              </View>
              <View style={styles.fieldGroup}>
                <ThemedText type="small" themeColor="textSecondary">Year</ThemedText>
                <TextInput
                  value={pickerYear}
                  onChangeText={setPickerYear}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="2026"
                />
              </View>
            </View>

            <Pressable onPress={handleApplyCustomDate} style={styles.applyBtn}>
              <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Apply Date</ThemedText>
            </Pressable>
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
  fieldGroup: { flex: 1, gap: 8 },
  twoColumn: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  threeColumn: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  datePickerTrigger: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  payoutPreviewCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    gap: 2,
    alignItems: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  applyBtn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
});
