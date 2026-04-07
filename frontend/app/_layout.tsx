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
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="call/[id]" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="mood/checkin" />
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