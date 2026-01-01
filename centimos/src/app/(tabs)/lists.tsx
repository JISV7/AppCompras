import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { createList, getMyLists, deleteList, ShoppingList } from '@/services/lists';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SwipeableRow } from '@/components/common/SwipeableRow';

export default function ListsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Colors
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textMain');
  const primaryColor = useThemeColor({}, 'primary');

  // State
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListBudget, setNewListBudget] = useState('');
  const [creating, setCreating] = useState(false);

  // Load lists every time tab is focused
  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  const loadLists = async () => {
    try {
      const data = await getMyLists();
      setLists(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const budget = newListBudget ? parseFloat(newListBudget) : undefined;
      await createList(newListName, budget);
      setNewListName('');
      setNewListBudget('');
      setModalVisible(false);
      loadLists(); // Refresh
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la lista");
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveList = async (listId: string) => {
    // 1. Optimistic Update
    const originalLists = [...lists];
    setLists(prev => prev.filter(l => l.list_id !== listId));

    try {
      await deleteList(listId);
    } catch (e) {
      // Revert on failure
      setLists(originalLists);
      Alert.alert("Error", "No se pudo eliminar la lista");
    }
  };

  const renderItem = ({ item }: { item: ShoppingList }) => (
    <SwipeableRow onDelete={() => handleRemoveList(item.list_id)} height={80} bottomMargin={16}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardColor }]}
        onPress={() => router.push(`/lists/${item.list_id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.cardIcon}>
          <MaterialIcons name="shopping-basket" size={24} color={primaryColor} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>
            {item.items?.length || 0} artículos • {item.status}
            {item.budget_limit ? ` • ${item.currency}${item.budget_limit}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    </SwipeableRow>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Mis Listas</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={lists}
          renderItem={renderItem}
          keyExtractor={(item) => item.list_id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#888', marginTop: 50 }}>
              No hay listas aún. ¡Crea una abajo!
            </Text>
          }
        />
      )}

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Create List Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Nueva Lista</Text>

            <TextInput
              style={[styles.input, { color: textColor, borderColor: '#ccc' }]}
              placeholder="Nombre de la lista"
              placeholderTextColor="#999"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />

            <TextInput
              style={[styles.input, { color: textColor, borderColor: '#ccc' }]}
              placeholder="Límite de presupuesto (Opcional)"
              placeholderTextColor="#999"
              value={newListBudget}
              onChangeText={setNewListBudget}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: '#888' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={styles.createBtn} disabled={creating}>
                {creating ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Crear</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  title: { fontSize: 32, fontWeight: 'bold' },
  listContent: { padding: 20, paddingBottom: 120 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#888' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { padding: 10 },
  createBtn: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 8, minWidth: 80, alignItems: 'center' }
});