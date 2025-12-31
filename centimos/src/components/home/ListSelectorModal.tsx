import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getMyLists, ShoppingList } from '@/services/lists';

interface ListSelectorModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (listId: string) => void;
}

export function ListSelectorModal({ visible, onClose, onSelect }: ListSelectorModalProps) {
    const bgColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'textMain');
    const subTextColor = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'surfaceLight');

    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchLists();
        }
    }, [visible]);

    const fetchLists = async () => {
        setLoading(true);
        try {
            const allLists = await getMyLists();
            // Filter only ACTIVE lists
            const activeLists = allLists.filter(l => l.status === 'ACTIVE');
            setLists(activeLists);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: ShoppingList }) => (
        <TouchableOpacity 
            style={[styles.listCard, { backgroundColor: cardColor }]}
            onPress={() => onSelect(item.list_id)}
        >
            <View style={styles.iconBox}>
                <MaterialIcons name="playlist-add" size={24} color={primaryColor} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
                <Text style={[styles.details, { color: subTextColor }]}>
                    {item.items?.length || 0} items • {item.currency}{item.budget_limit || '0'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <View style={[styles.content, { backgroundColor: bgColor }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>Agregar a la lista...</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={subTextColor} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={primaryColor} style={{ margin: 20 }} />
                    ) : (
                        <FlatList
                            data={lists}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.list_id}
                            ListEmptyComponent={
                                <View style={styles.empty}>
                                    <Text style={{ textAlign: 'center', color: subTextColor }}>
                                        No tienes listas abiertas.
                                    </Text>
                                    <Text style={{ textAlign: 'center', color: subTextColor, fontSize: 12, marginTop: 5 }}>
                                        Crea una lista nueva desde la pestaña de Listas.
                                    </Text>
                                </View>
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    content: { borderRadius: 24, maxHeight: '60%', padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold' },
    listCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 10 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold' },
    details: { fontSize: 12, marginTop: 2 },
    empty: { padding: 30, alignItems: 'center' }
});
