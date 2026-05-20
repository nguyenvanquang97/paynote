import {useEffect, useCallback} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import type {BankNotification} from '../shared/types';
import {NOTIFICATION_ACTION_EVENT, NOTIFICATION_EVENT} from '../shared/constants';
import type {NotificationAction} from '../services/notifications/notificationAction';
import {isNotificationAction} from '../services/notifications/notificationAction';

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
  NotificationBridge.showBudgetAlertNotification(title, message, null);
};

export const showBudgetAlertNotificationWithAction = (
  title: string,
  message: string,
  action: NotificationAction,
): void => {
  if (!NotificationBridge?.showBudgetAlertNotification) {return;}
  NotificationBridge.showBudgetAlertNotification(title, message, JSON.stringify(action));
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
  toneMode: 'advisor' | 'wallet_pet' | 'toxic_friend' | 'vietnamese_parent',
  allowStrongLanguage: boolean,
  intensity: 'soft' | 'normal' | 'sharp',
): void => {
  if (!NotificationBridge?.configurePeriodicRoast) {return;}
  NotificationBridge.configurePeriodicRoast(aiEnabled, apiKey, toneMode, allowStrongLanguage, intensity);
};

export const requestPostNotificationsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {return true;}
  if (Platform.Version < 33) {return true;}
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const subscribeNotificationAction = (
  onAction: (action: NotificationAction) => void,
): (() => void) => {
  const sub = emitter.addListener(NOTIFICATION_ACTION_EVENT, payload => {
    const rawAction = payload?.actionJson;
    if (typeof rawAction !== 'string' || rawAction.trim().length === 0) {
      return;
    }
    try {
      const parsed = JSON.parse(rawAction) as NotificationAction;
      if (isNotificationAction(parsed)) {
        onAction(parsed);
      }
    } catch {
      // ignore invalid native payload
    }
  });
  return () => sub.remove();
};

export const getInitialNotificationAction = (): Promise<NotificationAction | null> =>
  new Promise(resolve => {
    if (!NotificationBridge?.getInitialNotificationAction) {
      resolve(null);
      return;
    }
    NotificationBridge.getInitialNotificationAction((value: string) => {
      if (!value) {
        resolve(null);
        return;
      }
      try {
        const parsed = JSON.parse(value) as NotificationAction;
        resolve(isNotificationAction(parsed) ? parsed : null);
      } catch {
        resolve(null);
      }
    });
  });
