import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, Platform, Linking } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

interface Store {
  store_id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface StoreDetailModalProps {
  visible: boolean;
  store: Store | null;
  distance: string | null;
  onClose: () => void;
}

export function StoreDetailModal({ visible, store, distance, onClose }: StoreDetailModalProps) {
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');

  if (!store) return null;

  const openInMaps = () => {
    if (!store.latitude || !store.longitude) return;
    
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${store.latitude},${store.longitude}`;
    const label = store.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) Linking.openURL(url);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: bgColor }]} onPress={(e) => e.stopPropagation()}>
          
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.titleRow}>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}>
                    <FontAwesome5 name="store-alt" size={24} color={primaryColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: textColor }]}>{store.name}</Text>
                    {distance && (
                        <View style={styles.distanceBadge}>
                            <Ionicons name="navigate" size={12} color={primaryColor} />
                            <Text style={[styles.distanceText, { color: primaryColor }]}>{distance} away</Text>
                        </View>
                    )}
                </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={30} color={subTextColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
                <Text style={[styles.label, { color: subTextColor }]}>Address</Text>
                <Text style={[styles.value, { color: textColor }]}>{store.address || 'No address provided'}</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, { color: subTextColor }]}>Coordinates</Text>
                <Text style={[styles.value, { color: textColor, fontFamily: 'monospace' }]}>
                    {store.latitude?.toFixed(6)}, {store.longitude?.toFixed(6)}
                </Text>
            </View>

            <TouchableOpacity 
                style={[styles.mapButton, { backgroundColor: primaryColor }]} 
                onPress={openInMaps}
                disabled={!store.latitude}
            >
                <MaterialIcons name="map" size={20} color="white" />
                <Text style={styles.mapButtonText}>Open in Maps</Text>
            </TouchableOpacity>

            <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: cardColor }]}>
                    <Text style={[styles.statLabel, { color: subTextColor }]}>Logs</Text>
                    <Text style={[styles.statValue, { color: textColor }]}>-</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: cardColor }]}>
                    <Text style={[styles.statLabel, { color: subTextColor }]}>Best Price</Text>
                    <Text style={[styles.statValue, { color: primaryColor }]}>-</Text>
                </View>
            </View>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: 'bold' },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distanceText: { fontSize: 14, fontWeight: '600' },
  
  content: { gap: 20 },
  section: { gap: 5 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, lineHeight: 22 },
  
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, marginTop: 10 },
  mapButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  statsRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  statItem: { flex: 1, padding: 15, borderRadius: 16, alignItems: 'center', gap: 5 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: 'bold' },
});
