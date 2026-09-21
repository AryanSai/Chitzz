import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
  getChits,
  getDashboardSummary,
  subscribeToDbChange,
  ChitRecord,
} from '@/lib/db';

export default function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [chits, setChits] = useState<ChitRecord[]>([]);
  const [summary, setSummary] = useState(getDashboardSummary());

  const refreshData = useCallback(() => {
    setChits(getChits());
    setSummary(getDashboardSummary());
  }, []);

  useFocusEffect(refreshData);

  useEffect(() => {
    const unsubscribe = subscribeToDbChange(refreshData);
    return () => {
      unsubscribe();
    };
  }, [refreshData]);

  const summaryCards = [
    { label: t('totalDue'), value: `₹${summary.dueThisMonth.toLocaleString('en-IN')}` },
    { label: t('collected'), value: `₹${summary.received.toLocaleString('en-IN')}` },
  ];

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
            <ThemedText type="subtitle">{t('appTitle')}</ThemedText>
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push('/new-chit')} style={styles.addButton}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>+ {t('new') || 'New'}</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <View key={card.label} style={styles.summaryCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  {card.label}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.summaryValue}>
                  {card.value}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('activeChits')} ({chits.length})</ThemedText>
          </View>

          {chits.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                {t('noChits')}
              </ThemedText>
            </ThemedView>
          ) : (
            chits.map((chit) => (
              <Pressable
                key={chit.id}
                onPress={() => router.push({ pathname: '/chit-detail' as any, params: { id: chit.id } })}
                style={styles.cardPressable}>
                <ThemedView type="backgroundElement" style={styles.chitCard}>
                  <View style={styles.chitTopRow}>
                    <ThemedText type="smallBold" style={{ fontSize: 16, flex: 1 }} numberOfLines={1}>
                      {chit.name}
                    </ThemedText>
                    <ThemedText type="smallBold">
                      ₹{chit.total_value.toLocaleString('en-IN')}
                    </ThemedText>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${chit.progress}%` }]} />
                  </View>

                  <View style={styles.chitMetaBlock}>
                    <View style={styles.chitBottomRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {t('currentMonthLabel')} {chit.current_month}/{chit.duration} · {chit.member_count} {t('membersCountLabel')}
                      </ThemedText>
                      <ThemedText type="smallBold" style={{ color: '#16a34a' }}>
                        Due: ₹{chit.before_pick.toLocaleString('en-IN')}
                      </ThemedText>
                    </View>
                    <View style={styles.chitBottomRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Start: {chit.start_date || t('na')}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Payout: {chit.payout}
                      </ThemedText>
                    </View>
                  </View>
                </ThemedView>
              </Pressable>
            ))
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: 4,
  },
  summaryValue: {
    fontSize: 18,
  },
  sectionHeader: {
    marginTop: 4,
  },
  emptyCard: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
  },
  cardPressable: {
    width: '100%',
  },
  chitCard: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: 8,
  },
  chitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 999,
  },
  chitMetaBlock: {
    gap: 2,
    marginTop: 2,
  },
  chitBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
