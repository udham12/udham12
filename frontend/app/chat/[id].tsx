import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { socketService } from '../../utils/socket';
import { sessionAPI } from '../../utils/api';
import { Colors } from '../../constants/colors';

export default function ChatScreen() {
  const { id: agentId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeSession, timer, needsPayment, incrementTimer, resetTimer } = useSessionStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const timerInterval = useRef<any>(null);
  
  useEffect(() => {
    initializeChat();
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (sessionId) {
        socketService.leaveSession(sessionId);
      }
    };
  }, []);
  
  useEffect(() => {
    if (sessionId) {
      // Start timer
      timerInterval.current = setInterval(() => {
        incrementTimer();
      }, 1000);
      
      // Setup socket listeners
      socketService.onMessage((message) => {
        setMessages(prev => [...prev, message]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      });
      
      socketService.onUserTyping((data) => {
        if (data.user_id !== user?.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 2000);
        }
      });
    }
    
    return () => {
      socketService.offMessage();
      socketService.offUserTyping();
    };
  }, [sessionId]);
  
  useEffect(() => {
    // Check if need payment at 5 minutes
    if (timer === 300 && !needsPayment) {
      Alert.alert(
        'Free Time Ending',
        'Your 5 minutes of free chat is ending. Continue with payment?',
        [
          { text: 'End Session', onPress: handleEndSession },
          { text: 'Continue (₹50/20min)', onPress: () => router.push('/payment') },
        ]
      );
    }
  }, [timer]);
  
  const initializeChat = async () => {
    try {
      // Connect to socket
      socketService.connect();
      
      // Create session
      const response = await sessionAPI.start({
        agent_id: agentId as string,
        session_type: 'chat',
      });
      
      const newSessionId = response.data._id;
      setSessionId(newSessionId);
      
      // Join socket room
      socketService.joinSession(newSessionId, user?.id || '');
      
      // Add welcome message
      setMessages([{
        _id: 'welcome',
        sender_id: 'system',
        content: 'Chat session started. Your listener will join shortly.',
        timestamp: new Date().toISOString(),
        type: 'system',
      }]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Could not start chat session');
    }
  };
  
  const handleSendMessage = () => {
    if (!inputText.trim() || !sessionId) return;
    
    if (needsPayment) {
      Alert.alert('Payment Required', 'Please complete payment to continue chatting');
      return;
    }
    
    socketService.sendMessage(sessionId, user?.id || '', inputText.trim());
    setInputText('');
  };
  
  const handleTyping = () => {
    if (sessionId) {
      socketService.sendTyping(sessionId, user?.id || '');
    }
  };
  
  const handleEndSession = async () => {
    if (!sessionId) return;
    
    try {
      await sessionAPI.end(sessionId, timer, 0);
      resetTimer();
      socketService.disconnect();
      router.back();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat Session</Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={14} color={timer >= 300 ? Colors.error : Colors.success} />
            <Text style={[styles.timerText, timer >= 300 && styles.timerExpired]}>
              {formatTime(timer)} {timer < 300 ? '(Free)' : '(Paid)'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={handleEndSession} style={styles.endButton}>
          <Ionicons name="call-outline" size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>
      
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message._id}
            style={[
              styles.messageRow,
              message.sender_id === user?.id && styles.messageRowSent,
              message.type === 'system' && styles.messageRowSystem,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.sender_id === user?.id && styles.messageBubbleSent,
                message.type === 'system' && styles.messageBubbleSystem,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.sender_id === user?.id && styles.messageTextSent,
                  message.type === 'system' && styles.messageTextSystem,
                ]}
              >
                {message.content}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.sender_id === user?.id && styles.messageTimeSent,
                ]}
              >
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
        
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Listener is typing...</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              handleTyping();
            }}
            multiline
            maxLength={500}
            editable={!needsPayment}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || needsPayment) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || needsPayment}
          >
            <Ionicons name="send" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  timerExpired: {
    color: Colors.error,
  },
  endButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageRowSent: {
    justifyContent: 'flex-end',
  },
  messageRowSystem: {
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBubbleSent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  messageBubbleSystem: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  messageTextSent: {
    color: Colors.white,
  },
  messageTextSystem: {
    fontSize: 13,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  messageTimeSent: {
    color: Colors.white,
    opacity: 0.8,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});