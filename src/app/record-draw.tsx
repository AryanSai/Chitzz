import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
  getChits,
  getMembersByChit,
  recordDraw,
  calculateChitPayout,
  parseCurrency,
  ChitRecord,
  MemberRecord,
} from '@/lib/db';

export default function RecordDrawScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { chitId } = useLocalSearchParams<{ chitId?: string }>();
  const { t } = useTranslation();

  const [chits, setChits] = useState<ChitRecord[]>([]);
  const [selectedChit, setSelectedChit] = useState<ChitRecord | null>(null);
  const [eligibleMembers, setEligibleMembers] = useState<MemberRecord[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [cycleMonth, setCycleMonth] = useState<string>('1');
  const [payoutAmount, setPayoutAmount] = useState<string>('0');

  useEffect(() => {
    const list = getChits().filter((chit) => chit.status !== 'closed');
    setChits(list);
    const requestedChit = list.find((chit) => String(chit.id) === chitId);
    const initialChit = chitId ? requestedChit : list[0];
    if (initialChit) {
      setSelectedChit(initialChit);
      setCycleMonth(String(initialChit.current_month));
    }
  }, [chitId]);

  // Automatically compute payout whenever selected chit or cycle month changes
  useEffect(() => {
    if (selectedChit) {
      const monthNum = Number(cycleMonth) || selectedChit.current_month || 1;
      const basePayout = selectedChit.first_month_payout || parseCurrency(selectedChit.payout || '0');
      const increment = selectedChit.payout_increment || 0;
      const computedPayout = calculateChitPayout(basePayout, increment, monthNum);
      
      setPayoutAmount(String(computedPayout));

      const members = getMembersByChit(selectedChit.name);
      const eligible = members.filter((m) => m.status !== 'Picked');
      setEligibleMembers(eligible);
      if (eligible.length > 0) {
        setSelectedWinner(eligible[0].name);
      } else if (members.length > 0) {
        setSelectedWinner(members[0].name);
      } else {
        setSelectedWinner('');
      }
    }
  }, [selectedChit, cycleMonth]);

  const handleSaveDraw = () => {
    if (!selectedChit) {
      Alert.alert('Error', 'Please select an active chit.');
      return;
    }
    if (!selectedWinner) {
      Alert.alert('Error', 'Please select or enter the winner name.');
      return;
    }

    const monthNum = Number(cycleMonth) || selectedChit.current_month;
    const payoutNum = Number(payoutAmount) || 0;

    recordDraw({
      chit_name: selectedChit.name,
      winner_name: selectedWinner.trim(),
      cycle_month: monthNum,
      payout_amount: payoutNum,
      discount_amount: 0,
    });

    Alert.alert(
      'Draw Recorded',
      `Month ${monthNum} draw for ${selectedChit.name} recorded successfully. Winner: ${selectedWinner}. Payout: ₹${payoutNum.toLocaleString('en-IN')}.`
    );
    router.back();
  };

  const curMonthNum = Number(cycleMonth) || 1;
  const basePayout = selectedChit ? (selectedChit.first_month_payout || parseCurrency(selectedChit.payout || '0')) : 0;
  const increment = selectedChit ? (selectedChit.payout_increment || 0) : 0;

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
            <ThemedText type="subtitle">{t('recordDrawTitle')}</ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('selectChitGroup')}</ThemedText>
              <View style={styles.chipRow}>
                {chits.map((chit) => (
                  <Pressable
                    key={chit.id}
                    onPress={() => {
                      setSelectedChit(chit);
                      setCycleMonth(String(chit.current_month));
                    }}
                    style={[
                      styles.chip,
                      selectedChit?.id === chit.id && styles.chipSelected,
                    ]}>
                    <ThemedText
                      type="small"
                      style={[
                        styles.chipText,
                        selectedChit?.id === chit.id && styles.chipTextSelected,
                      ]}>
                      {chit.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('cycleMonth')}</ThemedText>
              <TextInput
                value={cycleMonth}
                onChangeText={setCycleMonth}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('selectWinner')}</ThemedText>
              {eligibleMembers.length > 0 ? (
                <View style={styles.chipRow}>
                  {eligibleMembers.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => setSelectedWinner(m.name)}
                      style={[
                        styles.chip,
                        selectedWinner === m.name && styles.chipSelected,
                      ]}>
                      <ThemedText
                        type="small"
                        style={[
                          styles.chipText,
                          selectedWinner === m.name && styles.chipTextSelected,
                        ]}>
                        {m.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <TextInput
                  value={selectedWinner}
                  onChangeText={setSelectedWinner}
                  placeholder="Enter winner name"
                  style={styles.input}
                />
              )}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <ThemedText type="smallBold">{t('payoutAmount')}</ThemedText>
                <ThemedText type="small" style={{ fontSize: 10, color: '#16a34a', fontWeight: '600' }}>
                  Auto Filled
                </ThemedText>
              </View>
              <TextInput
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                keyboardType="numeric"
                style={[styles.input, { fontWeight: '700', color: '#16a34a' }]}
              />
              {selectedChit && (
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                  Formula: ₹{basePayout.toLocaleString('en-IN')} + ({curMonthNum - 1} × ₹{increment.toLocaleString('en-IN')})
                </ThemedText>
              )}
            </View>

            <Pressable onPress={handleSaveDraw} style={styles.primaryButton}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                {t('recordDrawBtn')}
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
  fieldGroup: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  chipSelected: {
    backgroundColor: '#111827',
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
});
