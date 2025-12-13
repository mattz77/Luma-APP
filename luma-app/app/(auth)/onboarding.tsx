import { useState, useEffect } from 'react';
import { useRouter, Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Sparkles, ArrowRight, CheckCircle } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth.store';
import { useUserHouses } from '@/hooks/useHouses';
import { Colors } from '@/constants/Colors';
import { cardShadowStyle } from '@/lib/styles';

const { width } = Dimensions.get('window');

const AnimatedSparkles = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Sparkles size={32} color={Colors.primary} />
    </Animated.View>
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: houses = [], isLoading } = useUserHouses(user?.id);
  const [isNavigating, setIsNavigating] = useState(false);

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Se já tiver casa, verificar se precisa do tutorial
  useEffect(() => {
    if (!isLoading && houses.length > 0) {
      // Verificar se já completou o tutorial (pode ser salvo em AsyncStorage ou no perfil do usuário)
      // Por enquanto, vamos redirecionar para o tutorial se tiver casa
      // Se não tiver casa, vai para criação de casa
    }
  }, [houses, isLoading]);

  const handleGetStarted = () => {
    setIsNavigating(true);
    
    if (houses.length === 0) {
      // Não tem casa, vai para criação
      router.replace('/(tabs)/house');
    } else {
      // Tem casa, vai para tutorial
      router.replace('/(auth)/tutorial');
    }
  };

  const handleSkip = () => {
    setIsNavigating(true);
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.delay(200)}
          style={styles.iconContainer}
        >
          <AnimatedSparkles />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.textContainer}>
          <Text style={styles.title}>Bem-vindo à Luma! ✨</Text>
          <Text style={styles.subtitle}>
            Sua assistente inteligente para{'\n'}
            organizar a casa e a família
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={[styles.featuresCard, cardShadowStyle]}>
          <View style={styles.featureItem}>
            <CheckCircle size={24} color={Colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Gestão Financeira</Text>
              <Text style={styles.featureDescription}>
                Registre despesas, acompanhe orçamentos e divida custos
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <CheckCircle size={24} color={Colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Tarefas Colaborativas</Text>
              <Text style={styles.featureDescription}>
                Organize tarefas, atribua responsáveis e acompanhe progresso
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <CheckCircle size={24} color={Colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Assistente Luma</Text>
              <Text style={styles.featureDescription}>
                Converse com a Luma para obter insights e criar itens rapidamente
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800)} style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Começar</Text>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSkip}
            disabled={isNavigating}
          >
            <Text style={styles.secondaryButtonText}>Pular</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    minHeight: Dimensions.get('window').height - 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

