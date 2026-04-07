import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moodAPI } from '../../utils/api';
import { Colors } from '../../constants/colors';

export default function MoodScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<number>(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [affirmation, setAffirmation] = useState('');
  
  const moodEmojis = [
    { score: 1, emoji: '😭', label: 'Terrible' },
    { score: 2, emoji: '😞', label: 'Bad' },
    { score: 3, emoji: '😕', label: 'Not Good' },
    { score: 4, emoji: '😐', label: 'Okay' },
    { score: 5, emoji: '🙂', label: 'Fine' },
    { score: 6, emoji: '😊', label: 'Good' },
    { score: 7, emoji: '😄', label: 'Great' },
    { score: 8, emoji: '😁', label: 'Excellent' },
    { score: 9, emoji: '🤩', label: 'Amazing' },
    { score: 10, emoji: '🥳', label: 'Perfect' },
  ];
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await moodAPI.checkin({
        mood_score: selectedMood,
        note: note,
      });
      
      setAffirmation(response.data.affirmation);
      Alert.alert('Mood Logged', 'Your emotional state has been recorded');
      setNote('');
    } catch (error) {
      Alert.alert('Error', 'Could not save mood entry');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <LinearGradient
          colors={Colors.gradient.warm}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>How are you feeling?</Text>
          <Text style={styles.headerSubtitle}>Track your emotional journey</Text>
        </LinearGradient>
        
        <View style={styles.content}>
          {/* Mood Selector */}
          <View style={styles.moodSelector}>
            <Text style={styles.sectionTitle}>Rate your mood</Text>
            <View style={styles.moodGrid}>
              {moodEmojis.map((mood) => (
                <TouchableOpacity
                  key={mood.score}
                  style={[
                    styles.moodItem,
                    selectedMood === mood.score && styles.moodItemSelected,
                  ]}
                  onPress={() => setSelectedMood(mood.score)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodScore}>{mood.score}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.moodLabel}>
              {moodEmojis.find(m => m.score === selectedMood)?.label}
            </Text>
          </View>
          
          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's on your mind?</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Share your thoughts (optional)..."
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {loading ? 'Saving...' : 'Log Mood'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Affirmation */}
          {affirmation && (
            <View style={styles.affirmationBox}>
              <View style={styles.affirmationHeader}>
                <Ionicons name="sparkles" size={20} color={Colors.primary} />
                <Text style={styles.affirmationTitle}>Your Personal Affirmation</Text>
              </View>
              <Text style={styles.affirmationText}>{affirmation}</Text>
            </View>
          )}
          
          {/* Mood History Link */}
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/mood/history')}
          >
            <Ionicons name="time" size={20} color={Colors.primary} />
            <Text style={styles.historyText}>View Mood History</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  content: {
    padding: 24,
  },
  moodSelector: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  moodItem: {
    width: '17%',
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  moodItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodScore: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  moodLabel: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  section: {
    marginBottom: 32,
  },
  noteInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  affirmationBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  affirmationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  affirmationText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});