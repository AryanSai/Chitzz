import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';

export default function AppTabs() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 68 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarItemStyle: {
          borderRadius: 10,
          marginHorizontal: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, focused }) => {
          const iconName =
            route.name === 'index'
              ? 'home'
              : route.name === 'audit-log' || route.name === 'payments'
                ? 'document-text'
                : route.name === 'members'
                  ? 'people'
                  : 'settings';

          return (
            <Ionicons
              name={focused ? iconName : `${iconName}-outline`}
              size={20}
              color={color}
            />
          );
        },
      })}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
        }}
      />
      <Tabs.Screen
        name="audit-log"
        options={{
          title: t('logs'),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: t('members'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
        }}
      />

      {/* Hidden sub-screens (modal/detail flows) */}
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="ledger" options={{ href: null }} />
      <Tabs.Screen name="new-chit" options={{ href: null }} />
      <Tabs.Screen name="add-member" options={{ href: null }} />
      <Tabs.Screen name="record-draw" options={{ href: null }} />
      <Tabs.Screen name="chit-detail" options={{ href: null }} />
      <Tabs.Screen name="member-detail" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
