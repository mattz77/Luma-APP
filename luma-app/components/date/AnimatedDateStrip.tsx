import { useEffect, useMemo } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { ScrollView } from '@/components/ui/scroll-view';
import { HStack } from '@/components/ui/hstack';

/** Alinhado ao fade do backdrop em `useBottomSheetBackdropFadeStyle`. */
const MODAL_DRAG_PROGRESS_RANGE = 0.45;

const WEEK_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const W = { compact: 48, expanded: 60 };
const H = { compact: 48, expanded: 85 };

export interface AnimatedDateStripProps {
  translateY: SharedValue<number>;
  screenHeight: number;
  /** Modal do bottom sheet aberto (círculos); fechado → pill expandido. */
  isModalOpen: boolean;
}

function DayPill({
  active,
  day,
  week,
  translateY,
  screenHeight,
  isModalOpenSV,
}: {
  active: boolean;
  day: number;
  week: string;
  translateY: SharedValue<number>;
  screenHeight: number;
  isModalOpenSV: SharedValue<number>;
}) {
  const layoutProgress = useDerivedValue(() => {
    'worklet';
    if (isModalOpenSV.value < 0.5) {
      return 1;
    }
    const dragEnd = screenHeight * MODAL_DRAG_PROGRESS_RANGE;
    return interpolate(
      Math.max(0, translateY.value),
      [0, dragEnd],
      [0, 1],
      Extrapolation.CLAMP
    );
  }, [screenHeight]);

  const animatedShell = useAnimatedStyle(() => {
    'worklet';
    const p = layoutProgress.value;
    const width = interpolate(p, [0, 1], [W.compact, W.expanded], Extrapolation.CLAMP);
    const height = interpolate(p, [0, 1], [H.compact, H.expanded], Extrapolation.CLAMP);
    const nudge = active ? 1.05 : 1;
    return {
      width,
      height,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ scale: nudge }],
    };
  }, [active]);

  const animatedWeek = useAnimatedStyle(() => {
    'worklet';
    const p = layoutProgress.value;
    return {
      opacity: interpolate(p, [0, 0.25, 1], [0, 0, 1], Extrapolation.CLAMP),
      height: interpolate(p, [0, 0.35, 1], [0, 0, 16], Extrapolation.CLAMP),
    };
  });

  const animatedDayFont = useAnimatedStyle(() => {
    'worklet';
    const p = layoutProgress.value;
    return {
      fontSize: interpolate(p, [0, 1], [18, 24], Extrapolation.CLAMP),
      fontWeight: '700' as const,
      color: '#0f172a',
      marginBottom: interpolate(p, [0, 0.35, 1], [0, 0, 4], Extrapolation.CLAMP),
    };
  });

  return (
    <Pressable onPress={() => Haptics.selectionAsync()} accessibilityRole="button">
      <Animated.View
        style={[
          animatedShell,
          active
            ? {
                backgroundColor: '#FDE047',
                borderWidth: 1,
                borderColor: '#FDE047',
                shadowColor: '#713f12',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 6,
              }
            : {
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: '#e2e8f0',
              },
        ]}
      >
        <Animated.Text style={animatedDayFont}>{day}</Animated.Text>
        <Animated.View style={[{ overflow: 'hidden', alignItems: 'center' }, animatedWeek]}>
          <RNText
            style={{
              fontSize: 10,
              fontWeight: '700',
              textTransform: 'uppercase',
              color: active ? '#0f172a' : '#94a3b8',
            }}
            numberOfLines={1}
          >
            {week}
          </RNText>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Faixa de dias (5 slots: ontem … +3): compacta em círculos com o modal aberto e
 * interpola para o “pill” conforme `translateY` do bottom sheet.
 */
export function AnimatedDateStrip({ translateY, screenHeight, isModalOpen }: AnimatedDateStripProps) {
  const isModalOpenSV = useSharedValue(isModalOpen ? 1 : 0);

  useEffect(() => {
    isModalOpenSV.value = isModalOpen ? 1 : 0;
  }, [isModalOpen, isModalOpenSV]);

  const dates = useMemo(() => {
    const arr: { day: number; week: string; active: boolean }[] = [];
    const today = new Date();
    for (let i = -1; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        day: d.getDate(),
        week: WEEK_SHORT[d.getDay()],
        active: i === 0,
      });
    }
    return arr;
  }, []);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 14,
          alignItems: 'center',
        }}
      >
        <HStack space="md" className="items-center">
          {dates.map((date, i) => (
            <DayPill
              key={i}
              active={date.active}
              day={date.day}
              week={date.week}
              translateY={translateY}
              screenHeight={screenHeight}
              isModalOpenSV={isModalOpenSV}
            />
          ))}
        </HStack>
      </ScrollView>
    </View>
  );
}
