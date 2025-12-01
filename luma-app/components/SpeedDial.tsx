import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { LucideIcon, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing
} from 'react-native-reanimated';

// Gluestack UI v3 imports
import { Modal, ModalBackdrop } from '@/components/ui/modal';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';

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
  buttonRef?: React.RefObject<React.ComponentRef<typeof Box> | null>;
  onCloseAnimationComplete?: () => void;
}

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
    <Animated.View
      style={[
        {
          position: 'absolute',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          right: -22, // Compensar metade da largura do botão (44/2) para centralizar
          width: 200,
          transform: [{ translateY: -22 }] // Compensar metade da altura do botão (44/2) para centralizar verticalmente
        },
        actionStyle
      ]}
    >
      <Box className="px-3 py-1.5 bg-black/80 rounded-xl mr-3 border border-white/15">
        <Text className="text-[#FFFBE6] text-sm font-semibold">
          {action.label}
        </Text>
      </Box>
      <Pressable
        className="w-11 h-11 rounded-full items-center justify-center border border-[#FFF44F]/30"
        style={{
          backgroundColor: action.backgroundColor,
          shadowColor: "#000",
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
      // Measure button position when opening - suporte para web e native
      const measureButton = () => {
        if (!buttonRef?.current) return;

        if (Platform.OS === 'web') {
          // Web: usar getBoundingClientRect via ref
          try {
            // Para web, precisamos acessar o elemento DOM
            const element = buttonRef.current as any;
            const domNode = element?._nativeNode || element;
            
            if (domNode && typeof domNode.getBoundingClientRect === 'function') {
              const rect = domNode.getBoundingClientRect();
              const windowWidth = Dimensions.get('window').width;
              const windowHeight = Dimensions.get('window').height;
              
              setButtonLayout({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
              });
            } else {
              // Fallback: usar valores padrão se não conseguir medir
              setButtonLayout({
                x: Dimensions.get('window').width - 80,
                y: Dimensions.get('window').height - 100,
                width: 64,
                height: 64
              });
            }
          } catch (error) {
            console.warn('[SpeedDial] Erro ao medir botão na web:', error);
            // Fallback para valores padrão
            setButtonLayout({
              x: Dimensions.get('window').width - 80,
              y: Dimensions.get('window').height - 100,
              width: 64,
              height: 64
            });
          }
        } else {
          // Native: usar measureInWindow
          if (typeof buttonRef.current.measureInWindow === 'function') {
            buttonRef.current.measureInWindow((x, y, width, height) => {
              setButtonLayout({ x, y, width, height });
            });
          } else {
            // Fallback se measureInWindow não estiver disponível
            setButtonLayout({
              x: Dimensions.get('window').width - 80,
              y: Dimensions.get('window').height - 100,
              width: 64,
              height: 64
            });
          }
        }
      };
      
      // No iOS, usar requestAnimationFrame para melhor performance
      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          measureButton();
          // Iniciar animação suave (sem bounce)
          progress.value = withTiming(1, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
          });
        });
      } else {
        // Web e Android: medir imediatamente
        measureButton();
        progress.value = withTiming(1, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
      }
    } else {
      // Close animation - suave
      setShowModal(false);
      if (onCloseAnimationComplete) {
        onCloseAnimationComplete();
      }
      // Animar em background sem bloquear
      progress.value = withTiming(0, { 
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isOpen, buttonRef, progress, onCloseAnimationComplete]);

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
    <Modal isOpen={showModal} onClose={handleClose} size="full" closeOnOverlayClick={true}>
      {/* ModalBackdrop do gluestack-ui */}
      <ModalBackdrop onPress={handleClose} />
      
      {/* Blur effect customizado sobre o backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          backdropStyle
        ]}
        pointerEvents="none"
      >
        <BlurView 
          intensity={80} 
          tint="light" 
          style={StyleSheet.absoluteFill} 
        />
        {/* Overlay sutil para melhorar contraste */}
        <Box 
          className="absolute left-0 top-0 right-0 bottom-0 bg-black/10"
        />
      </Animated.View>

      {/* Container principal */}
      <Box className="absolute w-full h-full top-0 left-0" pointerEvents="box-none">
        {/* Actions */}
        {buttonLayout && (
          <Box
            className="absolute items-end justify-center overflow-visible"
            style={{
              left: buttonLayout.x + (buttonLayout.width / 2),
              top: buttonLayout.y + (buttonLayout.height / 2),
              width: 0,
              height: 0,
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
                  // Executar ação primeiro (sem delay)
                  action.onPress();
                  // Fechar imediatamente sem esperar animação
                  handleClose();
                }}
              />
            ))}
          </Box>
        )}

        {/* Fake Button to maintain visual continuity */}
        {buttonLayout && (
          <Box
            className="absolute items-center justify-center"
            style={{
              left: buttonLayout.x,
              top: buttonLayout.y,
              width: buttonLayout.width,
              height: buttonLayout.height,
            }}
            pointerEvents="none"
          >
            <Box className="w-full h-full items-center justify-center">
              <Animated.View style={buttonRotationStyle}>
                <MainIcon size={24} color={mainColor} />
              </Animated.View>
            </Box>
          </Box>
        )}

        {/* Invisible touch target for the button to close */}
        {buttonLayout && (
          <Pressable
            className="absolute"
            style={{
              left: buttonLayout.x,
              top: buttonLayout.y,
              width: buttonLayout.width,
              height: buttonLayout.height,
            }}
            onPress={handleClose}
          />
        )}
      </Box>
    </Modal>
  );
};

// Estilos removidos - usando className do gluestack-ui
