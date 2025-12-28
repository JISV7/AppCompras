import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getListDetails, addListItem, deleteListItem, updateListItem, ShoppingList, ListItem } from '@/services/lists';
import { getProduct, getLatestExchangeRate } from '@/services/api';
import { normalizeToGtin13 } from '@/services/validate';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
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
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Colors
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textMain');
  const primaryColor = useThemeColor({}, 'primary');

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

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listData, rateData] = await Promise.all([
        getListDetails(id),
        getLatestExchangeRate()
      ]);

      setList(listData);
      if (rateData) setExchangeRate(rateData.rate_to_ves);

      await processItems(listData, rateData?.rate_to_ves);

    } catch (error) {
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
          const avgPrice = product?.estimated_price_usd || product?.price || 0;
          const currentPrice = product?.price || 0;

          return {
            ...item,
            productName: product?.name || "Unknown Product",
            productImage: product?.image_url,
            estimatedPrice: avgPrice,
            predictedPrice: currentPrice,
            added_at: item.added_at,
            planned_price: item.planned_price
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

  const handleUpdateQuantity = async (newQty: number) => {
    if (!selectedItem) return;

    const originalItems = [...items];
    const itemToUpdate = selectedItem;

    const updatedItems = items.map(i =>
      i.item_id === itemToUpdate.item_id ? { ...i, quantity: newQty } : i
    );
    setItems(updatedItems);
    calculateTotal(updatedItems);

    setSelectedItem({ ...itemToUpdate, quantity: newQty });

    try {
      await updateListItem(id, itemToUpdate.item_id, { quantity: newQty });
    } catch (e) {
      setItems(originalItems);
      calculateTotal(originalItems);
      setSelectedItem(itemToUpdate);
      Alert.alert("Error", "Could not update quantity");
    }
  };

  const handleUpdatePrice = async (newPrice: number) => {
    if (!selectedItem) return;

    const originalItems = [...items];
    const itemToUpdate = selectedItem;

    const updatedItems = items.map(i =>
      i.item_id === itemToUpdate.item_id ? { ...i, planned_price: newPrice } : i
    );
    setItems(updatedItems);
    calculateTotal(updatedItems);

    setSelectedItem({ ...itemToUpdate, planned_price: newPrice });

    try {
      await updateListItem(id, itemToUpdate.item_id, { planned_price: newPrice });
    } catch (e) {
      setItems(originalItems);
      calculateTotal(originalItems);
      setSelectedItem(itemToUpdate);
      Alert.alert("Error", "Could not update price");
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

      {showActions && (
        <View style={styles.actionMenu}>
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

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primaryColor, transform: [{ rotate: showActions ? '45deg' : '0deg' }] }]}
        onPress={() => setShowActions(!showActions)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

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
        onUpdateQuantity={handleUpdateQuantity}
        onUpdatePrice={handleUpdatePrice}
      />
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

  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5, zIndex: 10 },

  actionMenu: { position: 'absolute', bottom: 100, right: 30, gap: 15, alignItems: 'flex-end', zIndex: 10 },
  actionBtn: { flexDirection: 'row', backgroundColor: '#455A64', padding: 12, borderRadius: 25, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  actionText: { color: 'white', fontWeight: 'bold' }
});