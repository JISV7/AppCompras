import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getListDetails, addListItem, deleteListItem, updateListItem, completeShoppingList, updateList, ShoppingList, ListItem } from '@/services/lists';
import { getProduct, getLatestExchangeRate, getStores } from '@/services/api';
import { normalizeToGtin13 } from '@/services/validate';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { SwipeableRow } from '@/components/common/SwipeableRow';
import { ListItemSheet } from '@/components/lists/ListItemSheet';
import { CameraModal } from '@/components/scanner/CameraModal';
import { AddProductModal } from '@/components/lists/AddProductModal';

// Helper interface to combine List Item + Product Details
interface EnrichedListItem extends ListItem {
  productName?: string;
  productImage?: string;
  estimatedPrice?: number;
  predictedPrice?: number;
  added_at?: string;
  planned_price?: number;
  is_purchased?: boolean; // Added
  store_id?: string;      // Added
}

interface Store {
  store_id: string;
  name: string;
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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

      await processItems(listData, rateData?.rate_to_ves);

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  const processItems = async (listData: ShoppingList, rate: number | undefined) => {
    const enrichedItems = await Promise.all(
      listData.items.map(async (item) => {
        try {
          const product = await getProduct(item.product_barcode);
          const avgPrice = Number(product?.estimated_price_usd) || 0;
          const predPrice = Number(product?.predicted_price_usd) || 0;

          return {
            ...item,
            productName: product?.name || "Unknown Product",
            productImage: product?.image_url,
            estimatedPrice: avgPrice,
            predictedPrice: predPrice,
            added_at: item.added_at,
            planned_price: item.planned_price,
            is_purchased: item.is_purchased, // Added
            store_id: item.store_id,         // Added
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

  const handleCompleteListPress = () => {
    // Only allow completing if there are items and a store is selected by default, or provide selection
    if (availableStores.length === 0) {
      Alert.alert("No Stores", "Please add stores to log prices when completing a list.");
      return;
    }
    setSelectedStoreForCompletion(availableStores[0].store_id); // Auto-select first store for convenience
    setShowCompleteModal(true);
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

  const handleUpdateItem = async (updatedFields: { quantity?: number; planned_price?: number; is_purchased?: boolean; store_id?: string }) => {
    if (!selectedItem) return;

    const originalItems = [...items];
    const itemToUpdate = selectedItem;

    // Optimistically update the UI
    const updatedItems = items.map(i =>
      i.item_id === itemToUpdate.item_id ? { ...i, ...updatedFields } : i
    );
    setItems(updatedItems);
    calculateTotal(updatedItems);
    setSelectedItem({ ...itemToUpdate, ...updatedFields });

    try {
      await updateListItem(id, itemToUpdate.item_id, updatedFields);
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
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
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
            style={[styles.fab, { backgroundColor: '#FF9800', width: 'auto', paddingHorizontal: 20, borderRadius: 30 }]}
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
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCompleteModal(false)}>
          <Pressable style={[styles.completeModalContent, { backgroundColor: cardColor }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.completeModalTitle, { color: textColor }]}>Complete List</Text>
            <Text style={[styles.completeModalSubtitle, { color: subTextColor }]}>
              Mark all unpurchased items as purchased and log their prices.
            </Text>

            {/* Store Selection */}
            {availableStores.length > 0 ? (
              <View style={styles.storeSelectContainer}>
                <Text style={[styles.storeSelectLabel, { color: textColor }]}>Purchased from:</Text>
                <View style={styles.storeOptionContainer}>
                  {availableStores.map((store) => (
                    <TouchableOpacity
                      key={store.store_id}
                      style={[
                        styles.storeOption,
                        {
                          backgroundColor: selectedStoreForCompletion === store.store_id ? primaryColor : subTextColor,
                          borderColor: selectedStoreForCompletion === store.store_id ? primaryColor : subTextColor,
                        }
                      ]}
                      onPress={() => setSelectedStoreForCompletion(store.store_id)}
                    >
                      <Text style={[styles.storeOptionText, { color: 'white' }]}>{store.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={{ color: subTextColor, textAlign: 'center', marginBottom: 20 }}>No stores available. Add one first!</Text>
            )}

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

  fab: { position: 'absolute', bottom: 90, right: 30, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5, zIndex: 10 },

  actionMenu: { position: 'absolute', bottom: 100, right: 30, gap: 15, alignItems: 'flex-end', zIndex: 10 },
  actionBtn: { flexDirection: 'row', backgroundColor: '#455A64', padding: 12, borderRadius: 25, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  actionText: { color: 'white', fontWeight: 'bold' },

  // Complete List Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  storeOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  storeOptionText: {
    fontWeight: 'bold',
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
});