import React, {useState, useEffect, useCallback} from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar, ImageBackground, StyleSheet, View} from 'react-native';
import {createMMKV} from 'react-native-mmkv';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';

import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import TransactionsScreen from './src/screens/transactions/TransactionsScreen';
import ChartsScreen from './src/screens/charts/ChartsScreen';
import CategoriesScreen from './src/screens/categories/CategoriesScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import PersonalFinanceScreen from './src/screens/settings/PersonalFinanceScreen';
import BudgetSettingsScreen from './src/screens/settings/BudgetSettingsScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import SplashScreen from './src/screens/splash/SplashScreen';
import BubbleTabBar from './src/shared/components/BubbleTabBar';
import {getThemeColors} from './src/shared/theme';
import {DialogContainer} from './src/shared/components/Dialog';
import {ToastContainer} from './src/shared/components/Toast';
import {configurePeriodicRoast, startPeriodicRoastReminder, useBankNotifications} from './src/native';
import {processNotification} from './src/modules/banking';
import {useAppStore} from './src/app/store';
import type {BankNotification} from './src/shared/types';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {triggerBudgetAlertsForTransaction} from './src/services/budgetAlerts';
import {handlePhase2TransactionSignals} from './src/services/notificationPhase2';
import {useThemeTransition} from './src/animations';
import Animated from 'react-native-reanimated';
import {getGeminiApiKeyFromEnv} from './src/config/env';

const storage = createMMKV();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const themeMode = useAppStore(s => s.themeMode);
  const aiBudgetAlertsEnabled = useAppStore(s => s.aiBudgetAlertsEnabled);
  const geminiApiKey = useAppStore(s => s.geminiApiKey);
  const colors = getThemeColors(themeMode);
  return (
    <Tab.Navigator
      tabBar={props => <BubbleTabBar {...props} />}
      screenOptions={{
        sceneStyle: {backgroundColor: 'transparent', paddingTop: insets.top + 8},
        headerShown: false,
        headerTransparent: true,
        headerStyle: {backgroundColor: 'transparent'},
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {fontWeight: '700', color: colors.textPrimary},
      }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{title: ''}} />
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
  const loadStats = useAppStore(s => s.loadStats);
  const loadCustomCategories = useAppStore(s => s.loadCustomCategories);
  const loadProfile = useAppStore(s => s.loadProfile);
  const loadCategoryBudgets = useAppStore(s => s.loadCategoryBudgets);
  const loadFavoriteCategories = useAppStore(s => s.loadFavoriteCategories);
  const loadMonthlyNotes = useAppStore(s => s.loadMonthlyNotes);
  const loadBudgetAlertsEnabled = useAppStore(s => s.loadBudgetAlertsEnabled);
  const loadAiAlertSettings = useAppStore(s => s.loadAiAlertSettings);
  const loadBudgetAlertHistory = useAppStore(s => s.loadBudgetAlertHistory);
  const loadNotificationMemory = useAppStore(s => s.loadNotificationMemory);
  const loadInAppNotifications = useAppStore(s => s.loadInAppNotifications);
  const loadThemeMode = useAppStore(s => s.loadThemeMode);
  const aiBudgetAlertsEnabled = useAppStore(s => s.aiBudgetAlertsEnabled);
  const notificationPersona = useAppStore(s => s.notificationPersona);
  const notificationIntensity = useAppStore(s => s.notificationIntensity);
  const allowStrongLanguage = useAppStore(s => s.allowStrongLanguage);
  const geminiApiKey = useAppStore(s => s.geminiApiKey);
  const themeMode = useAppStore(s => s.themeMode);
  const colors = getThemeColors(themeMode);
  const { fadeStyle } = useThemeTransition();
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
      card: 'transparent',
      border: 'transparent',
      text: colors.textPrimary,
    },
  };

  useEffect(() => {
    const boot = async () => {
      const startedAt = Date.now();
      loadCustomCategories();
      loadProfile();
      loadCategoryBudgets();
      loadFavoriteCategories();
      loadMonthlyNotes();
      loadBudgetAlertsEnabled();
      loadAiAlertSettings();
      loadBudgetAlertHistory();
      loadNotificationMemory();
      loadInAppNotifications();
      loadThemeMode();
      const hasOnboarded = storage.getBoolean('onboarded');
      setShowOnboarding(!hasOnboarded);

      const elapsed = Date.now() - startedAt;
      const minSplashMs = 2200;
      const remain = Math.max(0, minSplashMs - elapsed);
      setTimeout(() => setIsReady(true), remain);
    };

    boot();
  }, [
    loadCustomCategories,
    loadProfile,
    loadCategoryBudgets,
    loadFavoriteCategories,
    loadMonthlyNotes,
    loadBudgetAlertsEnabled,
    loadAiAlertSettings,
    loadBudgetAlertHistory,
    loadInAppNotifications,
    loadThemeMode,
  ]);

  useEffect(() => {
    if (!isReady || __DEV__) {return;}
    checkForUpdates(true);
  }, [isReady]);

  const handleNotification = useCallback(async (notification: BankNotification) => {
    const result = await processNotification(notification);
    if (result.transaction) {
      addTransaction(result.transaction);
      loadStats();
      triggerBudgetAlertsForTransaction(result.transaction);
    }
    handlePhase2TransactionSignals({
      transaction: result.transaction,
      skippedReason: result.skippedReason,
      isSuspectedGap: result.isSuspectedGap,
      missingAmount: result.missingAmount,
    });
  }, [addTransaction, loadStats]);

  useBankNotifications(handleNotification);

  useEffect(() => {
    const resolvedKey = geminiApiKey.trim() || getGeminiApiKeyFromEnv();
    configurePeriodicRoast(aiBudgetAlertsEnabled, resolvedKey, notificationPersona, allowStrongLanguage, notificationIntensity);
  }, [aiBudgetAlertsEnabled, geminiApiKey, notificationPersona, allowStrongLanguage, notificationIntensity]);

  useEffect(() => {
    if (!isReady) {return;}
    startPeriodicRoastReminder();
  }, [isReady]);

  const handleOnboardingComplete = () => {
    storage.set('onboarded', true);
    setShowOnboarding(false);
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{flex: 1}}>
        <BottomSheetModalProvider>
          {!isReady ? (
            <SplashScreen />
          ) : (
            <React.Fragment>
              <StatusBar
                barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
              />
              <Animated.View style={[styles.bg, fadeStyle]}>
                <ImageBackground
                source={
                  themeMode === 'dark'
                    ? require('./src/assets/images/app-bg-dark.png')
                    : require('./src/assets/images/app-bg.png')
                }
                resizeMode="cover"
                style={styles.bg}>
                {themeMode !== 'light' && (
                  <View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor:
                          themeMode === 'dark'
                            ? 'rgba(5,10,16,0.52)'
                            : 'rgba(10,20,12,0.42)',
                      },
                    ]}
                  />
                )}
                <NavigationContainer theme={navTheme}>
                  {showOnboarding ? (
                    <OnboardingScreen onComplete={handleOnboardingComplete} />
                  ) : (
                    <Stack.Navigator
                      screenOptions={{
                        headerStyle: {backgroundColor: colors.surface},
                        headerTintColor: colors.textPrimary,
                        headerTitleStyle: {fontWeight: '700', color: colors.textPrimary},
                        contentStyle: {backgroundColor: colors.appBg},
                        animation: 'slide_from_right',
                      }}>
                      <Stack.Screen name="MainTabs" component={MainTabs} options={{headerShown: false}} />
                      <Stack.Screen
                        name="PersonalFinance"
                        component={PersonalFinanceScreen}
                        options={{title: 'Sao lưu & Tiện ích'}}
                      />
                      <Stack.Screen
                        name="BudgetSettings"
                        component={BudgetSettingsScreen}
                        options={{title: 'Cài đặt ngân sách'}}
                      />
                      <Stack.Screen
                        name="Notifications"
                        component={NotificationsScreen}
                        options={{title: 'Thông báo'}}
                      />
                    </Stack.Navigator>
                  )}
                </NavigationContainer>
              </ImageBackground>
            </Animated.View>
            </React.Fragment>
          )}
        </BottomSheetModalProvider>
        <DialogContainer />
        <ToastContainer />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bg: {flex: 1},
});
