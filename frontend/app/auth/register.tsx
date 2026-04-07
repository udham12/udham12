import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'female',
    role: 'user',
    gender_preference: 'female',
  });
  const [loading, setLoading] = useState(false);
  
  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      const { access_token, user } = response.data;
      
      await setToken(access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      setUser(user);
      
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.detail || 'Please try again');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={Colors.gradient.calm}
          style={styles.header}
        >
          <Text style={styles.logo}>💜</Text>
          <Text style={styles.title}>Join HeartEase</Text>
          <Text style={styles.subtitle}>Start your healing journey today</Text>
        </LinearGradient>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={Colors.textMuted}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!loading}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              editable={!loading}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+1234567890"
              placeholderTextColor={Colors.textMuted}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>I am *</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.option, formData.gender === 'male' && styles.optionSelected]}
                onPress={() => setFormData({ ...formData, gender: 'male' })}
              >
                <Text style={[styles.optionText, formData.gender === 'male' && styles.optionTextSelected]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, formData.gender === 'female' && styles.optionSelected]}
                onPress={() => setFormData({ ...formData, gender: 'female' })}
              >
                <Text style={[styles.optionText, formData.gender === 'female' && styles.optionTextSelected]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>I want to *</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.option, formData.role === 'user' && styles.optionSelected]}
                onPress={() => setFormData({ ...formData, role: 'user' })}
              >
                <Text style={[styles.optionText, formData.role === 'user' && styles.optionTextSelected]}>Seek Support</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, formData.role === 'agent' && styles.optionSelected]}
                onPress={() => setFormData({ ...formData, role: 'agent' })}
              >
                <Text style={[styles.optionText, formData.role === 'agent' && styles.optionTextSelected]}>Be a Listener</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {formData.role === 'user' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prefer to talk to *</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.option, formData.gender_preference === 'male' && styles.optionSelected]}
                  onPress={() => setFormData({ ...formData, gender_preference: 'male' })}
                >
                  <Text style={[styles.optionText, formData.gender_preference === 'male' && styles.optionTextSelected]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, formData.gender_preference === 'female' && styles.optionSelected]}
                  onPress={() => setFormData({ ...formData, gender_preference: 'female' })}
                >
                  <Text style={[styles.optionText, formData.gender_preference === 'female' && styles.optionTextSelected]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 50,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  optionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  link: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});