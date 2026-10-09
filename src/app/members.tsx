import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import { getMembers, getChits, MemberRecord, ChitRecord, subscribeToDbChange } from '@/lib/db';

export default function MembersScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [chits, setChits] = useState<ChitRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChitFilter, setSelectedChitFilter] = useState('All');

  const loadData = useCallback(() => {
    setMembers(getMembers());
    setChits(getChits());
  }, []);

  useFocusEffect(loadData);

  useEffect(() => {
    const unsubscribe = subscribeToDbChange(loadData);
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const filteredMembers = members.filter((member) => {
    const matchesQuery =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChit =
      selectedChitFilter === 'All' ||
      (selectedChitFilter === 'InActiveChit'
        ? chits.some(
            (chit) =>
              chit.status !== 'closed' &&
              chit.name.toLowerCase() === member.chit_name.toLowerCase(),
          )
        : selectedChitFilter === 'Unassigned'
          ? member.chit_name.toLowerCase() === 'unassigned'
          : selectedChitFilter.startsWith('chit:')
            ? member.chit_name.toLowerCase() === selectedChitFilter.slice(5).toLowerCase()
            : false);

    return matchesQuery && matchesChit;
  });

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
            <ThemedText type="subtitle">{t('members')} ({filteredMembers.length})</ThemedText>
            <Pressable onPress={() => router.push('/add-member')} style={styles.addButton}>
              <ThemedText type="smallBold" style={{ color: '#fff' }}>+ Add</ThemedText>
            </Pressable>
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('searchPlaceholder')}
            style={styles.searchInput}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
              {(['All', 'InActiveChit', 'Unassigned'] as const).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setSelectedChitFilter(filter)}
                style={[
                  styles.filterChip,
                  selectedChitFilter === filter && styles.filterChipActive,
                ]}>
                <ThemedText
                  type="small"
                  style={[
                    styles.filterText,
                    selectedChitFilter === filter && styles.filterTextActive,
                  ]}>
                  {filter === 'All'
                    ? t('filterAll')
                    : filter === 'InActiveChit'
                      ? t('filterHasChit')
                      : t('filterNoChit')}
                </ThemedText>
              </Pressable>
              ))}
              {chits.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedChitFilter(`chit:${c.name}`)}
                  style={[
                    styles.filterChip,
                    selectedChitFilter === `chit:${c.name}` && styles.filterChipActive,
                  ]}>
                  <ThemedText
                    type="small"
                    style={[
                      styles.filterText,
                      selectedChitFilter === `chit:${c.name}` && styles.filterTextActive,
                    ]}>
                    {c.name}
                  </ThemedText>
                </Pressable>
              ))}
          </ScrollView>

          <ThemedView type="backgroundElement" style={styles.listCard}>
            {filteredMembers.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                {t('noMembersFound')}
              </ThemedText>
            ) : (
              filteredMembers.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() =>
                    router.push({ pathname: '/member-detail' as any, params: { id: member.id } })
                  }
                  style={styles.row}>
                  <View style={styles.leftBlock}>
                    <ThemedText type="smallBold">{member.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {member.phone}
                    </ThemedText>
                  </View>
                  <View style={styles.rightBlock}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {member.chit_name}
                    </ThemedText>
                    <ThemedText
                      type="smallBold"
                      style={{
                        fontSize: 11,
                        color:
                          member.status === 'Picked'
                            ? '#16a34a'
                            : member.status === 'Pending'
                              ? '#d97706'
                              : '#2563eb',
                      }}>
                      {member.status}
                    </ThemedText>
                  </View>
                </Pressable>
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
  page: { width: '100%', maxWidth: MaxContentWidth, gap: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#111827',
  },
  filterText: {
    fontSize: 11,
    color: '#374151',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listCard: {
    borderRadius: 18,
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  leftBlock: { gap: 2 },
  rightBlock: { alignItems: 'flex-end', gap: 2 },
});
