import { LayoutChangeEvent, Platform, StyleSheet, TextInput } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '@/constants/Colors';
import { SpeedDial } from '../SpeedDial';
import { Home, Wallet, ListTodo, MessageCircle, Plus, Search, Wand2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LinearGradient } from 'expo-linear-gradient';

// Gluestack UI v3 imports
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { useDashboardSearchStore } from '@/stores/dashboard-search.store';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';

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
    const dashboardSearchQuery = useDashboardSearchStore((s) => s.query);
    const setDashboardSearchQuery = useDashboardSearchStore((s) => s.setQuery);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
    const searchInputRef = useRef<TextInput | null>(null);
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
    const [isSpeedDialVisible, setIsSpeedDialVisible] = useState(false);
    const speedDialButtonRef = useRef<React.ComponentRef<typeof Box> | null>(null);

    const currentRouteName = state.routes[state.index].name;
    const isHomeTab = currentRouteName === 'index';

    // Animation values
    const mainDockOpacity = useSharedValue(1);
    const mainDockTranslateY = useSharedValue(0);
    const plusRotation = useSharedValue(0);

    /** No iOS 26+ com Liquid Glass nativo, opacity no ancestral quebra o efeito (ver docs/liquid-glass-cross-platform.md). */
    const isNativeLiquidGlass =
        Platform.OS === 'ios' && isLiquidGlassAvailable();

    const dockAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        if (isNativeLiquidGlass) {
            return {
                transform: [{ translateY: mainDockTranslateY.value }],
            };
        }
        return {
            opacity: mainDockOpacity.value,
            transform: [{ translateY: mainDockTranslateY.value }],
        };
    });

    // Animação de rotação do botão + para X
    useEffect(() => {
        plusRotation.value = withTiming(isSpeedDialOpen ? 45 : 0, {
            duration: 200,
        });
    }, [isSpeedDialOpen]);

    const plusIconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${plusRotation.value}deg` }],
    }));

    const onDockLayout = (event: LayoutChangeEvent) => {
        setDockWidth(event.nativeEvent.layout.width);
    };

    const handleLumaPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/luma');
    };

    const collapseSearch = () => {
        searchInputRef.current?.blur();
        setSearchExpanded(false);
    };

    const expandSearch = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setSearchExpanded(true);
        requestAnimationFrame(() => {
            setTimeout(() => searchInputRef.current?.focus(), Platform.OS === 'web' ? 0 : 80);
        });
    };

    const openSearch = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (isHomeTab) {
            expandSearch();
        } else {
            setGlobalSearchOpen(true);
        }
    };

    useEffect(() => {
        if (!isHomeTab) {
            searchInputRef.current?.blur();
            setSearchExpanded(false);
        }
    }, [isHomeTab]);

    const openMagicCreationModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const routeName = state.routes[state.index].name;
        if (routeName === 'index') {
            router.setParams({ action: undefined } as any);
            setTimeout(() => {
                router.setParams({ action: 'magic' } as any);
            }, 50);
        } else {
            router.push('/(tabs)/index?action=magic' as any);
        }
    };

    // Hide dock on Luma Chat screen OR when modals are open
    // Check if any modal-related params are present
    // Note: Only modals using params.action will be detected here
    // user_menu não usa params.action
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
            icon: Wand2,
            label: 'Criação mágica',
            onPress: () => {
                setIsSpeedDialOpen(false);
                openMagicCreationModal();
            },
            backgroundColor: Colors.primary,
        },
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
                <LiquidGlassCard
                    style={styles.mainPill}
                    intensity={85}
                    tint="systemThinMaterialLight"
                    skiaHighlight
                >
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
                            style={{ zIndex: 9999, elevation: 9999 }} // z-index muito alto para ficar acima do blur do modal
                            onLayout={(event) => {
                                // Armazenar layout para uso no SpeedDial
                                if (speedDialButtonRef.current) {
                                    (speedDialButtonRef.current as any)._layout = event.nativeEvent.layout;
                                }
                            }}
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
                                    <Animated.View style={plusIconStyle}>
                                        <Plus
                                            size={24}
                                            color={Colors.textSecondary}
                                        />
                                    </Animated.View>
                                </Box>
                            </Pressable>
                        </Box>
                    </HStack>
                </LiquidGlassCard>

                {/* Right: busca — colapsada (só lupa); expandida ao toque (placeholder "Buscar") */}
                {!searchExpanded ? (
                    <Pressable
                        onPress={openSearch}
                        accessibilityRole="button"
                        accessibilityLabel={isHomeTab ? 'Abrir busca' : 'Abrir busca global'}
                    >
                        <LiquidGlassCard
                            style={styles.searchPillCollapsed}
                            intensity={85}
                            tint="systemThinMaterialLight"
                            skiaHighlight
                        >
                            <Box style={styles.searchPillCollapsedInner}>
                                <Search size={24} color={Colors.text} />
                            </Box>
                        </LiquidGlassCard>
                    </Pressable>
                ) : (
                    <LiquidGlassCard
                        style={styles.searchPillExpanded}
                        intensity={85}
                        tint="systemThinMaterialLight"
                        skiaHighlight
                    >
                        <HStack space="sm" className="items-center px-3 h-full flex-1">
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                                    collapseSearch();
                                }}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="Fechar busca"
                            >
                                <Search size={18} color={Colors.textSecondary} />
                            </Pressable>
                            <TextInput
                                ref={searchInputRef}
                                value={dashboardSearchQuery}
                                onChangeText={setDashboardSearchQuery}
                                placeholder="Buscar"
                                placeholderTextColor={Colors.textSecondary}
                                returnKeyType="search"
                                clearButtonMode="while-editing"
                                style={styles.searchInput}
                                autoCorrect={false}
                                autoCapitalize="none"
                                onBlur={() => {
                                    if (!dashboardSearchQuery.trim()) {
                                        setSearchExpanded(false);
                                    }
                                }}
                            />
                        </HStack>
                    </LiquidGlassCard>
                )}

            </Animated.View>

            <GlobalSearchModal visible={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
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
        gap: 12,
        marginBottom: 30,
        maxWidth: '100%',
        paddingHorizontal: 8,
    },
    mainPill: {
        borderRadius: 32,
        height: 64,
        justifyContent: 'center',
        minWidth: 200, // Ensure enough width for items
    },
    searchPillCollapsed: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
    },
    searchPillCollapsedInner: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchPillExpanded: {
        height: 64,
        minWidth: 140,
        maxWidth: 200,
        borderRadius: 32,
        justifyContent: 'center',
    },
    searchInput: {
        flex: 1,
        minHeight: 40,
        paddingVertical: Platform.OS === 'web' ? 8 : 6,
        fontSize: 14,
        color: Colors.text,
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
