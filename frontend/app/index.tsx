import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      }
    }
  }, [isAuthenticated, isLoading]);
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  
  return (
    <LinearGradient
      colors={Colors.gradient.calm}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>💜</Text>
        <Text style={styles.title}>HeartEase</Text>
        <Text style={styles.subtitle}>You're Not Alone</Text>
        <ActivityIndicator size="large" color={Colors.white} style={styles.loader} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.white,
    opacity: 0.9,
  },
  loader: {
    marginTop: 40,
  },
});