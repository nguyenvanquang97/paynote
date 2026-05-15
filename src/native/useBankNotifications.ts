import {useEffect, useCallback} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import type {BankNotification} from '../shared/types';
import {NOTIFICATION_EVENT} from '../shared/constants';

const {NotificationBridge} = NativeModules;

const emitter = new NativeEventEmitter(NotificationBridge);

export const useBankNotifications = (
  onNotification: (notification: BankNotification) => void,
) => {
  const handleNotification = useCallback(
    (data: BankNotification) => {
      onNotification(data);
    },
    [onNotification],
  );

  useEffect(() => {
    const sub = emitter.addListener(
      NOTIFICATION_EVENT,
      handleNotification,
    );

    return () => sub.remove();
  }, [handleNotification]);
};

export const checkNotificationAccess = (): Promise<boolean> => {
  return new Promise(resolve => {
    NotificationBridge.isNotificationAccessGranted((isGranted: boolean) => {
      resolve(isGranted);
    });
  });
};

export const openNotificationSettings = (): void => {
  NotificationBridge.openNotificationSettings();
};

export const openBatteryOptimizationSettings = (): void => {
  NotificationBridge.openBatteryOptimizationSettings();
};

export const checkBatteryOptimizationDisabled = (): Promise<boolean> => {
  return new Promise(resolve => {
    NotificationBridge.isBatteryOptimizationDisabled((isDisabled: boolean) => {
      resolve(isDisabled);
    });
  });
};

export const showBudgetAlertNotification = (title: string, message: string): void => {
  if (!NotificationBridge?.showBudgetAlertNotification) {return;}
  NotificationBridge.showBudgetAlertNotification(title, message);
};

export const startPeriodicRoastReminder = (): void => {
  if (!NotificationBridge?.startPeriodicRoastReminder) {return;}
  NotificationBridge.startPeriodicRoastReminder();
};

export const stopPeriodicRoastReminder = (): void => {
  if (!NotificationBridge?.stopPeriodicRoastReminder) {return;}
  NotificationBridge.stopPeriodicRoastReminder();
};

export const triggerPeriodicRoastReminderNow = (): void => {
  if (!NotificationBridge?.triggerPeriodicRoastReminderNow) {return;}
  NotificationBridge.triggerPeriodicRoastReminderNow();
};

export const configurePeriodicRoast = (
  aiEnabled: boolean,
  apiKey: string,
  toneMode: 'gentle' | 'cute' | 'sarcastic_strong' | 'angry',
): void => {
  if (!NotificationBridge?.configurePeriodicRoast) {return;}
  NotificationBridge.configurePeriodicRoast(aiEnabled, apiKey, toneMode);
};

export const requestPostNotificationsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {return true;}
  if (Platform.Version < 33) {return true;}
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};
