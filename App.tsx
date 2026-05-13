import React, {useState, useEffect, useCallback} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, StatusBar} from 'react-native';
import {createMMKV} from 'react-native-mmkv';

import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import TransactionsScreen from './src/screens/transactions/TransactionsScreen';
import CategoriesScreen from './src/screens/categories/CategoriesScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import {useBankNotifications} from './src/native';
import {processNotification} from './src/modules/banking';
import {useAppStore} from './src/app/store';
import type {BankNotification} from './src/shared/types';

const storage = createMMKV();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: '📊',
  Transactions: '📋',
  Categories: '🏷️',
  Settings: '⚙️',
};

const C = {bg: '#0f0f1a', card: '#1a1a2e', border: '#2a2a4a', pri: '#6c5ce7', txt: '#fff', sub: '#a0a0b8'};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: () => <Text style={{fontSize: 22}}>{TAB_ICONS[route.name]}</Text>,
        tabBarStyle: {backgroundColor: C.card, borderTopColor: C.border, height: 60, paddingBottom: 8},
        tabBarActiveTintColor: C.pri,
        tabBarInactiveTintColor: C.sub,
        headerStyle: {backgroundColor: C.bg},
        headerTintColor: C.txt,
        tabBarLabelStyle: {fontSize: 11},
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{title: 'Tổng quan'}} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{title: 'Giao dịch'}} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{title: 'Danh mục'}} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{title: 'Cài đặt'}} />
    </Tab.Navigator>
  );
}

import {checkForUpdates} from './src/services/updater';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const addTransaction = useAppStore(s => s.addTransaction);
  const loadTransactions = useAppStore(s => s.loadTransactions);
  const loadStats = useAppStore(s => s.loadStats);

  const loadCustomCategories = useAppStore(s => s.loadCustomCategories);
  const loadProfile = useAppStore(s => s.loadProfile);

  useEffect(() => {
    loadCustomCategories();
    loadProfile();
    const hasOnboarded = storage.getBoolean('onboarded');
    setShowOnboarding(!hasOnboarded);
    setIsReady(true);
    
    // Check for app updates silently
    checkForUpdates(true);
  }, [loadCustomCategories, loadProfile]);

  const handleNotification = useCallback(async (notification: BankNotification) => {
    const result = await processNotification(notification);
    if (result.transaction) {
      addTransaction(result.transaction);
      loadStats();
    }
  }, [addTransaction, loadStats]);

  useBankNotifications(handleNotification);

  const handleOnboardingComplete = () => {
    storage.set('onboarded', true);
    setShowOnboarding(false);
  };

  if (!isReady) {return null;}

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <NavigationContainer>
        {showOnboarding ? (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        ) : (
          <MainTabs />
        )}
      </NavigationContainer>
    </>
  );
}
