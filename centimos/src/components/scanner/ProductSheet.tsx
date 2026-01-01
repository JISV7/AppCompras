import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ActivityIndicator, Pressable, Platform, KeyboardAvoidingView, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StoreSelectorModal } from '../stores/StoreSelectorModal';
import { reportPrice, Product } from '@/services/api';

interface ProductSheetProps {
  visible: boolean;
  loading: boolean;
  product: Product | null;
  barcode: string | null;
  mode?: 'search' | 'log';
  onClose: () => void;
  onRescan: () => void;
  onAddToList?: (product: Product) => void;
}

export function ProductSheet({ visible, loading, product, barcode, mode = 'search', onClose, onRescan, onAddToList }: ProductSheetProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sheetColor = useThemeColor({}, 'background'); 
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'surfaceLight');

  // View state: 'info' or 'reporting'
  const [currentView, setCurrentView] = useState<'info' | 'reporting'>('info');
  
  // Reporting state
  const [price, setPrice] = useState('');
  const [selectedStore, setSelectedStore] = useState<{store_id: string, name: string} | null>(null);
  const [storeSelectorVisible, setStoreSelectorVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentView(mode === 'log' ? 'reporting' : 'info');
      setPrice('');
      setSelectedStore(null);
    }
  }, [visible, mode]);

  const handleReportPrice = async () => {
    if (!product || !selectedStore || !price) {
      Alert.alert("Faltan datos", "Por favor ingresa el precio y selecciona una tienda.");
      return;
    }

    setIsSubmitting(true);
    try {
      await reportPrice(product.barcode, selectedStore.store_id, parseFloat(price));
      Alert.alert("Éxito", "Precio reportado correctamente.");
      onClose();
    } catch (e) {
      Alert.alert("Error", "No se pudo reportar el precio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInfoView = () => (
    <>
      <View style={styles.productRow}>
        {product?.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: '#f0f0f0' }]}>
            <FontAwesome5 name="box-open" size={40} color="#ccc" />
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={[styles.productName, { color: textColor }]}>{product?.name}</Text>
          <Text style={[styles.brand, { color: subTextColor }]}>{product?.brand || "Unknown Brand"}</Text>
          <View style={styles.badge}>
              <Text style={styles.badgeText}>{product?.data_source}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionGrid}>
          {/* We only show Add to List here to keep the modes distinct as requested */}
          <TouchableOpacity 
            style={[styles.bigButton, { backgroundColor: primaryColor, flex: 1 }]}
            onPress={() => product && onAddToList?.(product)}
          >
              <MaterialIcons name="playlist-add" size={24} color="white" />
              <Text style={styles.bigButtonText}>Agregar a la Lista</Text>
          </TouchableOpacity>
      </View>
    </>
  );

  const renderReportingView = () => (
    <View style={styles.reportingContainer}>
      <View style={styles.miniProductRow}>
         <Text style={[styles.miniProductName, { color: textColor }]}>{product?.name}</Text>
         <Text style={{ color: subTextColor, fontSize: 12 }}>{product?.barcode}</Text>
      </View>

      <Text style={[styles.label, { color: subTextColor }]}>Precio en tienda ($)</Text>
      <View style={[styles.priceInputWrapper, { backgroundColor: cardColor }]}>
          <FontAwesome5 name="tag" size={18} color={primaryColor} />
          <TextInput
            style={[styles.priceInput, { color: textColor }]}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#999"
            autoFocus
          />
      </View>

      <Text style={[styles.label, { color: subTextColor, marginTop: 20 }]}>Tienda</Text>
      <TouchableOpacity 
        style={[styles.storeSelector, { backgroundColor: cardColor }]}
        onPress={() => setStoreSelectorVisible(true)}
      >
          <MaterialIcons name="storefront" size={20} color={primaryColor} />
          <Text style={[styles.storeNameText, { color: selectedStore ? textColor : '#999' }]}>
            {selectedStore ? selectedStore.name : "Seleccionar tienda..."}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={subTextColor} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.submitButton, { backgroundColor: primaryColor, opacity: isSubmitting ? 0.7 : 1 }]}
        onPress={handleReportPrice}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Guardar Precio</Text>}
      </TouchableOpacity>

      {mode === 'search' && (
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('info')}>
           <Text style={{ color: subTextColor }}>Volver a información</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlayWrapper}
      >
        <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} onPress={onClose}>
          <Pressable 
            style={[styles.sheet, { backgroundColor: sheetColor, paddingBottom: insets.bottom + 20 }]} 
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>
                {loading ? "Buscando..." : currentView === 'reporting' ? "Reportar Precio" : product ? "Producto Encontrado" : "Producto Desconocido"}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close-circle" size={30} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.content}>
                {loading ? (
                  <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={primaryColor} />
                    <Text style={{ color: subTextColor, marginTop: 15 }}>Consultando base de datos...</Text>
                  </View>
                ) : product ? (
                  currentView === 'reporting' ? renderReportingView() : renderInfoView()
                ) : (
                  <View style={styles.centerBox}>
                    <View style={styles.unknownIconCircle}>
                      <FontAwesome5 name="question" size={40} color={subTextColor} />
                    </View>
                    <Text style={[styles.notFoundTitle, { color: textColor }]}>¡Nuevo Descubrimiento!</Text>
                    <Text style={[styles.notFoundText, { color: subTextColor }]}>No tenemos este producto en nuestra base de datos todavía.</Text>
                    <View style={styles.barcodeBox}>
                      <Ionicons name="barcode-outline" size={20} color={subTextColor} />
                      <Text style={{ color: subTextColor, fontFamily: 'monospace' }}> {barcode} </Text>
                    </View>
                    <TouchableOpacity style={[styles.createButton, { backgroundColor: primaryColor }]}
                      onPress={() => {
                        onClose();
                        router.push({ pathname: "/product/create", params: { barcode: barcode } });
                      }}
                    >
                      <Text style={styles.createButtonText}>Crear Producto</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            {!loading && (
              <TouchableOpacity style={styles.rescanButton} onPress={onRescan}>
                 <Text style={{ color: primaryColor, fontWeight: '600' }}>Escanear otro producto</Text>
              </TouchableOpacity>
            )}

            <StoreSelectorModal 
              visible={storeSelectorVisible}
              onClose={() => setStoreSelectorVisible(false)}
              onSelect={(store) => {
                setSelectedStore(store);
                setStoreSelectorVisible(false);
              }}
            />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrapper: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 450, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  handle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  centerBox: { alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  productRow: { flexDirection: 'row', marginBottom: 25 },
  image: { width: 90, height: 90, borderRadius: 12, backgroundColor: 'white', resizeMode: 'contain' },
  imagePlaceholder: { width: 90, height: 90, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  productName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  brand: { fontSize: 14, marginBottom: 8 },
  badge: { backgroundColor: '#E3F2FD', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, color: '#1565C0', fontWeight: 'bold' },
  actionGrid: { flexDirection: 'row', gap: 12, marginTop: 10 },
  bigButton: { flexDirection: 'row', height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  bigButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  unknownIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  notFoundTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  notFoundText: { textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  barcodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 25 },
  createButton: { width: '100%', height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  createButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  rescanButton: { alignItems: 'center', marginTop: 25, padding: 10 },
  
  // Reporting View Styles
  reportingContainer: { flex: 1 },
  miniProductRow: { marginBottom: 20 },
  miniProductName: { fontSize: 16, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 16, height: 56, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  priceInput: { flex: 1, marginLeft: 10, fontSize: 20, fontWeight: 'bold' },
  storeSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 16, height: 56, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', gap: 10 },
  storeNameText: { flex: 1, fontSize: 16 },
  submitButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  backButton: { alignItems: 'center', marginTop: 15, padding: 10 },
});