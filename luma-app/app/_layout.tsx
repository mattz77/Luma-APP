import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { HouseInitializer } from '@/components/HouseInitializer';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'landing',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // App uses lucide-react-native, not FontAwesome - no fonts needed
  // Using empty object to satisfy useFonts API
  const [loaded, error] = useFonts({});
  const [fontLoadTimeout, setFontLoadTimeout] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);

  // Debug logging
  useEffect(() => {
    console.log('[RootLayout] Font loading state:', { loaded, error: error?.message });
  }, [loaded, error]);

  // Timeout fallback: if fonts don't load in 3 seconds, proceed anyway
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!loaded) {
        console.warn('[RootLayout] Font loading timeout - proceeding without fonts');
        setFontLoadTimeout(true);
        SplashScreen.hideAsync();
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loaded]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.warn('[RootLayout] Font loading error (non-blocking):', {
        message: error.message,
        stack: error.stack,
      });
      // Don't throw - allow app to continue without fonts
      // Force hide splash after error
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 500);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('[RootLayout] Fonts loaded successfully');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    initializeAuth().catch((authError) => {
      console.error('[RootLayout] Falha ao inicializar autenticação:', authError);
    });
  }, [initializeAuth]);

  // Don't block app if fonts fail to load or timeout
  // Since we're not using any custom fonts, we can proceed immediately
  if (!loaded && !fontLoadTimeout && !error) {
    console.log('[RootLayout] Waiting for fonts to load...');
    return null;
  }

  console.log('[RootLayout] Rendering app navigation');
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider value={DefaultTheme}>
          <HouseInitializer />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="landing" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="(modals)"
              options={{
                presentation: 'modal',
              }}
            />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
