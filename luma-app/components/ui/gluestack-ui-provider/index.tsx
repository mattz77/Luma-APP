import React, { useEffect } from 'react';
import { View, ViewProps, Platform } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { useColorScheme } from 'nativewind';

export type ModeType = 'light' | 'dark' | 'system';

export function GluestackUIProvider({
  mode = 'light',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // On web, config is handled by index.web.tsx via CSS variables
  // On native, we need to apply config as style using vars()
  const baseStyle: ViewProps['style'] = { flex: 1, height: '100%', width: '100%' };
  
  // Build style array - never include config on web
  const styleArray: ViewProps['style'][] = [baseStyle];
  
  if (Platform.OS !== 'web') {
    try {
      // Only load config on native platforms
      const { config } = require('./config');
      const themeConfig = config[colorScheme!] || config.light;
      if (themeConfig) {
        styleArray.unshift(themeConfig);
      }
    } catch (error) {
      // Silently fail if config can't be loaded
      console.warn('[GluestackUIProvider] Could not load theme config:', error);
    }
  }
  
  if (props.style) {
    styleArray.push(props.style);
  }
  
  return (
    <View style={styleArray.length === 1 ? styleArray[0] : styleArray}>
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
