import React, {useState, useEffect, useCallback} from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar, ImageBackground, StyleSheet} from 'react-native';
import {createMMKV} from 'react-native-mmkv';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';

import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import TransactionsScreen from './src/screens/transactions/TransactionsScreen';
import ChartsScreen from './src/screens/charts/ChartsScreen';
import CategoriesScreen from './src/screens/categories/CategoriesScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import SplashScreen from './src/screens/splash/SplashScreen';
import BubbleTabBar from './src/shared/components/BubbleTabBar';
import {theme} from './src/shared/theme';
import {DialogContainer} from './src/shared/components/Dialog';
import {ToastContainer} from './src/shared/components/Toast';
import {useBankNotifications} from './src/native';
import {processNotification} from './src/modules/banking';
import {useAppStore} from './src/app/store';
import type {BankNotification} from './src/shared/types';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const storage = createMMKV();
const Tab = createBottomTabNavigator();

const C = {bg: theme.colors.appBg};
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    border: 'transparent',
  },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      tabBar={props => <BubbleTabBar {...props} />}
      screenOptions={{
        sceneStyle: {backgroundColor: 'transparent', paddingTop: insets.top + 8},
        headerShown: false,
        headerTransparent: true,
        headerStyle: {backgroundColor: 'transparent'},
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {fontWeight: '700', color: theme.colors.textPrimary},
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
  const loadTransactions = useAppStore(s => s.loadTransactions);
  const loadStats = useAppStore(s => s.loadStats);
  const loadCustomCategories = useAppStore(s => s.loadCustomCategories);
  const loadProfile = useAppStore(s => s.loadProfile);

  useEffect(() => {
    const boot = async () => {
      const startedAt = Date.now();
      loadCustomCategories();
      loadProfile();
      const hasOnboarded = storage.getBoolean('onboarded');
      setShowOnboarding(!hasOnboarded);

      const elapsed = Date.now() - startedAt;
      const minSplashMs = 2200;
      const remain = Math.max(0, minSplashMs - elapsed);
      setTimeout(() => setIsReady(true), remain);
    };

    boot();
  }, [loadCustomCategories, loadProfile]);

  useEffect(() => {
    if (!isReady || __DEV__) {return;}
    checkForUpdates(true);
  }, [isReady]);

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

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{flex: 1}}>
        <BottomSheetModalProvider>
          {!isReady ? (
            <SplashScreen />
          ) : (
            <React.Fragment>
              <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
              <ImageBackground
                source={require('./src/assets/images/app-bg.png')}
                resizeMode="cover"
                style={styles.bg}>
                <NavigationContainer theme={navTheme}>
                  {showOnboarding ? (
                    <OnboardingScreen onComplete={handleOnboardingComplete} />
                  ) : (
                    <MainTabs />
                  )}
                </NavigationContainer>
              </ImageBackground>
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
