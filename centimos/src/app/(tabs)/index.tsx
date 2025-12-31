import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Keyboard } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { getLatestExchangeRate, getUserProfile } from '@/services/api';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

// Import our new Lego blocks
import { ExchangeRateCard } from '@/components/home/ExchangeRateCard';
import { ScannerAction } from '@/components/home/ScannerAction';
import { CameraModal } from '@/components/scanner/CameraModal';
import { getProduct } from '@/services/api'; // Import the new service
import { ProductSheet } from '@/components/scanner/ProductSheet'; // Import the new sheet
import { ProfileSheet } from '@/components/home/ProfileSheet';
import { validateGtin } from '@/services/validate';

export default function HomeScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const cardColor = useThemeColor({}, 'surfaceLight'); // Needed for the quick action buttons
  const primaryColor = useThemeColor({}, 'primary');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  // State
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<{full_name?: string; username: string; email: string} | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);

  // Camera State
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // NEW STATE FOR PRODUCT SHEET
  const [scannedProduct, setScannedProduct] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const fetchData = async () => {
    // We can run these in parallel for speed
    const [rateData, userData] = await Promise.all([
      getLatestExchangeRate(),
      getUserProfile()
    ]);

    if (rateData) setRate(rateData);
    if (userData) setUser(userData);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    setProfileVisible(false);
    try {
      await logout(); // This will clear tokens and update auth state
      // The _layout.tsx will automatically redirect to welcome screen
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "There was an issue logging out. Please try again.");
    }
  };

  const handleStartScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission Required", "Camera access is needed to scan products.");
        return;
      }
    }
    setIsScanning(true);
  };

  // --- REUSABLE SEARCH FUNCTION ---
  const performSearch = async (barcode: string) => {
    if (!barcode) return;

    // Check if the input looks like a barcode (8 or more digits, starting with a digit)
    const isBarcode = /^\d{8,}$/.test(barcode);

    // Only validate GTIN if it looks like a barcode
    if (isBarcode && !validateGtin(barcode)) {
      // Show error to user
      Alert.alert("Invalid Barcode", "Please enter a valid barcode with correct format and check digit.");
      setIsSearching(false);
      return;
    }

    // 1. Reset UI
    Keyboard.dismiss(); // Hide keyboard if open
    setSheetVisible(true);
    setIsSearching(true);
    setLastScannedCode(barcode);
    setScannedProduct(null);

    // 2. API Call
    try {
      console.log("Searching for:", barcode);
      const product = await getProduct(barcode);
      setScannedProduct(product);
    } catch (error: any) {
      console.error("Search failed", error);
      // Handle specific error cases if needed
      if (error.response?.status === 500) {
        // For server errors, we still want to show the sheet but with error info
        // The ProductSheet component should handle null product appropriately
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handler 1: Camera
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setIsScanning(false);
    performSearch(data);
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
    setScannedProduct(null);
  };

  // Handler 2: Manual Input
  const handleManualSubmit = () => {
    performSearch(searchQuery);
  };

  const handleRescan = () => {
    setSheetVisible(false);
    setTimeout(() => setIsScanning(true), 300); // Small delay for smooth transition
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: color, paddingTop: insets.top }]}>
      
      {/* 1. Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.appName, { color: primaryColor }]}>Céntimos</Text>
          <Text style={[styles.greeting, { color: subTextColor }]}>Smart Shopping</Text>
        </View>

        {/* CLICKABLE PROFILE BUTTON */}
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: cardColor }]}
          onPress={() => setProfileVisible(true)} // <--- Opens the sheet
        >
           {/* Show initial if user loaded, else show icon */}
           {user?.full_name || user?.username ? (
             <Text style={{fontWeight: 'bold', color: primaryColor}}>
               {(user.full_name || user.username)?.charAt(0)}
             </Text>
           ) : (
             <FontAwesome5 name="user" size={16} color={textColor} />
           )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 2. Components */}
        <ExchangeRateCard rate={rate} loading={loading} />

        {/* UPDATED COMPONENT */}
        <ScannerAction
          onScanPress={handleStartScanning}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleManualSubmit} // <--- Connected!
        />

        {/* 3. Quick Actions (We can modularize this later if it grows) */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>My Shopping</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: cardColor }]}>
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
               <MaterialIcons name="playlist-add" size={28} color="#1976D2" />
            </View>
            <Text style={[styles.actionTitle, { color: textColor }]}>New List</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: cardColor }]}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
               <MaterialIcons name="storefront" size={28} color="#7B1FA2" />
            </View>
            <Text style={[styles.actionTitle, { color: textColor }]}>Add Store</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 4. The Hidden Camera Modal */}
      <CameraModal
        visible={isScanning}
        onClose={() => setIsScanning(false)}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* ADD THIS AT THE BOTTOM */}
      <ProductSheet
        visible={sheetVisible}
        loading={isSearching}
        product={scannedProduct}
        barcode={lastScannedCode}
        onClose={handleCloseSheet}
        onRescan={handleRescan}
      />

      {/* ADD PROFILE SHEET HERE */}
      <ProfileSheet
        visible={profileVisible}
        user={user}
        onClose={() => setProfileVisible(false)}
        onLogout={handleLogout}
      />

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
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
});