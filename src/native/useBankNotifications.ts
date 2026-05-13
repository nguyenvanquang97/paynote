import {useEffect, useCallback} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
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
