import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { sessionAPI } from '../../utils/api';
import { Colors } from '../../constants/colors';

export default function CallScreen() {
  const { id: agentId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { timer, needsPayment, incrementTimer, resetTimer } = useSessionStore();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const timerInterval = useRef<any>(null);
  const webRTCConnection = useRef<any>(null);
  
  useEffect(() => {
    initializeCall();
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      cleanup();
    };
  }, []);
  
  useEffect(() => {
    // Check if need payment at 10 minutes
    if (timer === 600 && !needsPayment) {
      Alert.alert(
        'Free Time Ending',
        'Your 10 minutes of free call is ending. Continue with payment?',
        [
          { text: 'End Call', onPress: handleEndCall },
          { text: 'Continue (₹100/20min)', onPress: () => router.push('/payment') },
        ]
      );
    }
  }, [timer]);
  
  const initializeCall = async () => {
    try {
      // Create session
      const response = await sessionAPI.start({
        agent_id: agentId as string,
        session_type: 'call',
      });
      
      const newSessionId = response.data._id;
      setSessionId(newSessionId);
      
      // Simulate connection (WebRTC would go here)
      setTimeout(() => {
        setCallStatus('connected');
        
        // Start timer
        timerInterval.current = setInterval(() => {
          incrementTimer();
        }, 1000);
      }, 2000);
    } catch (error) {
      console.error('Error initializing call:', error);
      Alert.alert('Error', 'Could not start call');
      router.back();
    }
  };
  
  const cleanup = () => {
    if (webRTCConnection.current) {
      webRTCConnection.current.close();
    }
  };
  
  const handleEndCall = async () => {
    if (!sessionId) return;
    
    try {
      await sessionAPI.end(sessionId, timer, 0);
      resetTimer();
      setCallStatus('ended');
      
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error ending call:', error);
      router.back();
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // WebRTC mute logic would go here
  };
  
  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
    // WebRTC speaker logic would go here
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={Colors.gradient.calm}
        style={styles.gradient}
      >
        {/* Status */}
        <View style={styles.statusContainer}>
          {callStatus === 'connecting' && (
            <>
              <Ionicons name="call-outline" size={48} color={Colors.white} />
              <Text style={styles.statusText}>Connecting...</Text>
            </>
          )}
          
          {callStatus === 'connected' && (
            <>
              <View style={styles.avatar}>
                <Ionicons name="person" size={64} color={Colors.white} />
              </View>
              <Text style={styles.name}>Listener</Text>
              <Text style={styles.statusText}>Voice Call</Text>
            </>
          )}
          
          {callStatus === 'ended' && (
            <>
              <Ionicons name="call-outline" size={48} color={Colors.white} />
              <Text style={styles.statusText}>Call Ended</Text>
            </>
          )}
        </View>
        
        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={[styles.timerBadge, timer >= 600 && styles.timerBadgeExpired]}>
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={timer >= 600 ? Colors.error : Colors.white} 
            />
            <Text style={[styles.timerText, timer >= 600 && styles.timerTextExpired]}>
              {formatTime(timer)}
            </Text>
            <Text style={[styles.timerLabel, timer >= 600 && styles.timerLabelExpired]}>
              {timer < 600 ? 'Free' : 'Paid'}
            </Text>
          </View>
        </View>
        
        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={28}
              color={Colors.white}
            />
            <Text style={styles.controlLabel}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}
          >
            <Ionicons name="call" size={32} color={Colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, isSpeaker && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons
              name={isSpeaker ? 'volume-high' : 'volume-medium'}
              size={28}
              color={Colors.white}
            />
            <Text style={styles.controlLabel}>
              {isSpeaker ? 'Speaker' : 'Earpiece'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
            <Text style={styles.infoText}>Encrypted Call</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="lock-closed" size={20} color={Colors.white} />
            <Text style={styles.infoText}>Private & Secure</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
    padding: 24,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  statusText: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  timerBadgeExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  timerTextExpired: {
    color: Colors.error,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.9,
  },
  timerLabelExpired: {
    color: Colors.error,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  controlButtonActive: {
    opacity: 0.6,
  },
  controlLabel: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
});