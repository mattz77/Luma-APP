import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutUp,
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withSequence,
    withDelay,
    runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    onDismiss: () => void;
    duration?: number;
}

const ICONS = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

const COLORS = {
    success: '#10B981',
    error: '#EF4444',
    info: Colors.primary,
    warning: '#F59E0B',
};

export function Toast({
    visible,
    message,
    type = 'info',
    onDismiss,
    duration = 3000,
}: ToastProps) {
    const insets = useSafeAreaInsets();
    const Icon = ICONS[type];
    const color = COLORS[type];

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onDismiss();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [visible, duration, onDismiss]);

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeInUp.springify().damping(15)}
            exiting={FadeOutUp}
            style={[styles.container, { top: insets.top + 10 }]}
        >
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[styles.content, { borderLeftColor: color }]}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Icon size={20} color={color} />
                </View>
                <Text style={styles.message}>{message}</Text>
                <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                    <X size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 9999,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderLeftWidth: 4,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
});
