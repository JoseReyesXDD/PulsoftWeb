import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { UserProvider } from '@/context/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#111',
          tabBarInactiveTintColor: '#111',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
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
            title: 'Inicio',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            tabBarLabelStyle: { fontFamily: 'Lufga-Bold' },
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Gráficas',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
            tabBarLabelStyle: { fontFamily: 'Lufga-Bold' },
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
            tabBarLabelStyle: { fontFamily: 'Lufga-Bold' },
          }}
        />
      </Tabs>
    </UserProvider>
  );
}
