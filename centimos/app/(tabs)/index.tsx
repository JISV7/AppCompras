import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { getLatestExchangeRate } from '@/services/api';
import { useRouter } from 'expo-router';

interface ExchangeRate {
  currency_code: string;
  rate_to_ves: string;
  source: string;
  recorded_at: string;
}

export default function HomeScreen() {
  const color = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    const data = await getLatestExchangeRate();
    if (data) setRate(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-VE', { 
      hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' 
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: color, paddingTop: insets.top }]}>
      
      {/* 1. Header (Minimal) */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.appName, { color: primaryColor }]}>Céntimos</Text>
          <Text style={[styles.greeting, { color: subTextColor }]}>Smart Shopping</Text>
        </View>
        <TouchableOpacity style={[styles.profileButton, { backgroundColor: cardColor }]}>
           <FontAwesome5 name="user" size={16} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* 2. Exchange Rate (The "Financial Weather") */}
        <View style={[styles.rateCard, { backgroundColor: cardColor }]}>
          <View style={styles.rateHeader}>
            <View style={styles.rateIcon}>
               <FontAwesome5 name="money-bill-wave" size={14} color="white" />
            </View>
            <Text style={[styles.rateLabel, { color: subTextColor }]}>Tasa BCV</Text>
            {rate && <View style={styles.sourceBadge}>
               <Text style={styles.sourceText}>{rate.source}</Text>
            </View>}
          </View>
          
          {loading ? (
             <ActivityIndicator color={primaryColor} style={{alignSelf: 'flex-start', marginTop: 10}}/>
          ) : (
            <View style={styles.rateContent}>
              <Text style={[styles.rateValue, { color: textColor }]}>
                {rate ? parseFloat(rate.rate_to_ves).toFixed(2) : "0.00"} 
                <Text style={{ fontSize: 20, fontWeight: 'normal' }}> Bs</Text>
              </Text>
              <Text style={[styles.rateDate, { color: subTextColor }]}>
                 {rate ? formatDate(rate.recorded_at) : "No data"}
              </Text>
            </View>
          )}
        </View>

        {/* 3. The "Scanner Hub" (Inspired by OFF, optimized for performance) */}
        <View style={styles.scannerContainer}>
          
          {/* A. The "Big Button" Scanner */}
          <TouchableOpacity 
            style={styles.scannerButton}
            activeOpacity={0.8}
            onPress={() => console.log("Open Scanner Camera")} // We will link this later
          >
            <View style={styles.scannerVisual}>
               <Ionicons name="scan-outline" size={60} color="white" />
               <Text style={styles.scannerText}>Tap to Scan Product</Text>
            </View>
          </TouchableOpacity>

          {/* B. The Search Bar (Attached to bottom of scanner) */}
          <View style={[styles.searchContainer, { backgroundColor: cardColor }]}>
            <Ionicons name="search" size={20} color={subTextColor} style={styles.searchIcon} />
            <TextInput 
               style={[styles.searchInput, { color: textColor }]}
               placeholder="Or search by name/barcode..."
               placeholderTextColor={subTextColor}
               value={searchQuery}
               onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* 4. Quick Actions / Lists */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>My Shopping</Text>
        
        <View style={styles.grid}>
          {/* Create List */}
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: cardColor }]}>
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
               <MaterialIcons name="playlist-add" size={28} color="#1976D2" />
            </View>
            <Text style={[styles.actionTitle, { color: textColor }]}>New List</Text>
            <Text style={[styles.actionSubtitle, { color: subTextColor }]}>Plan your budget</Text>
          </TouchableOpacity>

          {/* Add Store (Future) */}
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: cardColor }]}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
               <MaterialIcons name="storefront" size={28} color="#7B1FA2" />
            </View>
            <Text style={[styles.actionTitle, { color: textColor }]}>Add Store</Text>
            <Text style={[styles.actionSubtitle, { color: subTextColor }]}>Register location</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  
  // Header
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingBottom: 15 
  },
  appName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  greeting: { fontSize: 13 },
  profileButton: { 
    width: 40, height: 40, borderRadius: 20, 
    alignItems: 'center', justifyContent: 'center' 
  },

  // Exchange Rate Card (Compact)
  rateCard: {
    padding: 16, borderRadius: 16, marginBottom: 25,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  rateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rateIcon: { 
    backgroundColor: '#388E3C', borderRadius: 6, width: 20, height: 20, 
    alignItems: 'center', justifyContent: 'center', marginRight: 8 
  },
  rateLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  sourceBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sourceText: { color: '#2E7D32', fontSize: 10, fontWeight: 'bold' },
  rateContent: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rateValue: { fontSize: 32, fontWeight: 'bold' },
  rateDate: { fontSize: 12 },

  // Scanner Hub (The "OFF" inspired part)
  scannerContainer: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 30,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, elevation: 4,
  },
  scannerButton: {
    backgroundColor: '#263238', // Dark background like camera view
    height: 180,
    alignItems: 'center', justifyContent: 'center',
  },
  scannerVisual: { alignItems: 'center', opacity: 0.9 },
  scannerText: { color: 'white', marginTop: 10, fontWeight: '600', fontSize: 16 },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, height: 40 },

  // Grid
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', gap: 15 },
  actionCard: {
    flex: 1, padding: 15, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  actionIcon: {
    width: 45, height: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10
  },
  actionTitle: { fontWeight: 'bold', fontSize: 15 },
  actionSubtitle: { fontSize: 11, marginTop: 2 },
});