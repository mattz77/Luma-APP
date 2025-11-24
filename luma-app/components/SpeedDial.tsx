import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Pressable, Dimensions, Platform, Text } from 'react-native';
import { LucideIcon, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';

interface SpeedDialAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  backgroundColor?: string;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
  mainIcon?: LucideIcon;
  mainColor?: string;
  isOpen?: boolean;
  onClose?: () => void;
  buttonRef?: React.RefObject<View | null>;
  onCloseAnimationComplete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SpeedDialItem = ({
  action,
  index,
  progress,
  onPress
}: {
  action: SpeedDialAction;
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  onPress: () => void;
}) => {
  const actionStyle = useAnimatedStyle(() => {
    const currentProgress = progress.value;

    const translateY = interpolate(
      currentProgress,
      [0, 1],
      [0, -(index + 1) * 60],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      currentProgress,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      currentProgress,
      [0, 0.3, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale }
      ],
      opacity
    };
  });

  return (
    <Animated.View style={[styles.actionWrapper, actionStyle]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{action.label}</Text>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: action.backgroundColor }]}
        onPress={onPress}
      >
        <action.icon size={20} color="#FFF44F" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const SpeedDial = ({
  actions,
  mainIcon: MainIcon = Plus,
  mainColor = '#FFF44F',
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  buttonRef,
  onCloseAnimationComplete
}: SpeedDialProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Modal visibility state to keep it open during closing animation
  const [showModal, setShowModal] = useState(false);

  // Layout state
  const [buttonLayout, setButtonLayout] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  // Animation values
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      // Measure button position when opening - otimizado para iOS
      const measureButton = () => {
        buttonRef?.current?.measureInWindow((x, y, width, height) => {
          setButtonLayout({ x, y, width, height });
        });
      };
      
      // No iOS, usar requestAnimationFrame para melhor performance
      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          measureButton();
          // Iniciar animação imediatamente após medir (não esperar layout)
          progress.value = withSpring(1, { 
            damping: 10, // Reduzido ainda mais para resposta mais rápida
            stiffness: 250, // Aumentado para resposta instantânea
            mass: 0.7 // Reduzido para menos inércia
          });
        });
      } else {
        measureButton();
        progress.value = withSpring(1, { 
          damping: 12,
          stiffness: 200,
          mass: 0.8
        });
      }
    } else {
      // Close animation - mais rápida e não bloqueante
      progress.value = withSpring(0, { 
        damping: 10, // Mais rápido para fechar
        stiffness: 250,
        mass: 0.7
      }, (finished) => {
        if (finished) {
          runOnJS(setShowModal)(false);
          if (onCloseAnimationComplete) {
            runOnJS(onCloseAnimationComplete)();
          }
        }
      });
    }
  }, [isOpen, buttonRef, progress]);

  const handleClose = useCallback(() => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [externalOnClose]);

  // Backdrop animation - otimizado para iOS
  const backdropStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: progress.value,
    };
  }, []);

  // Main button rotation - otimizado para iOS
  const buttonRotationStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${progress.value * 45}deg` }]
    };
  }, []);

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      // No iOS, permitir interações durante animação
      presentationStyle="overFullScreen"
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <AnimatedPressable
          style={[StyleSheet.absoluteFill, backdropStyle]}
          onPress={handleClose}
          // Permitir interações durante animação no iOS
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
        </AnimatedPressable>

        {/* Actions */}
        {buttonLayout && (
          <View
            style={[
              styles.actionsContainer,
              {
                left: buttonLayout.x + (buttonLayout.width / 2),
                top: buttonLayout.y - 20
              }
            ]}
            pointerEvents="box-none"
          >
            {actions.map((action, index) => (
              <SpeedDialItem
                key={index}
                action={action}
                index={index}
                progress={progress}
                onPress={() => {
                  handleClose();
                  // Remover delay - executar imediatamente
                  action.onPress();
                }}
              />
            ))}
          </View>
        )}

        {/* Fake Button to maintain visual continuity */}
        {buttonLayout && (
          <View
            style={[
              styles.fakeButtonContainer,
              {
                left: buttonLayout.x,
                top: buttonLayout.y,
                width: buttonLayout.width,
                height: buttonLayout.height,
              }
            ]}
            pointerEvents="none"
          >
            <View style={styles.fakeButton}>
              <Animated.View style={buttonRotationStyle}>
                <MainIcon size={24} color={mainColor} />
              </Animated.View>
            </View>
          </View>
        )}

        {/* Invisible touch target for the button to close */}
        {buttonLayout && (
          <TouchableOpacity
            style={[
              styles.closeTouchTarget,
              {
                left: buttonLayout.x,
                top: buttonLayout.y,
                width: buttonLayout.width,
                height: buttonLayout.height,
              }
            ]}
            onPress={handleClose}
            activeOpacity={1}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 0,
    height: 0,
    overflow: 'visible',
  },
  actionWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    right: 6,
    width: 200,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.3)',
  },
  labelContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  label: {
    color: '#FFFBE6',
    fontSize: 14,
    fontWeight: '600',
  },
  fakeButtonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTouchTarget: {
    position: 'absolute',
  }
});
