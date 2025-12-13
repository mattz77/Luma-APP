import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuthStore } from '@/stores/auth.store';
import { useUserHouses } from '@/hooks/useHouses';
import { isTutorialCompleted } from '@/app/(auth)/tutorial';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

/**
 * Componente que gerencia o fluxo de onboarding
 * Verifica se o usuário precisa completar verificação de email, onboarding ou tutorial
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const { data: houses = [], isLoading: housesLoading } = useUserHouses(user?.id);
  const [isChecking, setIsChecking] = useState(true);
  
  // Proteção contra execuções múltiplas
  const isCheckingRef = useRef(false);
  const lastCheckedPathnameRef = useRef<string | null>(null);
  const lastCheckedHousesCountRef = useRef<number>(-1);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Proteção contra execuções múltiplas
      if (isCheckingRef.current) {
        return;
      }

      // Evitar re-execução se pathname e housesCount não mudaram
      // Mas não bloquear se estiver na landing e precisa redirecionar
      const needsRedirectFromLanding = (pathname === '/' || pathname === '/landing') && user && houses.length > 0 && initialized;
      if (
        !needsRedirectFromLanding &&
        lastCheckedPathnameRef.current === pathname &&
        lastCheckedHousesCountRef.current === houses.length &&
        initialized &&
        (user ? houses.length > 0 : true)
      ) {
        return;
      }

      isCheckingRef.current = true;
      lastCheckedPathnameRef.current = pathname;
      lastCheckedHousesCountRef.current = houses.length;
      
      // Aguardar inicialização do auth
      if (!initialized) {
        isCheckingRef.current = false;
        return;
      }

      // Se não estiver autenticado, não fazer nada (deixa o fluxo de auth funcionar)
      if (!user) {
        setIsChecking(false);
        isCheckingRef.current = false;
        return;
      }

      // Rotas que não precisam de verificação de onboarding
      const authRoutes = [
        '/(auth)/login',
        '/(auth)/register',
        '/(auth)/forgot-password',
        '/(auth)/verify-email',
        '/(auth)/onboarding',
        '/(auth)/tutorial',
      ];

      if (authRoutes.some((route) => pathname?.startsWith(route))) {
        setIsChecking(false);
        isCheckingRef.current = false;
        return;
      }

      try {
        // 1. Verificar se email foi confirmado
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user?.email_confirmed_at) {
          // Email não confirmado, redirecionar para verificação
          router.replace('/(auth)/verify-email');
          setIsChecking(false);
          isCheckingRef.current = false;
          return;
        }

        // 2. Verificar se tem casa
        if (houses.length === 0) {
          // Não tem casa, verificar se está na tela de criação
          if (!pathname?.includes('/house')) {
            router.replace('/(tabs)/house');
          }
          setIsChecking(false);
          isCheckingRef.current = false;
          return;
        }

        // 3. Verificar se completou o tutorial
        const tutorialCompleted = await isTutorialCompleted();
        if (!tutorialCompleted) {
          // Tutorial não completado, redirecionar
          router.replace('/(auth)/tutorial');
          setIsChecking(false);
          isCheckingRef.current = false;
          return;
        }

        // 4. Se estiver na landing page ou rota root e tudo estiver ok, redirecionar para tabs
        if ((pathname === '/' || pathname === '/landing') && !pathname.startsWith('/(tabs)')) {
          router.replace('/(tabs)/index');
          setIsChecking(false);
          isCheckingRef.current = false;
          return;
        }

        // Tudo ok, pode continuar
        setIsChecking(false);
        isCheckingRef.current = false;
      } catch (error) {
        console.error('[OnboardingGuard] Erro ao verificar status:', error);
        setIsChecking(false);
        isCheckingRef.current = false;
      }
    };

    checkOnboardingStatus();
  }, [initialized, user?.id, houses.length, pathname, router]);

  // Não mostrar loading se não há usuário (deixa a landing page aparecer)
  // Só mostrar loading se estiver autenticado e ainda verificando
  const shouldShowLoading = (isChecking || housesLoading) && (user !== null || !initialized);
  
  if (shouldShowLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

