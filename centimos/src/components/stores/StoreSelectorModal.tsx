import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getNearbyStores, searchStores } from '@/services/api';
import * as Location from 'expo-location';

interface Store {
  store_id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface StoreSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (store: Store) => void;
}

export function StoreSelectorModal({ visible, onClose, onSelect }: StoreSelectorModalProps) {
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      loadInitialStores();
    }
  }, [visible]);

  const loadInitialStores = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        const nearby = await getNearbyStores(location.coords.latitude, location.coords.longitude);
        setStores(nearby);
      } else {
        // Don't list all stores by default if no location
        setStores([]);
      }
    } catch (error) {
      console.error("Error loading stores", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 1) {
      setLoading(true);
      try {
        const results = await searchStores(text);
        setStores(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else if (text.length === 0) {
        loadInitialStores();
    }
  };

  const renderItem = ({ item }: { item: Store }) => (
    <TouchableOpacity 
      style={[styles.item, { borderBottomColor: cardColor }]} 
      onPress={() => onSelect(item)}
    >
      <View style={styles.iconBox}>
        <FontAwesome5 name="store" size={16} color={primaryColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
        <Text style={[styles.address, { color: subTextColor }]} numberOfLines={1}>
          {item.address || 'No address'}
        </Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={primaryColor} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} onPress={onClose}>
        <View style={[styles.content, { backgroundColor: bgColor }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Select Store</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={subTextColor} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { backgroundColor: cardColor }]}>
            <Ionicons name="search" size={20} color={subTextColor} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Search by name or address..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator color={primaryColor} style={{ margin: 20 }} />
          ) : (
            <FlatList
              data={stores}
              renderItem={renderItem}
              keyExtractor={(item) => item.store_id}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: subTextColor, marginTop: 20 }}>
                  {searchQuery.length > 0 ? "No matches found." : "Search for a store or enable location to see nearby options."}
                </Text>
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  content: { borderRadius: 20, maxHeight: '70%', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 18, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginBottom: 15 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  address: { fontSize: 12 },
});
