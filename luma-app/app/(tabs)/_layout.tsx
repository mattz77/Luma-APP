import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { TabBar } from '@/components/navigation/TabBar';
import { Home, Wallet, CheckCircle, MessageCircle, Home as HouseIcon } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finances/index"
        options={{
          title: 'Finanças',
          tabBarIcon: ({ color }) => <Wallet size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ color }) => <CheckCircle size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="luma/index"
        options={{
          title: 'Luma',
          tabBarIcon: ({ color }) => <MessageCircle size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="house/index"
        options={{
          title: 'Casa',
          tabBarIcon: ({ color }) => <HouseIcon size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          href: null, // Ocultar da tab bar
        }}
      />
    </Tabs>
  );
}
