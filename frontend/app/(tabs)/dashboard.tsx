import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agentAPI, sessionAPI } from '../../utils/api';
import { Colors } from '../../constants/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadDashboard();
  }, []);
  
  const loadDashboard = async () => {
    try {
      const response = await agentAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };
  
  const handleToggleAvailability = async () => {
    try {
      const response = await agentAPI.toggleAvailability();
      setDashboardData({
        ...dashboardData,
        is_available: response.data.is_available,
      });
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };
  
  const handleAcceptSession = async (sessionId: string) => {
    try {
      await sessionAPI.accept(sessionId);
      loadDashboard();
    } catch (error) {
      console.error('Error accepting session:', error);
    }
  };
  
  const handleRejectSession = async (sessionId: string) => {
    try {
      await sessionAPI.reject(sessionId);
      loadDashboard();
    } catch (error) {
      console.error('Error rejecting session:', error);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <View style={styles.headerContent}>
            <Text style={styles.title}>Agent Dashboard</Text>
            <Text style={styles.subtitle}>Manage your availability & sessions</Text>
          </View>
        </LinearGradient>
        
        {/* Availability Toggle */}
        <View style={styles.section}>
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityLeft}>
              <Ionicons 
                name={dashboardData?.is_available ? 'checkmark-circle' : 'close-circle'} 
                size={32} 
                color={dashboardData?.is_available ? Colors.success : Colors.error} 
              />
              <View style={styles.availabilityText}>
                <Text style={styles.availabilityTitle}>
                  {dashboardData?.is_available ? 'Available' : 'Unavailable'}
                </Text>
                <Text style={styles.availabilitySubtitle}>
                  {dashboardData?.is_available ? 'Users can connect with you' : 'No new requests'}
                </Text>
              </View>
            </View>
            <Switch
              value={dashboardData?.is_available || false}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
        
        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.statGradient}
              >
                <Ionicons name="cash" size={32} color={Colors.white} />
                <Text style={styles.statValue}>₹{dashboardData?.total_earnings || 0}</Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.statGradient}
              >
                <Ionicons name="trending-up" size={32} color={Colors.white} />
                <Text style={styles.statValue}>₹{dashboardData?.today_earnings || 0}</Text>
                <Text style={styles.statLabel}>Today's Earnings</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.statGradient}
              >
                <Ionicons name="people" size={32} color={Colors.white} />
                <Text style={styles.statValue}>{dashboardData?.total_sessions || 0}</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.statGradient}
              >
                <Ionicons name="star" size={32} color={Colors.white} />
                <Text style={styles.statValue}>{dashboardData?.rating?.toFixed(1) || '5.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </LinearGradient>
            </View>
          </View>
        </View>
        
        {/* Pending Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          {dashboardData?.pending_requests?.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="hourglass-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubtext}>New requests will appear here</Text>
            </View>
          ) : (
            dashboardData?.pending_requests?.map((request: any) => (
              <View key={request._id} style={styles.requestCard}>
                <View style={styles.requestLeft}>
                  <View style={styles.requestAvatar}>
                    <Ionicons name="person" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{request.user_name || 'Anonymous'}</Text>
                    <View style={styles.requestMeta}>
                      <Ionicons 
                        name={request.type === 'chat' ? 'chatbubbles' : 'call'} 
                        size={14} 
                        color={Colors.textSecondary} 
                      />
                      <Text style={styles.requestType}>
                        {request.type === 'chat' ? 'Chat Session' : 'Voice Call'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.rejectButton]}
                    onPress={() => handleRejectSession(request._id)}
                  >
                    <Ionicons name="close" size={20} color={Colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.acceptButton]}
                    onPress={() => handleAcceptSession(request._id)}
                  >
                    <Ionicons name="checkmark" size={20} color={Colors.success} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        
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
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headerContent: {
    gap: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  availabilityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  availabilityText: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  availabilitySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  statLabel: {
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
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestType: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  acceptButton: {
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
  },
});