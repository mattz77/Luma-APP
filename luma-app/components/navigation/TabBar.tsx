import { View, StyleSheet, LayoutChangeEvent, Dimensions, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '@/constants/Colors';
import { SpeedDial } from '../SpeedDial';
import { Home, Wallet, ListTodo, MessageCircle, Plus, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

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
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.7}
        >
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
                <Icon size={ICON_SIZE} color={active ? Colors.primary : Colors.textSecondary} />
            </Animated.View>
            {active && (
                <Animated.View style={styles.activeDot} />
            )}
        </TouchableOpacity>
    );
};

// --- Main Component ---
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const [dockWidth, setDockWidth] = useState(0);
    const router = useRouter();
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
    const [isSpeedDialVisible, setIsSpeedDialVisible] = useState(false);
    const speedDialButtonRef = useRef<View | null>(null);

    // Animation values
    const mainDockOpacity = useSharedValue(1);
    const mainDockTranslateY = useSharedValue(0);

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
            // Se já estamos na home, apenas atualiza os parâmetros
            router.setParams({ action: 'magic' });
        } else {
            // Se estamos em outra tela, navega para home com o parâmetro
            router.push('/(tabs)/index?action=magic' as any);
        }
    };

    // Hide dock on Luma Chat screen
    const currentRouteName = state.routes[state.index].name;
    const shouldHideDock = currentRouteName?.includes('luma') || currentRouteName === 'luma' || currentRouteName === 'luma/index';

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
                router.push('/(tabs)/tasks');
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
        <View style={styles.container}>
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
                style={[
                    styles.dockWrapper,
                    { opacity: mainDockOpacity, transform: [{ translateY: mainDockTranslateY }] }
                ]}
                onLayout={onDockLayout}
            >
                {/* Left: Main Pill */}
                <LiquidGlassCard style={styles.mainPill} intensity={40}>
                    <View style={styles.pillContent}>
                        {/* Home */}
                        <View style={styles.sideItem}>
                            {renderTabItem('index', Home)}
                        </View>

                        {/* Center: Luma Chat */}
                        <TouchableOpacity
                            style={styles.centerButton}
                            onPress={handleLumaPress}
                        >
                            <MessageCircle size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Right: Speed Dial Trigger */}
                        <View style={styles.sideItem} ref={speedDialButtonRef} collapsable={false}>
                            <TouchableOpacity
                                style={styles.tabItem}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    if (!isSpeedDialOpen) {
                                        setIsSpeedDialVisible(true);
                                        setIsSpeedDialOpen(true);
                                    } else {
                                        setIsSpeedDialOpen(false);
                                    }
                                }}
                                activeOpacity={1} // Disable opacity change on press since SpeedDial handles it
                            >
                                <View style={styles.speedDialTriggerIcon}>
                                    <Plus
                                        size={24}
                                        color={Colors.textSecondary}
                                        style={{ opacity: isSpeedDialVisible ? 0 : 1 }}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LiquidGlassCard>

                {/* Right: Magic Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleMagicPress}
                >
                    <LiquidGlassCard style={styles.magicButton} intensity={40}>
                        <View style={styles.magicIconContainer}>
                            <Search size={24} color={Colors.text} />
                        </View>
                    </LiquidGlassCard>
                </TouchableOpacity>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    dockWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Space between pill and magic button
    },
    mainPill: {
        borderRadius: 32,
        height: 64,
        justifyContent: 'center',
        minWidth: 200, // Ensure enough width for items
    },
    pillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: '100%',
        width: 220, // Fixed width for content
    },
    magicButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        // alignItems/justifyContent removed as they don't affect inner content of LiquidGlassCard correctly
    },
    magicIconContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    sideItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
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
    centerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        // Removed previous circular background styles
    },
    speedDialTriggerIcon: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
