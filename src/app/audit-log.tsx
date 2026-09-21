import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import { getAuditEvents, AuditEventRecord, subscribeToDbChange } from '@/lib/db';

export default function AuditLogScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [events, setEvents] = useState<AuditEventRecord[]>([]);

  const loadData = () => {
    setEvents(getAuditEvents());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDbChange(loadData);
    return () => {
      unsubscribe();
    };
  }, []);

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
            <ThemedText type="subtitle">{t('auditActivityLog')}</ThemedText>
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            Traceable history of financial edits, draws, collections, and status changes.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            {events.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('noLogs')}
              </ThemedText>
            ) : (
              events.map((event) => (
                <View key={event.id} style={styles.eventRow}>
                  <View style={styles.eventHeader}>
                    <ThemedText type="smallBold" style={styles.actionTag}>
                      {event.action}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={styles.detailsText}>
                    {event.details}
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
  },
  backButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  card: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  eventRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTag: {
    color: '#1d4ed8',
    fontSize: 11,
  },
  detailsText: {
    color: '#374151',
  },
});
