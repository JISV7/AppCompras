import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getListDetails, addListItem, deleteListItem, updateListItem, completeShoppingList, updateList, ShoppingList, ListItem } from '@/services/lists';
import { getProduct, getLatestExchangeRate, getStores, searchStores, getNearbyStores } from '@/services/api';
import { normalizeToGtin13 } from '@/services/validate';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { SwipeableRow } from '@/components/common/SwipeableRow';
import { ListItemSheet } from '@/components/lists/ListItemSheet';
import { CameraModal } from '@/components/scanner/CameraModal';
import { AddProductModal } from '@/components/lists/AddProductModal';
import * as Location from 'expo-location';

// Helper interface to combine List Item + Product Details
interface EnrichedListItem extends ListItem {
  productName?: string;
  productImage?: string;
  estimatedPrice?: number;
  predictedPrice?: number;
  storeName?: string;
}

interface Store {
  store_id: string;
  name: string;
  address?: string;
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Colors
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textMain');
  const primaryColor = useThemeColor({}, 'primary');
  const subTextColor = useThemeColor({}, 'textSecondary'); // Added

  // State
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<EnrichedListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedItem, setSelectedItem] = useState<EnrichedListItem | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Actions
  const [showActions, setShowActions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isManualAdd, setIsManualAdd] = useState(false); // New state for manual add modal

  // State for completing list
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [selectedStoreForCompletion, setSelectedStoreForCompletion] = useState<string | null>(null);
  const [completingList, setCompletingList] = useState(false);

  // NEW: Store Search and Nearby State
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeSearchResults, setStoreSearchResults] = useState<Store[]>([]);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [isNearbyExpanded, setIsNearbyExpanded] = useState(false);
  const [searchingStores, setSearchingStores] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listData, rateData, storesData] = await Promise.all([
        getListDetails(id),
        getLatestExchangeRate(),
        getStores() // Fetch stores
      ]);

      setList(listData);
      if (rateData) setExchangeRate(rateData.rate_to_ves);
      setAvailableStores(storesData); // Set available stores

      await processItems(listData, rateData?.rate_to_ves, storesData);

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  const processItems = async (listData: ShoppingList, rate: number | undefined, storesData: Store[]) => {
    const enrichedItems = await Promise.all(
      listData.items.map(async (item) => {
        try {
          const product = await getProduct(item.product_barcode);
          const avgPrice = Number(product?.estimated_price_usd) || 0;
          const predPrice = Number(product?.predicted_price_usd) || 0;
          const store = storesData.find((s: any) => s.store_id === item.store_id);

          return {
            ...item,
            productName: product?.name || "Unknown Product",
            productImage: product?.image_url,
            estimatedPrice: avgPrice,
            predictedPrice: predPrice,
            storeName: store?.name,
            added_at: item.added_at,
            planned_price: item.planned_price,
            is_purchased: item.is_purchased,
            store_id: item.store_id,
          };
        } catch {
          return { ...item, productName: "Product not found", estimatedPrice: 0, predictedPrice: 0 };
        }
      })
    );
    setItems(enrichedItems);
    calculateTotal(enrichedItems);
  };

  const calculateTotal = (currentItems: EnrichedListItem[]) => {
    const total = currentItems.reduce((sum, item) => {
      const priceToUse = item.planned_price ?? item.estimatedPrice ?? 0;
      return sum + (item.quantity * priceToUse);
    }, 0);
    setTotalPrice(total);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (list?.status === 'COMPLETED') {
       Alert.alert("List Completed", "Cannot add items to a completed list.");
       return;
    }
    setIsScanning(false);
    setIsManualAdd(false); // Close manual modal if open (though logic passes data here)

    try {
      const normalizedBarcode = normalizeToGtin13(data);
      await addListItem(id, normalizedBarcode, 1);
      Alert.alert("Added", `Product ${data} added!`);
      fetchData();
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert("Unknown Product", "Please create this product in the Home tab first.");
      } else {
        Alert.alert("Error", "Could not add item.");
      }
    }
  };

  const handleManualAdd = () => {
    setIsManualAdd(true);
  };

  const handleRemoveItem = async (itemId: string) => {
    const originalItems = [...items];
    setItems(prev => prev.filter(i => i.item_id !== itemId));
    calculateTotal(items.filter(i => i.item_id !== itemId));

    try {
      await deleteListItem(id, itemId);
    } catch (e) {
      setItems(originalItems);
      calculateTotal(originalItems);
      Alert.alert("Error", "Could not delete item");
    }
  };

  const handleCompleteListPress = async () => {
    // Reset states
    setStoreSearchQuery('');
    setStoreSearchResults([]);
    setIsNearbyExpanded(false);
    setSelectedStoreForCompletion(null);
    setShowCompleteModal(true);

    // Fetch Nearby Stores
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const nearby = await getNearbyStores(location.coords.latitude, location.coords.longitude);
        setNearbyStores(nearby);
        if (nearby.length > 0) {
            setSelectedStoreForCompletion(nearby[0].store_id);
        }
      }
    } catch (error) {
      console.error("Error fetching nearby stores:", error);
    }
  };

  const handleStoreSearch = async (text: string) => {
    setStoreSearchQuery(text);
    if (text.length > 1) {
      setSearchingStores(true);
      try {
        const results = await searchStores(text);
        setStoreSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingStores(false);
      }
    } else {
      setStoreSearchResults([]);
    }
  };

  const handleConfirmCompleteList = async () => {
    if (!selectedStoreForCompletion) {
      Alert.alert("No Store Selected", "Please select a store to complete the list.");
      return;
    }

    setCompletingList(true);
    try {
      await completeShoppingList(id, selectedStoreForCompletion);
      Alert.alert("Success", "List completed and prices logged!");
      setShowCompleteModal(false);
      fetchData(); // Re-fetch data to update status and items
    } catch (error) {
      console.error("Error completing list:", error);
      Alert.alert("Error", "Could not complete list.");
    } finally {
      setCompletingList(false);
    }
  };

  const handleUpdateItem = async (updatedFields: { quantity?: number; planned_price?: number | null; is_purchased?: boolean; store_id?: string | null }) => {
    if (!selectedItem) return;

    const originalItems = [...items];
    const itemToUpdate = selectedItem;

    // Remove nulls/undefineds for spread
    const cleanUpdates: any = { ...updatedFields };
    // if store_id is null, it means we clear it.
    
    // Optimistically update the UI
    const updatedItems = items.map(i =>
      i.item_id === itemToUpdate.item_id ? { ...i, ...cleanUpdates } : i
    );
    setItems(updatedItems);
    calculateTotal(updatedItems);
    setSelectedItem({ ...itemToUpdate, ...cleanUpdates });

    // API calls expect specific types, handle nulls if needed by service
    // Ensure service handles null store_id or planned_price
    const apiData: any = { ...updatedFields };
    if (apiData.store_id === null) delete apiData.store_id; // or pass null if backend supports it. backend supports optional, so let's check service.

    try {
      await updateListItem(id, itemToUpdate.item_id, apiData);
      // Re-fetch list to ensure consistency and refresh calculated totals/statuses from backend
      fetchData();
    } catch (e) {
      console.error("Failed to update item:", e);
      setItems(originalItems); // Revert on error
      calculateTotal(originalItems);
      setSelectedItem(itemToUpdate);
      Alert.alert("Error", "Could not update item.");
    }
  };

  const handleReopenList = async () => {
    try {
      await updateList(id, { status: 'ACTIVE' });
      Alert.alert("Success", "List Reopened!");
      fetchData();
    } catch (error) {
      Alert.alert("Error", "Could not reopen list.");
    }
  };
  
  const renderItem = ({ item }: { item: EnrichedListItem }) => (
    <SwipeableRow onDelete={() => handleRemoveItem(item.item_id)} height={80} bottomMargin={10}>
      <TouchableOpacity
        style={[styles.itemCard, { backgroundColor: cardColor }]}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.9}
      >
        <View style={styles.itemImagePlaceholder}>
          {item.productImage ? (
            <Image source={{ uri: item.productImage }} style={styles.itemImage} />
          ) : (
            <FontAwesome5 name="box" size={20} color="#ccc" />
          )}
        </View>
        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <Text style={[styles.itemName, { color: textColor }]}>{item.productName}</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>{item.product_barcode}</Text>
        </View>
        <View style={styles.qtyBadge}>
          <Text style={{ fontWeight: 'bold', color: primaryColor }}>x{item.quantity}</Text>
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen options={{ title: list?.name || 'Loading...', headerBackTitle: 'Lists' }} />

      <View style={[styles.summary, { backgroundColor: cardColor }]}>
        <Text style={{ color: '#888' }}>Estimated Total</Text>
        <Text style={[styles.totalPrice, { color: (list?.budget_limit && totalPrice > list.budget_limit) ? 'red' : primaryColor }]}>
          {list?.currency || "$"} {totalPrice.toFixed(2)}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.item_id}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 15, paddingBottom: 120 + insets.bottom }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <FontAwesome5 name="clipboard-list" size={50} color="#ddd" />
              <Text style={{ color: '#888', marginTop: 10 }}>List is empty</Text>
            </View>
          }
        />
      )}

      {showActions && list?.status !== 'COMPLETED' && (
        <View style={styles.actionMenu}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCompleteListPress}>
            <MaterialIcons name="done-all" size={24} color="white" />
            <Text style={styles.actionText}>Complete List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleManualAdd}>
            <Ionicons name="keypad" size={24} color="white" />
            <Text style={styles.actionText}>Type Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setShowActions(false); setIsScanning(true); }}>
            <Ionicons name="scan" size={24} color="white" />
            <Text style={styles.actionText}>Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {list?.status !== 'COMPLETED' && (
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primaryColor, transform: [{ rotate: showActions ? '45deg' : '0deg' }] }]}
        onPress={() => setShowActions(!showActions)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
      )}

      {list?.status === 'COMPLETED' && (
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: '#FF9800', width: 'auto', paddingHorizontal: 24, borderRadius: 30, bottom: 30 }]}
            onPress={handleReopenList}
          >
            <Text style={{color: 'white', fontWeight: 'bold'}}>Reopen List</Text>
          </TouchableOpacity>
      )}

      <CameraModal
        visible={isScanning}
        onClose={() => setIsScanning(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <AddProductModal
        visible={isManualAdd}
        onClose={() => setIsManualAdd(false)}
        onSubmit={(code) => handleBarcodeScanned({ data: code })}
      />

      <ListItemSheet
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateItem={handleUpdateItem}
        priceLocked={list?.status === 'COMPLETED'}
      />

      {/* Complete List Modal */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
        statusBarTranslucent
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} onPress={() => setShowCompleteModal(false)}>
          <Pressable style={[styles.completeModalContent, { backgroundColor: cardColor }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.completeModalTitle, { color: textColor }]}>Complete List</Text>
            <Text style={[styles.completeModalSubtitle, { color: subTextColor }]}>
              Mark all unpurchased items as purchased and log their prices.
            </Text>

            {/* Store Selection */}
            <View style={styles.storeSelectContainer}>
                <Text style={[styles.storeSelectLabel, { color: textColor }]}>Purchased from:</Text>
                
                {/* Search Bar */}
                <View style={[styles.modalSearchBar, { backgroundColor: bgColor }]}>
                    <Ionicons name="search" size={18} color={subTextColor} />
                    <TextInput
                        style={[styles.modalSearchInput, { color: textColor }]}
                        placeholder="Search store name/address..."
                        placeholderTextColor="#999"
                        value={storeSearchQuery}
                        onChangeText={handleStoreSearch}
                    />
                </View>

                {/* Search Results / Selected Store */}
                {storeSearchResults.length > 0 ? (
                    <ScrollView style={styles.searchResultsContainer} nestedScrollEnabled>
                        {storeSearchResults.map(store => (
                            <TouchableOpacity 
                                key={store.store_id} 
                                style={[styles.searchResultItem, selectedStoreForCompletion === store.store_id && { backgroundColor: `${primaryColor}22` }]}
                                onPress={() => setSelectedStoreForCompletion(store.store_id)}
                            >
                                <Text style={[styles.searchResultText, { color: textColor }]}>{store.name}</Text>
                                <Text style={styles.searchResultAddress} numberOfLines={1}>{store.address}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : selectedStoreForCompletion && !isNearbyExpanded ? (
                    <View style={[styles.selectedStoreRow, { backgroundColor: `${primaryColor}11`, borderColor: primaryColor }]}>
                        <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
                        <Text style={{ color: textColor, fontWeight: 'bold', marginLeft: 8 }}>
                            {nearbyStores.find(s => s.store_id === selectedStoreForCompletion)?.name || 
                             storeSearchResults.find(s => s.store_id === selectedStoreForCompletion)?.name || 
                             "Selected Store"}
                        </Text>
                    </View>
                ) : null}

                {/* Collapsible Nearby */}
                <TouchableOpacity 
                    style={styles.nearbyToggle} 
                    onPress={() => setIsNearbyExpanded(!isNearbyExpanded)}
                >
                    <Text style={{ color: primaryColor, fontWeight: 'bold' }}>
                        {isNearbyExpanded ? "Hide Nearby" : "Show Nearby Stores"}
                    </Text>
                    <Ionicons name={isNearbyExpanded ? "chevron-up" : "chevron-down"} size={16} color={primaryColor} />
                </TouchableOpacity>

                {isNearbyExpanded && (
                    <View style={styles.nearbyList}>
                        {nearbyStores.length > 0 ? (
                            nearbyStores.map((store) => (
                                <TouchableOpacity
                                    key={store.store_id}
                                    style={[
                                        styles.searchResultItem,
                                        selectedStoreForCompletion === store.store_id && { backgroundColor: `${primaryColor}22` }
                                    ]}
                                    onPress={() => setSelectedStoreForCompletion(store.store_id)}
                                >
                                    <Text style={[styles.searchResultText, { color: textColor }]}>{store.name}</Text>
                                    <Text style={styles.searchResultAddress} numberOfLines={1}>
                                        {store.address || "No address provided"}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={{ color: subTextColor, textAlign: 'center', fontSize: 12 }}>No stores found nearby.</Text>
                        )}
                    </View>
                )}
            </View>

            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: primaryColor, opacity: completingList || !selectedStoreForCompletion ? 0.7 : 1 }]}
              onPress={handleConfirmCompleteList}
              disabled={completingList || !selectedStoreForCompletion}
            >
              {completingList ? <ActivityIndicator color="white" /> : <Text style={styles.completeButtonText}>Confirm Completion</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelCompleteButton}
              onPress={() => setShowCompleteModal(false)}
              disabled={completingList}
            >
              <Text style={[styles.cancelCompleteButtonText, { color: subTextColor }]}>Cancel</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  totalPrice: { fontSize: 24, fontWeight: '900' },

  itemCard: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  itemImagePlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  itemName: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  qtyBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },

  fab: { position: 'absolute', bottom: 60, right: 30, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5, zIndex: 10 },

  actionMenu: { position: 'absolute', bottom: 130, right: 30, gap: 12, alignItems: 'flex-end', zIndex: 10 },
  actionBtn: { flexDirection: 'row', backgroundColor: '#455A64', padding: 12, borderRadius: 25, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  actionText: { color: 'white', fontWeight: 'bold' },

  // Complete List Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeModalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  completeModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  completeModalSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  storeSelectContainer: {
    width: '100%',
    marginBottom: 25,
  },
  storeSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  storeOptionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  completeButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelCompleteButton: {
    paddingVertical: 10,
  },
  cancelCompleteButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  searchResultsContainer: {
    maxHeight: 120,
    marginBottom: 10,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 8,
  },
  searchResultText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultAddress: {
    fontSize: 11,
    color: '#888',
  },
  selectedStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  nearbyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  nearbyList: {
    marginTop: 10,
    marginBottom: 15,
    gap: 8,
  },
});