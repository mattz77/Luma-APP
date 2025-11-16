import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

const createShadow = (webShadow: string, native: Partial<ViewStyle>): ViewStyle =>
  Platform.select<ViewStyle>({
    web: {
      boxShadow: webShadow,
    },
    default: {
      shadowColor: '#000',
      ...native,
    },
  }) ?? {};

export const cardShadowStyle = createShadow('0 12px 24px rgba(15, 23, 42, 0.08)', {
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
});

export const bubbleShadowStyle = createShadow('0 6px 14px rgba(15, 23, 42, 0.1)', {
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 2,
});

