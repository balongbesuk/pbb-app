import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { navigationRef } from './navigationRef';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (Platform.OS !== 'web' && !isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();

  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'web') {
      console.log('Push notifications on web requires vapidPublicKey. Skipping for now.');
      return undefined;
    }

    if (isExpoGo && Platform.OS === 'android') {
      console.log('Push notifications are not supported in Expo Go on Android (SDK 53+). Skipping.');
      return undefined;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
      } catch (e) {
        try {
          token = await Notifications.getExpoPushTokenAsync({
            projectId: '70796467-cde3-42b9-823e-1b561f801523', // Fallback to your actual project ID
          });
        } catch (innerError) {
          console.warn('⚠️ Push notifications could not be initialized (Expo token request failed):', innerError);
          return undefined;
        }
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  useEffect(() => {
    if (Platform.OS === 'web' || (isExpoGo && Platform.OS === 'android')) {
      return;
    }

    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification tapped:', response);
        
        try {
          const data = response.notification.request.content.data;
          if (data && data.screen) {
            if (navigationRef.isReady()) {
              navigationRef.navigate(data.screen as any, data.params);
              console.log(`🚀 Navigated directly to ${data.screen} via push notification tap`);
            } else {
              console.warn('⚠️ Navigation is not ready to handle notification tap');
            }
          }
        } catch (err) {
          console.error('Failed to handle notification tap navigation:', err);
        }
      });
    } catch (e) {
      console.log('Error adding notification listeners', e);
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return { expoPushToken, notification };
};
