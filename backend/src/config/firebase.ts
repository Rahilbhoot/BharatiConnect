import { Expo } from 'expo-server-sdk';
import { env } from './env';

export const expo = new Expo({
  accessToken:
    env.EXPO_ACCESS_TOKEN && env.EXPO_ACCESS_TOKEN !== 'your_expo_access_token'
      ? env.EXPO_ACCESS_TOKEN
      : undefined,
});
