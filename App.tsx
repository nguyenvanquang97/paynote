import React, {useState, useEffect, useCallback} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar} from 'react-native';
import {createMMKV} from 'react-native-mmkv';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';

import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import TransactionsScreen from './src/screens/transactions/TransactionsScreen';
import ChartsScreen from './src/screens/charts/ChartsScreen';
import CategoriesScreen from './src/screens/categories/CategoriesScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import BubbleTabBar from './src/shared/components/BubbleTabBar';
import {useBankNotifications} from './src/native';
import {processNotification} from './src/modules/banking';
import {useAppStore} from './src/app/store';
import type {BankNotification} from './src/shared/types';

const storage = createMMKV();
const Tab = createBottomTabNavigator();

const C = {bg: '#0f0f1a'};

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BubbleTabBar {...props} />}
      screenOptions={{
        headerStyle: {backgroundColor: C.bg},
        headerTintColor: '#ffffff',
        headerTitleStyle: {fontWeight: '600'},
      }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{title: 'Tổng quan'}} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{title: 'Giao dịch'}} />
      <Tab.Screen name="Charts" component={ChartsScreen} options={{title: 'Biểu đồ'}} />
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
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <NavigationContainer>
          {showOnboarding ? (
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          ) : (
            <MainTabs />
          )}
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
