import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { supportedLanguages } from '@/constants/translations';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
  clearAllData,
  getLedgerEntries,
  getGlobalTemplates,
  updateGlobalTemplates,
  LedgerEntry,
  subscribeToDbChange,
} from '@/lib/db';

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { language, setLanguage, t } = useTranslation();

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [reminderTemplate, setReminderTemplate] = useState('');
  const [receiptTemplate, setReceiptTemplate] = useState('');

  const loadData = useCallback(() => {
    setLedgerEntries(getLedgerEntries());
    const templates = getGlobalTemplates();
    setReminderTemplate(templates.reminder_template);
    setReceiptTemplate(templates.receipt_template);
  }, []);

  useFocusEffect(loadData);

  useEffect(() => {
    const unsubscribe = subscribeToDbChange(loadData);
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const handleSaveTemplates = () => {
    updateGlobalTemplates(reminderTemplate, receiptTemplate);
    Alert.alert(t('saveTemplates'), 'WhatsApp message templates updated successfully.');
  };

  const handleClearAll = () => {
    Alert.alert(
      'Confirm Reset',
      'Are you sure you want to clear all data? All chits, members, and transactions will be removed.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clearAllData'),
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Data Cleared', 'All app data has been reset to zero records.');
          },
        },
      ]
    );
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
            <ThemedText type="subtitle">{t('settingsTitle')}</ThemedText>
          </View>

          {/* App Language Selector Card */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('appLanguage')}</ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {supportedLanguages.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  style={[
                    styles.langChip,
                    language === lang.code && styles.langChipActive,
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={[
                      styles.langChipText,
                      language === lang.code && styles.langChipTextActive,
                    ]}>
                    {lang.nativeLabel} ({lang.label})
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ThemedView>

          {/* Chit Fund Summary */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('appConfig')}</ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.sysInfoRow}>
              <ThemedText type="small" themeColor="textSecondary">{t('currencyStandard')}</ThemedText>
              <ThemedText type="smallBold">Indian Rupee (₹)</ThemedText>
            </View>
            <View style={styles.sysInfoRow}>
              <ThemedText type="small" themeColor="textSecondary">{t('paymentMethods')}</ThemedText>
              <ThemedText type="smallBold">{t('cashMode')} · {t('upiMode')}</ThemedText>
            </View>
          </ThemedView>

          {/* WhatsApp Message Templates Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('whatsappTemplates')}</ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
              Available Variables: {'{name}'} = Member, {'{chit}'} = Group, {'{due}'} = Amount, {'{mode}'} = Cash/UPI
            </ThemedText>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('reminderTemplate')}</ThemedText>
              <TextInput
                value={reminderTemplate}
                onChangeText={setReminderTemplate}
                multiline
                numberOfLines={3}
                style={[styles.input, { minHeight: 64 }]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold">{t('receiptTemplate')}</ThemedText>
              <TextInput
                value={receiptTemplate}
                onChangeText={setReceiptTemplate}
                multiline
                numberOfLines={3}
                style={[styles.input, { minHeight: 64 }]}
              />
            </View>

            <Pressable onPress={handleSaveTemplates} style={styles.saveTemplateBtn}>
              <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                {t('saveTemplates')}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* Chit Inflow & Outflow Breakdown Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('chitsInflowOutflow')}</ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={styles.card}>
            {ledgerEntries.map((entry) => (
              <View key={entry.label} style={styles.row}>
                <ThemedText
                  type={entry.label === 'Net Balance' ? 'smallBold' : 'small'}
                  style={
                    entry.label === 'Net Balance'
                      ? { color: entry.amount.includes('-') ? '#dc2626' : '#16a34a' }
                      : undefined
                  }>
                  {entry.label}
                </ThemedText>
                <ThemedText type="smallBold">{entry.amount}</ThemedText>
              </View>
            ))}
          </ThemedView>

          {/* Data Management */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('dataManagement')}</ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={styles.card}>
            <Pressable onPress={handleClearAll} style={styles.clearDataBtn}>
              <ThemedText type="smallBold" style={{ color: '#dc2626' }}>
                {t('clearAllData')}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* System Info & Logs */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">{t('systemSecurity')}</ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={styles.card}>
            <Pressable onPress={() => router.push('/audit-log')} style={styles.auditLogBtn}>
              <ThemedText type="smallBold">{t('auditActivityLog')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">→</ThemedText>
            </Pressable>
            <View style={styles.sysInfoRow}>
              <ThemedText type="small" themeColor="textSecondary">Engine / Database</ThemedText>
              <ThemedText type="smallBold">Expo v57 · SQLite</ThemedText>
            </View>
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
  sectionHeader: { marginTop: 4 },
  card: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: 12,
  },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  langChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  langChipText: {
    fontSize: 12,
    color: '#374151',
  },
  langChipTextActive: {
    color: '#ffffff',
  },
  sysInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldGroup: { gap: 4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#111827',
  },
  saveTemplateBtn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  clearDataBtn: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  auditLogBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
