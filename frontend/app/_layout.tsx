import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const { loadAuth } = useAuthStore();
  
  useEffect(() => {
    loadAuth();
  }, []);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="call/[id]" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="payment" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="mood/checkin" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});