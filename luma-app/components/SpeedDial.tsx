import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { LucideIcon, Plus, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';
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

    // Animação para aparecer acima do botão (valores negativos = para cima)
    const translateY = interpolate(
      currentProgress,
      [0, 1],
      [0, -(index + 1) * 70], // 70px de espaçamento entre itens
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
          justifyContent: 'center',
          // O container pai está no centro do botão do dock (0, 0)
          // Queremos centralizar o botão circular no centro (0)
          // Layout: [label] [gap 12px] [botão 44px]
          // O botão circular tem 44px (w-11)
          // Para centralizar o botão em 0, precisamos que o centro do botão (22px da borda direita) esteja em 0.
          // O item tem largura variável (width: 'auto').
          // Se usarmos 'right: -22', a borda direita do item estará em 22px.
          // O botão (44px) estará de -22 a 22. O centro estará em 0.
          right: -22,
          width: 'auto',
          minWidth: 200, // Mínimo para garantir clique, mas alinhado à direita
          // Centralizar verticalmente: compensar metade da altura do botão (44/2 = 22)
          transform: [{ translateY: -22 }],
          zIndex: 1002,
          elevation: 1002, // Android
        },
        actionStyle
      ]}
      pointerEvents="auto"
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
      
      // No iOS, usar múltiplos requestAnimationFrame para garantir que o layout está pronto
      if (Platform.OS === 'ios') {
        // Primeiro frame: medir
        requestAnimationFrame(() => {
          measureButton();
          // Segundo frame: garantir que a medição foi processada antes de animar
          requestAnimationFrame(() => {
            // Timeout de segurança: se após 100ms ainda não mediu, usar fallback
            setTimeout(() => {
              setButtonLayout((prev) => {
                if (!prev) {
                  return {
                    x: Dimensions.get('window').width - 80,
                    y: Dimensions.get('window').height - 120,
                    width: 64,
                    height: 64
                  };
                }
                return prev;
              });
            }, 100);
            // Iniciar animação mais suave e um pouco mais longa
            progress.value = withTiming(1, {
              duration: 400, // Aumentado de 300 para 400
              easing: Easing.out(Easing.exp), // Curva mais suave que cubic
            });
          });
        });
      } else {
        // Web e Android: medir imediatamente
        measureButton();
        progress.value = withTiming(1, {
          duration: 350, // Aumentado de 250 para 350
          easing: Easing.out(Easing.exp),
        });
      }
    } else {
      // Close animation - suave e responsiva
      setShowModal(false);
      if (onCloseAnimationComplete) {
        onCloseAnimationComplete();
      }
      // Animar em background sem bloquear
      progress.value = withTiming(0, { 
        duration: 300, // Aumentado de 200 para 300
        easing: Easing.inOut(Easing.cubic), // Curva mais natural para saída
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

  // Removido: buttonRotationStyle - o botão real no dock já alterna entre + e X

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
      <Box 
        className="absolute w-full h-full top-0 left-0" 
        pointerEvents="box-none"
        style={{ zIndex: 1000 }}
      >
        {/* Actions */}
        {buttonLayout && (
          <Box
            className="absolute items-center justify-center overflow-visible"
            style={{
              left: buttonLayout.x + (buttonLayout.width / 2),
              top: buttonLayout.y + (buttonLayout.height / 2),
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
        
        {/* Fallback: Se não conseguir medir, renderizar na posição padrão (centro do dock) */}
        {!buttonLayout && isOpen && (
          <Box
            className="absolute items-center justify-center overflow-visible"
            style={{
              left: Dimensions.get('window').width / 2,
              bottom: 120,
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

        {/* Botão de Fechar (X) sobreposto ao botão original */}
        {buttonLayout && (
          <Box
            className="absolute items-center justify-center"
            style={{
              left: buttonLayout.x,
              top: buttonLayout.y,
              width: buttonLayout.width,
              height: buttonLayout.height,
              zIndex: 1002, // Acima dos itens
              elevation: 1002,
            }}
            pointerEvents="box-none"
          >
            <Pressable
              className="w-11 h-11 items-center justify-center"
              onPress={() => {
                // Haptic feedback
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleClose();
              }}
            >
              <Animated.View 
                style={{ 
                  transform: [{ rotate: '45deg' }] // Rotacionar + para virar X (ou usar ícone X)
                }}
              >
                <MainIcon size={24} color={Colors.textSecondary} />
              </Animated.View>
            </Pressable>
          </Box>
        )}
        
        {/* Fallback para o botão X se não conseguir medir */}
        {!buttonLayout && isOpen && (
          <Box
            className="absolute items-center justify-center"
            style={{
              left: Dimensions.get('window').width / 2 - 32, // Centralizado (largura 64/2)
              bottom: 120 - 64, // Posição aproximada do botão original
              width: 64,
              height: 64,
              zIndex: 1002,
              elevation: 1002,
            }}
            pointerEvents="box-none"
          >
             <Pressable
              className="w-11 h-11 items-center justify-center"
              onPress={handleClose}
            >
              <Animated.View style={{ transform: [{ rotate: '45deg' }] }}>
                <MainIcon size={24} color={Colors.textSecondary} />
              </Animated.View>
            </Pressable>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

// Estilos removidos - usando className do gluestack-ui
