import { Buffer } from 'buffer';
global.Buffer = Buffer;

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import './global.css';

import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PaymentCheckScreen from './src/screens/PaymentCheckScreen';

import LoginScreen from './src/screens/LoginScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import GisMapScreen from './src/screens/GisMapScreen';
import TaxpayerListScreen from './src/screens/TaxpayerListScreen';
import BillingHistoryScreen from './src/screens/BillingHistoryScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [initialParams, setInitialParams] = useState<RootStackParamList['Dashboard'] | undefined>(undefined);

  useEffect(() => {
    loadInitialSession();
  }, []);

  const loadInitialSession = async () => {
    try {
      const [serverUrl, villageName, villageLogo] = await Promise.all([
        AsyncStorage.getItem('serverUrl'),
        AsyncStorage.getItem('villageName'),
        AsyncStorage.getItem('villageLogo'),
      ]);

      if (serverUrl && villageName) {
        setInitialParams({
          serverUrl,
          villageName,
          villageLogo,
          stats: {},
        });
        setInitialRoute('Dashboard');
        return;
      }
    } catch (error) {
      // Fall back to onboarding when local session cannot be restored.
    }

    setInitialRoute('Onboarding');
  };

  if (!initialRoute) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} initialParams={initialParams} />
        <Stack.Screen name="PaymentCheck" component={PaymentCheckScreen} />

        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="GisMap" component={GisMapScreen} />
        <Stack.Screen name="TaxpayerList" component={TaxpayerListScreen} />
        <Stack.Screen name="BillingHistory" component={BillingHistoryScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />


      </Stack.Navigator>
    </NavigationContainer>
  );
}
