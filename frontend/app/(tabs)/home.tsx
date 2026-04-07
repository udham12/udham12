import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { agentAPI, moodAPI } from '../../utils/api';
import { Colors } from '../../constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [affirmation, setAffirmation] = useState('');
  
  const isUser = user?.role === 'user';
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      if (isUser) {
        // Load available agents
        const agentsRes = await agentAPI.getAvailable(user?.gender_preference);
        setAgents(agentsRes.data);
        
        // Load daily affirmation
        try {
          const affRes = await moodAPI.getDailyAffirmation();
          setAffirmation(affRes.data.affirmation);
        } catch (error) {
          console.log('Could not load affirmation');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  const handleStartSession = (agentId: string, type: 'chat' | 'call') => {
    // Navigate to chat or call screen
    router.push(`/${type}/${agentId}`);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={Colors.gradient.calm}
          style={styles.header}
        >
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.tagline}>How can we support you today?</Text>
        </LinearGradient>
        
        {/* Daily Affirmation */}
        {affirmation && (
          <View style={styles.affirmationCard}>
            <View style={styles.affirmationHeader}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
              <Text style={styles.affirmationTitle}>Today's Affirmation</Text>
            </View>
            <Text style={styles.affirmationText}>{affirmation}</Text>
          </View>
        )}
        
        {/* SOS Quick Connect */}
        <TouchableOpacity style={styles.sosCard}>
          <LinearGradient
            colors={[Colors.error, '#DC2626']}
            style={styles.sosGradient}
          >
            <Ionicons name="alert-circle" size={32} color={Colors.white} />
            <View style={styles.sosContent}>
              <Text style={styles.sosTitle}>Need Immediate Support?</Text>
              <Text style={styles.sosSubtitle}>Tap for instant connection</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Talk to Someone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Talk to Someone</Text>
          <Text style={styles.sectionSubtitle}>
            Choose your preferred listener
          </Text>
          
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={styles.genderCard}
              onPress={() => {
                // Filter agents or start matching
              }}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.genderCardGradient}
              >
                <Ionicons name="male" size={40} color={Colors.white} />
                <Text style={styles.genderCardTitle}>Male Listener</Text>
                <Text style={styles.genderCardSubtitle}>
                  {agents.filter(a => a.gender === 'male').length} available
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.genderCard}
              onPress={() => {
                // Filter agents or start matching
              }}
            >
              <LinearGradient
                colors={['#EC4899', '#DB2777']}
                style={styles.genderCardGradient}
              >
                <Ionicons name="female" size={40} color={Colors.white} />
                <Text style={styles.genderCardTitle}>Female Listener</Text>
                <Text style={styles.genderCardSubtitle}>
                  {agents.filter(a => a.gender === 'female').length} available
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Available Listeners */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Now</Text>
          {agents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="moon" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No listeners available right now</Text>
              <Text style={styles.emptySubtext}>Please check back soon</Text>
            </View>
          ) : (
            agents.map((agent) => (
              <View key={agent.id} style={styles.agentCard}>
                <View style={styles.agentAvatar}>
                  {agent.avatar ? (
                    <Text>Avatar</Text>
                  ) : (
                    <Ionicons name="person" size={32} color={Colors.primary} />
                  )}
                </View>
                
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <View style={styles.agentMeta}>
                    <Ionicons name="star" size={14} color={Colors.warning} />
                    <Text style={styles.agentRating}>{agent.rating.toFixed(1)}</Text>
                    <Text style={styles.agentSessions}>
                      • {agent.total_sessions} sessions
                    </Text>
                  </View>
                  {agent.bio && (
                    <Text style={styles.agentBio} numberOfLines={2}>
                      {agent.bio}
                    </Text>
                  )}
                </View>
                
                <View style={styles.agentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStartSession(agent.user_id, 'chat')}
                  >
                    <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStartSession(agent.user_id, 'call')}
                  >
                    <Ionicons name="call" size={20} color={Colors.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* Mood Check-in CTA */}
        <TouchableOpacity
          style={styles.moodCTA}
          onPress={() => router.push('/mood/checkin')}
        >
          <LinearGradient
            colors={Colors.gradient.warm}
            style={styles.moodCTAGradient}
          >
            <Ionicons name="heart" size={28} color={Colors.white} />
            <View style={styles.moodCTAContent}>
              <Text style={styles.moodCTATitle}>How are you feeling?</Text>
              <Text style={styles.moodCTASubtitle}>Track your emotional journey</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  affirmationCard: {
    margin: 24,
    marginTop: -16,
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  affirmationText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  sosCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  sosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  sosContent: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  sosSubtitle: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  genderCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  genderCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  genderCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 12,
    marginBottom: 4,
  },
  genderCardSubtitle: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  agentCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  agentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  agentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  agentRating: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  agentSessions: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  agentBio: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  agentActions: {
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodCTA: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  moodCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  moodCTAContent: {
    flex: 1,
  },
  moodCTATitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  moodCTASubtitle: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
});