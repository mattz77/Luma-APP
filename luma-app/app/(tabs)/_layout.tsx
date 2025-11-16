import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import {
  CheckSquare,
  DollarSign,
  Home,
  MessageCircle,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { useUserHouses } from '@/hooks/useHouses';
import { useCanAccessFinances } from '@/hooks/useUserRole';
import { useAuthStore } from '@/stores/auth.store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const houseId = useAuthStore((state) => state.houseId);
  const setHouseId = useAuthStore((state) => state.setHouseId);
  const loading = useAuthStore((state) => state.loading);
  const { data: userHouses = [] } = useUserHouses(user?.id);
  const canAccessFinances = useCanAccessFinances(houseId, user?.id);
  const isDark = colorScheme === 'dark';
  const { bottom } = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(bottom, 12);

  // Garante que uma casa válida esteja selecionada assim que o usuário entra no app
  useEffect(() => {
    if (!user) {
      setHouseId(null);
      return;
    }

    if (!userHouses.length) {
      setHouseId(null);
      return;
    }

    if (!houseId) {
      setHouseId(userHouses[0].house.id);
      return;
    }

    const exists = userHouses.some((item) => item.house.id === houseId);
    if (!exists) {
      setHouseId(userHouses[0].house.id);
    }
  }, [user, userHouses, houseId, setHouseId]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        }}
      >
        <ActivityIndicator size="large" color={isDark ? '#93c5fd' : '#1d4ed8'} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#38bdf8' : '#1d4ed8',
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#94a3b8',
        tabBarStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopWidth: 0,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      {canAccessFinances && (
        <Tabs.Screen
          name="finances/index"
          options={{
            title: 'Finanças',
            tabBarLabel: 'Finanças',
            tabBarIcon: ({ color }) => <DollarSign color={color} size={24} />,
          }}
        />
      )}
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'Tarefas',
          tabBarLabel: 'Tarefas',
          tabBarIcon: ({ color }) => <CheckSquare color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="luma/index"
        options={{
          title: 'Luma',
          tabBarLabel: 'Luma',
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="house/index"
        options={{
          title: 'Casa',
          tabBarLabel: 'Casa',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

