import { useState } from 'react';
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
import { Sparkles, Wallet, CheckCircle, MessageCircle, ArrowRight, ArrowLeft, X } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth.store';
import { Colors } from '@/constants/Colors';
import { cardShadowStyle } from '@/lib/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TUTORIAL_STORAGE_KEY = '@luma:tutorial_completed';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  action?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Conheça a Luma',
    description: 'A Luma é sua assistente inteligente. Converse com ela para obter insights sobre sua casa, criar tarefas e despesas, e muito mais!',
    icon: Sparkles,
    color: Colors.primary,
    action: 'Experimente: "Como está a situação financeira?"',
  },
  {
    id: 2,
    title: 'Adicione Despesas',
    description: 'Registre todas as despesas da casa. Você pode categorizar, dividir entre membros e até anexar comprovantes.',
    icon: Wallet,
    color: '#10b981',
    action: 'Dica: Use o botão "+" no dashboard para criar rapidamente',
  },
  {
    id: 3,
    title: 'Crie Tarefas',
    description: 'Organize as tarefas domésticas. Atribua responsáveis, defina prazos e acompanhe o progresso de toda a família.',
    icon: CheckCircle,
    color: '#f59e0b',
    action: 'Dica: Tarefas concluídas geram pontos para gamificação',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Se não estiver autenticado, redirecionar
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const currentStepData = tutorialSteps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Marcar tutorial como completo
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      // Redirecionar para dashboard
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erro ao salvar status do tutorial:', error);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erro ao salvar status do tutorial:', error);
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header com skip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <X size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {tutorialSteps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Step Content */}
        <Animated.View
          key={currentStep}
          entering={FadeInDown.springify()}
          exiting={FadeOut}
          style={styles.stepContainer}
        >
          <View style={[styles.iconCircle, { backgroundColor: currentStepData.color + '15' }]}>
            <Icon size={64} color={currentStepData.color} />
          </View>

          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>

          {currentStepData.action && (
            <View style={[styles.actionCard, cardShadowStyle]}>
              <MessageCircle size={20} color={currentStepData.color} />
              <Text style={styles.actionText}>{currentStepData.action}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {!isFirstStep && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevious}
            disabled={isCompleting}
          >
            <ArrowLeft size={20} color={Colors.primary} />
            <Text style={styles.navButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryNavButton,
            { marginLeft: isFirstStep ? 0 : 'auto' },
          ]}
          onPress={handleNext}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryNavButtonText}>
                {isLastStep ? 'Começar' : 'Próximo'}
              </Text>
              {!isLastStep && <ArrowRight size={20} color="#fff" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skipButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary + '40',
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height * 0.5,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    maxWidth: width - 80,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  navButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryNavButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

// Função helper para verificar se o tutorial foi completado
export async function isTutorialCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Erro ao verificar status do tutorial:', error);
    return false;
  }
}

