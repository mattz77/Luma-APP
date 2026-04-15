import type { SharedValue } from 'react-native-reanimated';
import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

/**
 * Opacidade do backdrop (blur) ligada ao arraste do bottom sheet.
 * Enquanto `visible` só vira false no fim do spring no gesto, o blur acompanha o movimento.
 *
 * Importante: não zerar `translateY` no mesmo tick de `setVisible(false)` — isso faz o blur
 * voltar ao máximo por um frame (piscada). Resetar `translateY` no useEffect após fechar.
 */
export function useBottomSheetBackdropFadeStyle(
  translateY: SharedValue<number>,
  screenHeight: number
) {
  return useAnimatedStyle(() => {
    'worklet';
    const y = Math.max(0, translateY.value);
    const fadeEnd = screenHeight * 0.45;
    return {
      opacity: interpolate(
        y,
        [0, screenHeight * 0.1, fadeEnd, screenHeight],
        [1, 0.78, 0, 0],
        Extrapolation.CLAMP
      ),
    };
  }, [screenHeight]);
}
