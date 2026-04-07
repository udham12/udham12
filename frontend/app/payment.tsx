import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../store/sessionStore';
import { paymentAPI } from '../utils/api';
import { Colors } from '../constants/colors';

export default function PaymentScreen() {
  const router = useRouter();
  const { activeSession, setNeedsPayment } = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const amount = activeSession?.type === 'chat' ? 50 : 100;
  const duration = 20; // minutes
  
  const handlePayment = async () => {
    if (!activeSession) {
      Alert.alert('Error', 'No active session found');
      return;
    }
    
    setLoading(true);
    
    try {
      // Initiate payment
      const response = await paymentAPI.initiate({
        session_id: activeSession._id,
        amount: amount,
      });
      
      const paymentId = response.data._id;
      
      // Simulate payment processing
      setTimeout(async () => {
        try {
          // Verify payment (mock - always succeeds)
          await paymentAPI.verify(paymentId);
          
          setPaymentSuccess(true);
          setNeedsPayment(false);
          
          setTimeout(() => {
            router.back();
          }, 2000);
        } catch (error) {
          Alert.alert('Error', 'Payment verification failed');
        }
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };
  
  if (paymentSuccess) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={Colors.gradient.success}
          style={styles.successContainer}
        >
          <Ionicons name="checkmark-circle" size={80} color={Colors.white} />
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Continue your session</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <View style={styles.content}>
        {/* Payment Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session Type</Text>
            <Text style={styles.infoValue}>
              {activeSession?.type === 'chat' ? 'Chat Session' : 'Voice Call'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{duration} minutes</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.amountValue}>₹{amount}</Text>
          </View>
        </View>
        
        {/* UPI Mock */}
        <View style={styles.upiCard}>
          <View style={styles.upiHeader}>
            <Ionicons name="wallet" size={32} color={Colors.primary} />
            <Text style={styles.upiTitle}>UPI Payment</Text>
          </View>
          
          <View style={styles.upiInfo}>
            <View style={styles.upiRow}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.upiText}>Secure Payment Gateway</Text>
            </View>
            <View style={styles.upiRow}>
              <Ionicons name="lock-closed" size={20} color={Colors.success} />
              <Text style={styles.upiText}>256-bit Encryption</Text>
            </View>
            <View style={styles.upiRow}>
              <Ionicons name="flash" size={20} color={Colors.success} />
              <Text style={styles.upiText}>Instant Confirmation</Text>
            </View>
          </View>
          
          <View style={styles.mockNote}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.mockNoteText}>
              This is a mock payment. In production, integrate Razorpay for real UPI payments.
            </Text>
          </View>
        </View>
        
        {/* Payment Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          <LinearGradient
            colors={Colors.gradient.primary}
            style={styles.payButtonGradient}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.payButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="card" size={24} color={Colors.white} />
                <Text style={styles.payButtonText}>Pay ₹{amount} via UPI</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel & End Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  upiCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  upiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  upiInfo: {
    gap: 12,
    marginBottom: 16,
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upiText: {
    fontSize: 14,
    color: Colors.text,
  },
  mockNote: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  mockNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.info,
    lineHeight: 16,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
});