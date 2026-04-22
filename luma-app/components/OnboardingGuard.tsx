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
  const redirectingRef = useRef(false); // Previne múltiplos redirecionamentos

  const normalizePath = (value?: string | null) => {
    if (!value) return '/';
    const cleaned = value.endsWith('/') && value.length > 1 ? value.slice(0, -1) : value;
    return cleaned || '/';
  };

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const normalizedPathname = normalizePath(pathname);

      // Proteção contra execuções múltiplas
      if (isCheckingRef.current) {
        return;
      }

      // Evitar re-execução se pathname e housesCount não mudaram
      // Mas não bloquear se estiver na landing e precisa redirecionar
      const needsRedirectFromLanding = normalizedPathname === '/landing' && user && houses.length > 0 && initialized;
      if (
        !needsRedirectFromLanding &&
        lastCheckedPathnameRef.current === normalizedPathname &&
        lastCheckedHousesCountRef.current === houses.length &&
        initialized &&
        (user ? houses.length > 0 : true)
      ) {
        return;
      }

      isCheckingRef.current = true;
      lastCheckedPathnameRef.current = normalizedPathname;
      lastCheckedHousesCountRef.current = houses.length;
      
      // Aguardar inicialização do auth
      if (!initialized) {
        isCheckingRef.current = false;
        return;
      }

      // Rotas públicas que não exigem sessão ativa
      const authRoutes = ['/login', '/register', '/forgot-password', '/verify-email', '/onboarding', '/tutorial'];
      const isPublicRoute = normalizedPathname === '/landing' || authRoutes.some((route) => normalizedPathname.startsWith(route));

      // Sem sessão, manter usuário em rotas públicas para evitar tabs no histórico inicial
      if (!user) {
        if (!isPublicRoute && !redirectingRef.current) {
          redirectingRef.current = true;
          router.replace('/landing');
          setTimeout(() => {
            redirectingRef.current = false;
          }, 500);
        }
        setIsChecking(false);
        isCheckingRef.current = false;
        return;
      }

      if (authRoutes.some((route) => normalizedPathname.startsWith(route))) {
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

        // 2. Verificar se tem casa - AGUARDAR carregamento antes de redirecionar
        // Se ainda está carregando, aguardar antes de tomar decisão
        if (housesLoading) {
          setIsChecking(false);
          isCheckingRef.current = false;
          return; // Retornar e aguardar próximo ciclo quando housesLoading mudar
        }
        
        if (houses.length === 0) {
          // Não tem casa, verificar se está na tela de criação
          if (!normalizedPathname.includes('/house')) {
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
        // Também verifica se está em +not-found (que pode acontecer se a rota não for encontrada)
        const isLanding = normalizedPathname === '/landing';
        const isTabsArea =
          normalizedPathname === '/' ||
          normalizedPathname.startsWith('/tasks') ||
          normalizedPathname.startsWith('/finances') ||
          normalizedPathname.startsWith('/luma') ||
          normalizedPathname.startsWith('/house') ||
          normalizedPathname.startsWith('/profile') ||
          normalizedPathname.startsWith('/notifications');
        const needsRedirect = isLanding && !redirectingRef.current;
        
        if (needsRedirect) {
          redirectingRef.current = true;
          // Usar apenas '/(tabs)' - o Expo Router automaticamente vai para o index
          router.replace('/(tabs)');
          setIsChecking(false);
          isCheckingRef.current = false;
          // Reset redirecting flag após um delay para permitir nova verificação se necessário
          setTimeout(() => {
            redirectingRef.current = false;
          }, 1000);
          return;
        }
        
        // Reset redirecting flag se já estamos em tabs
        if (isTabsArea) {
          redirectingRef.current = false;
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
  }, [initialized, user?.id, houses.length, housesLoading, pathname, router]);

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

