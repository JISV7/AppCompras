import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ActivityIndicator, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';

interface Product {
  barcode: string;
  name: string;
  brand?: string;
  image_url?: string;
  data_source: string;
}

interface ProductSheetProps {
  visible: boolean;
  loading: boolean;
  product: Product | null;
  barcode: string | null;
  onClose: () => void;
  onRescan: () => void;
}

export function ProductSheet({ visible, loading, product, barcode, onClose, onRescan }: ProductSheetProps) {
  const router = useRouter();
  // We use 'background' instead of 'surface' to ensure it's solid and opaque
  const sheetColor = useThemeColor({}, 'background'); 
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true}
      onRequestClose={onClose} // Android hardware back button
    >
      {/* 1. The Overlay (Dark Background) - Tapping here closes the sheet */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlayWrapper}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          
          {/* 2. The Sheet (Solid Panel) - We stop propagation here so tapping the sheet doesn't close it */}
          <Pressable 
            style={[styles.sheet, { backgroundColor: sheetColor }]} 
            onPress={(e) => e.stopPropagation()}
          >
            
            {/* Grey Handle Bar */}
            <View style={styles.handle} />
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>
                {loading ? "Searching..." : product ? "Product Found" : "Unknown Product"}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close-circle" size={30} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              
              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color={primaryColor} />
                  <Text style={{ color: subTextColor, marginTop: 15 }}>Looking up price history...</Text>
                </View>
              ) : product ? (
                // CASE A: PRODUCT EXISTS
                <>
                  <View style={styles.productRow}>
                    {product.image_url ? (
                      <Image source={{ uri: product.image_url }} style={styles.image} />
                    ) : (
                      <View style={[styles.imagePlaceholder, { backgroundColor: '#f0f0f0' }]}>
                        <FontAwesome5 name="box-open" size={40} color="#ccc" />
                      </View>
                    )}
                    
                    <View style={styles.info}>
                      <Text style={[styles.productName, { color: textColor }]}>{product.name}</Text>
                      <Text style={[styles.brand, { color: subTextColor }]}>{product.brand || "Unknown Brand"}</Text>
                      <View style={styles.badge}>
                          <Text style={styles.badgeText}>{product.data_source}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionGrid}>
                      <TouchableOpacity style={[styles.bigButton, { backgroundColor: primaryColor }]}>
                          <FontAwesome5 name="tag" size={16} color="white" />
                          <Text style={styles.bigButtonText}>Log Price</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={[styles.bigButton, { backgroundColor: subTextColor }]}>
                          <MaterialIcons name="playlist-add" size={24} color="white" />
                          <Text style={styles.bigButtonText}>Add to List</Text>
                      </TouchableOpacity>
                  </View>
                </>
              ) : (
                // CASE B: UNKNOWN PRODUCT
                <View style={styles.centerBox}>
                  <View style={styles.unknownIconCircle}>
                    <FontAwesome5 name="question" size={40} color={subTextColor} />
                  </View>
                  
                  <Text style={[styles.notFoundTitle, { color: textColor }]}>
                    New Discovery!
                  </Text>
                  
                  <Text style={[styles.notFoundText, { color: subTextColor }]}>
                    We don't have this product in our database yet.
                  </Text>
                  
                  <View style={styles.barcodeBox}>
                    <Ionicons name="barcode-outline" size={20} color={subTextColor} />
                    <Text style={{ color: subTextColor, fontFamily: 'monospace' }}> {barcode} </Text>
                  </View>
                  
                  <TouchableOpacity style={[styles.createButton, { backgroundColor: primaryColor }]}
                  onPress={() => {
                    onClose(); // 1. Close the sheet
                    router.push({
                      pathname: "/product/create", // 2. Navigate to new screen
                      params: { barcode: barcode }  // 3. Pass the barcode
                    });
                  }}
                  >
                    <Text style={styles.createButtonText}>Create Product</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Footer: Scan Again */}
            {!loading && (
              <TouchableOpacity style={styles.rescanButton} onPress={onRescan}>
                 <Text style={{ color: primaryColor, fontWeight: '600' }}>Tap to Scan Another</Text>
              </TouchableOpacity>
            )}

          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrapper: {
    flex: 1,
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'transparent', // This creates the dark transparent background rgba(0,0,0,0.5)
    justifyContent: 'flex-end',
  },
  sheet: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    minHeight: 450, 
    paddingBottom: 40,
    // Shadow for elevation feeling
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  handle: { 
    width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, 
    alignSelf: 'center', marginBottom: 20 
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  
  content: { flex: 1 },
  centerBox: { alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  
  // Product Row
  productRow: { flexDirection: 'row', marginBottom: 25 },
  image: { width: 90, height: 90, borderRadius: 12, backgroundColor: 'white', resizeMode: 'contain' },
  imagePlaceholder: { width: 90, height: 90, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  productName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  brand: { fontSize: 14, marginBottom: 8 },
  badge: { backgroundColor: '#E3F2FD', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, color: '#1565C0', fontWeight: 'bold' },

  // Buttons
  actionGrid: { flexDirection: 'row', gap: 12, marginTop: 10 },
  bigButton: { 
    flex: 1, flexDirection: 'row', height: 54, borderRadius: 16, 
    alignItems: 'center', justifyContent: 'center', gap: 8 
  },
  bigButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  
  // Unknown Product Styles
  unknownIconCircle: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', 
    alignItems: 'center', justifyContent: 'center', marginBottom: 15 
  },
  notFoundTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  notFoundText: { textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  barcodeBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 25 
  },
  createButton: { 
    width: '100%', height: 54, borderRadius: 16, 
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  createButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  rescanButton: { alignItems: 'center', marginTop: 25, padding: 10 }
});