import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  Pressable as RNPressable,
} from 'react-native';
import { LucideIcon, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import {
  getModalOverlayBlurIntensity,
  getModalOverlayLayerStyle,
} from '@/lib/modalOverlayTokens';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

import { Modal } from '@/components/ui/modal';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';

interface SpeedDialAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  backgroundColor?: string;
  testID?: string;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
  mainIcon?: LucideIcon;
  mainColor?: string;
  isOpen?: boolean;
  onClose?: () => void;
  buttonRef?: React.RefObject<React.ComponentRef<typeof Box> | null>;
  onCloseAnimationComplete?: () => void;
}

const CLOSE_MS = 180;
const OPEN_MS = Platform.OS === 'ios' ? 240 : 200;

const SpeedDialItem = ({
  action,
  index,
  progress,
  onPress,
}: {
  action: SpeedDialAction;
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  onPress: () => void;
}) => {
  const actionStyle = useAnimatedStyle(() => {
    'worklet';
    const currentProgress = progress.value;

    const translateY = interpolate(
      currentProgress,
      [0, 1],
      [0, -(index + 1) * 70],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      currentProgress,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      currentProgress,
      [0, 0.3, 1],
      [0, 0, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          right: -22,
          width: 'auto',
          minWidth: 200,
          transform: [{ translateY: -22 }],
          zIndex: 1002,
          elevation: 1002,
        },
        actionStyle,
      ]}
      pointerEvents="auto"
    >
      <Box
        className="px-3 py-1.5 rounded-xl mr-3 border border-white/25"
        style={{
          backgroundColor: 'rgba(10,10,10,0.96)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.35,
          shadowRadius: 3,
          elevation: 4,
        }}
      >
        <Text className="text-white text-sm font-semibold">
          {action.label}
        </Text>
      </Box>
      <Pressable
        testID={action.testID}
        className="w-11 h-11 rounded-full items-center justify-center border border-[#FFF44F]/30"
        style={{
          backgroundColor: action.backgroundColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        onPress={onPress}
      >
        <action.icon size={20} color="#FFF44F" />
      </Pressable>
    </Animated.View>
  );
};

export const SpeedDial = ({
  actions,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  buttonRef,
  onCloseAnimationComplete,
}: SpeedDialProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const [showModal, setShowModal] = useState(false);

  const [buttonLayout, setButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const progress = useSharedValue(0);
  const blurIntensity = getModalOverlayBlurIntensity();
  const layerStyle = getModalOverlayLayerStyle();
  /** Evita rodar animação de fechamento na montagem quando `isOpen` já é false. */
  const hasBeenOpenedRef = useRef(false);

  const finishCloseAnimation = useCallback(() => {
    setShowModal(false);
    hasBeenOpenedRef.current = false;
    onCloseAnimationComplete?.();
  }, [onCloseAnimationComplete]);

  useEffect(() => {
    if (isOpen) {
      cancelAnimation(progress);
      hasBeenOpenedRef.current = true;
      setShowModal(true);

      const measureButton = () => {
        if (!buttonRef?.current) return;

        if (Platform.OS === 'web') {
          try {
            const element = buttonRef.current as unknown as {
              _nativeNode?: unknown;
              getBoundingClientRect?: () => DOMRect;
            };
            const domNode = (element as { _nativeNode?: unknown })._nativeNode ?? element;

            if (
              domNode &&
              typeof (domNode as { getBoundingClientRect?: () => DOMRect }).getBoundingClientRect ===
                'function'
            ) {
              const rect = (domNode as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect();
              setButtonLayout({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
              });
            } else {
              setButtonLayout({
                x: Dimensions.get('window').width - 80,
                y: Dimensions.get('window').height - 100,
                width: 64,
                height: 64,
              });
            }
          } catch (error) {
            console.warn('[SpeedDial] Erro ao medir botão na web:', error);
            setButtonLayout({
              x: Dimensions.get('window').width - 80,
              y: Dimensions.get('window').height - 100,
              width: 64,
              height: 64,
            });
          }
        } else {
          if (typeof buttonRef.current.measureInWindow === 'function') {
            buttonRef.current.measureInWindow((x, y, width, height) => {
              const windowWidth = Dimensions.get('window').width;
              const windowHeight = Dimensions.get('window').height;

              const expectedY = windowHeight - 120 + 30 + 32 - 22;
              const yDiff = Math.abs(y - expectedY);

              if (yDiff > 50) {
                const calculatedY = windowHeight - 120 + 30 + 32 - 22;
                setButtonLayout({
                  x: windowWidth / 2 - 22,
                  y: calculatedY,
                  width: 44,
                  height: 44,
                });
              } else {
                setButtonLayout({
                  x,
                  y,
                  width: width || 44,
                  height: height || 44,
                });
              }
            });
          } else if (Platform.OS === 'ios' && typeof buttonRef.current.measure === 'function') {
            const windowWidth = Dimensions.get('window').width;
            const windowHeight = Dimensions.get('window').height;
            setButtonLayout({
              x: windowWidth / 2 - 22,
              y: windowHeight - 120 + 30 + 32 - 22,
              width: 44,
              height: 44,
            });
          } else {
            const windowWidth = Dimensions.get('window').width;
            const windowHeight = Dimensions.get('window').height;
            setButtonLayout({
              x: windowWidth / 2 - 22,
              y: windowHeight - 120,
              width: 44,
              height: 44,
            });
          }
        }
      };

      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          measureButton();
          requestAnimationFrame(() => {
            setTimeout(() => {
              setButtonLayout((prev) => {
                if (!prev) {
                  const windowWidth = Dimensions.get('window').width;
                  const windowHeight = Dimensions.get('window').height;
                  return {
                    x: windowWidth / 2 - 22,
                    y: windowHeight - 120,
                    width: 44,
                    height: 44,
                  };
                }
                return prev;
              });
            }, 100);
            progress.value = withTiming(1, {
              duration: OPEN_MS,
              easing: Easing.out(Easing.exp),
            });
          });
        });
      } else {
        measureButton();
        progress.value = withTiming(1, {
          duration: OPEN_MS,
          easing: Easing.out(Easing.exp),
        });
      }
    } else {
      if (!hasBeenOpenedRef.current) {
        return;
      }
      cancelAnimation(progress);
      progress.value = withTiming(
        0,
        {
          duration: CLOSE_MS,
          easing: Easing.inOut(Easing.cubic),
        },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(finishCloseAnimation)();
          }
        },
      );
    }
  }, [isOpen, buttonRef, progress, finishCloseAnimation]);

  const handleClose = useCallback(() => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [externalOnClose]);

  const backdropStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: progress.value,
    };
  }, []);

  if (!showModal) return null;

  return (
    <Modal
      isOpen={showModal}
      onClose={handleClose}
      size="full"
      closeOnOverlayClick={false}
    >
      {/* Blur + scrim + toque fora — alinhado a LumaModalOverlay / modalOverlayTokens */}
      <Animated.View
        pointerEvents="box-none"
        style={[layerStyle, { zIndex: 0 }, backdropStyle]}
      >
        <BlurView
          intensity={blurIntensity}
          tint="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)' }]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0)']}
          locations={[0, 0.3, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%' }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.15)']}
          locations={[0, 0.7, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' }}
        />
        <RNPressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
        />
      </Animated.View>

      <Box
        className="absolute w-full h-full top-0 left-0"
        pointerEvents="box-none"
        style={{ zIndex: 1000 }}
      >
        {buttonLayout && (
          <Box
            className="absolute items-center justify-center overflow-visible"
            style={{
              left: buttonLayout.x + buttonLayout.width / 2,
              top: buttonLayout.y + buttonLayout.height / 2,
              width: 0,
              height: 0,
              zIndex: 1001,
              elevation: 1001,
            }}
            pointerEvents="box-none"
          >
            {actions.map((action, index) => (
              <SpeedDialItem
                key={index}
                action={action}
                index={index}
                progress={progress}
                onPress={() => {
                  action.onPress();
                  handleClose();
                }}
              />
            ))}
          </Box>
        )}

        {!buttonLayout && isOpen && (
          <Box
            className="absolute items-center justify-center overflow-visible"
            style={{
              left: Dimensions.get('window').width / 2,
              top: Dimensions.get('window').height - 120 - 22,
              width: 0,
              height: 0,
              zIndex: 1001,
              elevation: 1001,
            }}
            pointerEvents="box-none"
          >
            {actions.map((action, index) => (
              <SpeedDialItem
                key={index}
                action={action}
                index={index}
                progress={progress}
                onPress={() => {
                  action.onPress();
                  handleClose();
                }}
              />
            ))}
          </Box>
        )}

        {buttonLayout && (
          <Box
            className="absolute items-center justify-center"
            style={{
              left: buttonLayout.x,
              top: buttonLayout.y,
              width: buttonLayout.width,
              height: buttonLayout.height,
              zIndex: 1010,
              elevation: 1010,
            }}
            pointerEvents="auto"
          >
            <Pressable
              testID="fab-close"
              className="w-11 h-11 items-center justify-center rounded-full bg-white/95 border border-black/10"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.12,
                shadowRadius: 2,
                elevation: 3,
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
            >
              <X size={22} color={Colors.textSecondary} strokeWidth={2.25} />
            </Pressable>
          </Box>
        )}

        {!buttonLayout && isOpen && (
          <Box
            className="absolute items-center justify-center"
            style={{
              left: Dimensions.get('window').width / 2 - 22,
              top: Dimensions.get('window').height - 120 + 30 + 32 - 22,
              width: 44,
              height: 44,
              zIndex: 1010,
              elevation: 1010,
            }}
            pointerEvents="box-none"
          >
            <Pressable
              testID="fab-close"
              className="w-11 h-11 items-center justify-center rounded-full bg-white/95 border border-black/10"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.12,
                shadowRadius: 2,
                elevation: 3,
              }}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
            >
              <X size={22} color={Colors.textSecondary} strokeWidth={2.25} />
            </Pressable>
          </Box>
        )}
      </Box>
    </Modal>
  );
};
