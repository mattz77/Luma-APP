import { LayoutChangeEvent, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '@/constants/Colors';
import { SpeedDial } from '../SpeedDial';
import { Home, Wallet, ListTodo, MessageCircle, Plus, Search, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LinearGradient } from 'expo-linear-gradient';

// Gluestack UI v3 imports
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';

// --- Constants ---
const ICON_SIZE = 24;
const ACTIVE_ICON_SCALE = 1.2;
const INACTIVE_ICON_SCALE = 1;

// --- Types ---
type TabBarComponentProps = {
    active?: boolean;
    onPress: () => void;
    onLongPress: () => void;
    icon: any;
    label: string;
    color: string;
};

// --- Helper Components ---
const TabBarItem = ({ active, onPress, onLongPress, icon: Icon, label, color }: TabBarComponentProps) => {
    const scale = useSharedValue(INACTIVE_ICON_SCALE);

    useEffect(() => {
        scale.value = withSpring(active ? ACTIVE_ICON_SCALE : INACTIVE_ICON_SCALE, {
            damping: 12,
            stiffness: 150,
        });
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            className="items-center justify-center w-11 h-11"
        >
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
                <Icon size={ICON_SIZE} color={active ? Colors.primary : Colors.textSecondary} />
            </Animated.View>
            {active && (
                <Animated.View style={styles.activeDot} />
            )}
        </Pressable>
    );
};

// --- Main Component ---
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const [dockWidth, setDockWidth] = useState(0);
    const router = useRouter();
    const params = useLocalSearchParams();
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
    const [isSpeedDialVisible, setIsSpeedDialVisible] = useState(false);
    const speedDialButtonRef = useRef<React.ComponentRef<typeof Box> | null>(null);

    // Animation values
    const mainDockOpacity = useSharedValue(1);
    const mainDockTranslateY = useSharedValue(0);

    // Use animated style para shared values (corrige warning do Reanimated)
    const dockAnimatedStyle = useAnimatedStyle(() => ({
        opacity: mainDockOpacity.value,
        transform: [{ translateY: mainDockTranslateY.value }]
    }));

    const onDockLayout = (event: LayoutChangeEvent) => {
        setDockWidth(event.nativeEvent.layout.width);
    };

    const handleLumaPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/luma');
    };

    const handleMagicPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navega para home e abre o modal de criação mágica
        if (currentRouteName === 'index') {
            // Se já estamos na home, força uma atualização do parâmetro
            // Primeiro remove o parâmetro (se existir) e depois adiciona novamente
            // Isso garante que o useEffect sempre dispare
            router.setParams({ action: undefined } as any);
            // Usa setTimeout para garantir que a remoção aconteça antes da adição
            setTimeout(() => {
                router.setParams({ action: 'magic' } as any);
            }, 50);
        } else {
            // Se estamos em outra tela, navega para home com o parâmetro
            router.push('/(tabs)/index?action=magic' as any);
        }
    };

    // Hide dock on Luma Chat screen OR when modals are open
    const currentRouteName = state.routes[state.index].name;
    // Check if any modal-related params are present
    // Note: Only modals using params.action will be detected here
    // Other modals (briefing, user_menu) may need to set params.action as well
    const hasModalOpen = params.action !== undefined && params.action !== null && params.action !== '';
    const shouldHideDock =
        currentRouteName?.includes('luma') ||
        currentRouteName === 'luma' ||
        currentRouteName === 'luma/index' ||
        hasModalOpen;

    if (shouldHideDock) {
        return null;
    }

    const renderTabItem = (routeName: string, Icon: any) => {
        const route = state.routes.find(r => r.name === routeName);
        if (!route) return null;

        const { options } = descriptors[route.key];
        const label =
            options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                    ? options.title
                    : route.name;

        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
                Haptics.selectionAsync();
            }
        };

        const onLongPress = () => {
            navigation.emit({
                type: 'tabLongPress',
                target: route.key,
            });
        };

        return (
            <TabBarItem
                key={route.key}
                active={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                icon={Icon}
                label={label as string}
                color={isFocused ? Colors.primary : Colors.textSecondary}
            />
        );
    };

    // Speed Dial Actions
    const speedDialActions = [
        {
            icon: ListTodo,
            label: 'Nova Tarefa',
            onPress: () => {
                setIsSpeedDialOpen(false);
                router.push('/(tabs)/tasks?action=create');
            },
            backgroundColor: Colors.primary,
        },
        {
            icon: Wallet,
            label: 'Nova Despesa',
            onPress: () => {
                setIsSpeedDialOpen(false);
                router.push('/(tabs)/finances');
            },
            backgroundColor: Colors.secondary,
        },
    ];

    return (
        <Box style={styles.container}>
            {/* Bottom Vignette - Mais sutil para não escurecer o dock */}
            <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.03)', 'rgba(0,0,0,0.08)']}
                locations={[0, 0.6, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.vignette}
                pointerEvents="none"
            />

            {/* Speed Dial Overlay */}
            <SpeedDial
                isOpen={isSpeedDialOpen}
                onClose={() => setIsSpeedDialOpen(false)}
                onCloseAnimationComplete={() => setIsSpeedDialVisible(false)}
                actions={speedDialActions}
                buttonRef={speedDialButtonRef}
            />

            {/* Main Dock Container */}
            <Animated.View
                style={[styles.dockWrapper, dockAnimatedStyle]}
                onLayout={onDockLayout}
            >
                {/* Left: Main Pill */}
                {/* Intensity alto e tint específico para efeito vidro fino */}
                <LiquidGlassCard style={styles.mainPill} intensity={85} tint="systemThinMaterialLight">
                    <HStack space="md" className="items-center justify-between px-5 h-full w-[220px]">
                        {/* Home */}
                        <Box className="items-center justify-center w-11 h-11">
                            {renderTabItem('index', Home)}
                        </Box>

                        {/* Center: Luma Chat */}
                        <Pressable
                            className="w-11 h-11 items-center justify-center"
                            onPress={handleLumaPress}
                        >
                            <MessageCircle size={24} color={Colors.textSecondary} />
                        </Pressable>

                        {/* Right: Speed Dial Trigger */}
                        <Box 
                            className="items-center justify-center w-11 h-11" 
                            ref={speedDialButtonRef}
                            style={{ zIndex: 2000 }} // Garantir que o botão fique acima
                        >
                            <Pressable
                                className="w-11 h-11 items-center justify-center"
                                onPress={() => {
                                    // Haptic feedback não bloqueia - executar de forma não bloqueante
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                                    if (!isSpeedDialOpen) {
                                        setIsSpeedDialVisible(true);
                                        setIsSpeedDialOpen(true);
                                    } else {
                                        setIsSpeedDialOpen(false);
                                    }
                                }}
                                // Permitir múltiplos toques rápidos no iOS
                                delayPressIn={0}
                                delayPressOut={0}
                                style={{ zIndex: 2001 }}
                            >
                                <Box className="w-11 h-11 items-center justify-center">
                                    <Plus
                                        size={24}
                                        color={Colors.textSecondary}
                                        style={{ opacity: isSpeedDialOpen ? 0 : 1 }} // Esconder o + quando aberto, pois o X do modal vai sobrepor
                                    />
                                </Box>
                            </Pressable>
                        </Box>
                    </HStack>
                </LiquidGlassCard>

                {/* Right: Magic Button */}
                <Pressable
                    onPress={handleMagicPress}
                >
                    <LiquidGlassCard style={styles.magicButton} intensity={85} tint="systemThinMaterialLight">
                        <Box style={styles.magicIconContainer}>
                            <Search size={24} color={Colors.text} />
                        </Box>
                    </LiquidGlassCard>
                </Pressable>

            </Animated.View>
        </Box>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'flex-end', // Align content to bottom
        zIndex: 1000,
        height: 120, // Give it some height for the gradient
        pointerEvents: 'box-none', // Allow touches to pass through empty areas
    },
    vignette: {
        ...StyleSheet.absoluteFillObject,
        bottom: 0,
        height: '130%',
    },
    dockWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Space between pill and magic button
        marginBottom: 30, // Restore the bottom margin for the dock itself
    },
    mainPill: {
        borderRadius: 32,
        height: 64,
        justifyContent: 'center',
        minWidth: 200, // Ensure enough width for items
    },
    magicButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        position: 'relative',
    },
    magicIconContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeDot: {
        position: 'absolute',
        bottom: -8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
});
