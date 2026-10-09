import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

import { LanguageProvider } from '@/context/language-context';
import { databaseReady } from '@/lib/db';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [databaseReadyState, setDatabaseReadyState] = useState(false);
  const [databaseError, setDatabaseError] = useState('');

  useEffect(() => {
    let mounted = true;
    databaseReady.then(
      () => {
        if (mounted) setDatabaseReadyState(true);
      },
      (error: unknown) => {
        if (mounted) {
          setDatabaseError(
            error instanceof Error ? error.message : String(error),
          );
        }
      },
    ).finally(() => {
      void SplashScreen.hideAsync();
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (databaseError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Unable to open the local database. {databaseError}</Text>
      </View>
    );
  }
  if (!databaseReadyState) return null;

  return (
    <LanguageProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </LanguageProvider>
  );
}
