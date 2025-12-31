import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ActivityIndicator, Pressable, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { searchProducts, Product } from '@/services/api';

interface ProductSearchSheetProps {
    visible: boolean;
    query: string;
    onClose: () => void;
    onProductSelect: (product: Product) => void;
}

export function ProductSearchSheet({ visible, query, onClose, onProductSelect }: ProductSearchSheetProps) {
    const sheetColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'textMain');
    const subTextColor = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'surfaceLight');

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            handleSearch(query);
        }
    }, [visible, query]);

    const handleSearch = async (text: string) => {
        setLoading(true);
        const results = await searchProducts(text);
        setProducts(results);
        setLoading(false);
    };

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity 
            style={[styles.productCard, { backgroundColor: cardColor }]}
            onPress={() => onProductSelect(item)}
        >
            <View style={styles.imageBox}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                ) : (
                    <FontAwesome5 name="box" size={24} color="#ccc" />
                )}
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.brand, { color: subTextColor }]}>{item.brand || 'No brand'}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.barcode}</Text>
                </View>
            </View>
            <Ionicons name="add-circle" size={28} color={primaryColor} />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={[styles.sheet, { backgroundColor: sheetColor }]} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>Resultados de búsqueda</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={30} color={subTextColor} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={products}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.barcode}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.empty}>
                                    <FontAwesome5 name="search" size={40} color={subTextColor} />
                                    <Text style={{ color: subTextColor, marginTop: 15 }}>No se encontraron productos.</Text>
                                </View>
                            }
                        />
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '85%', paddingBottom: 40 },
    handle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    listContent: { paddingBottom: 20 },
    productCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    imageBox: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#f9f9f9', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    image: { width: 60, height: 60, borderRadius: 12 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold' },
    brand: { fontSize: 13, marginBottom: 4 },
    badge: { backgroundColor: '#E3F2FD', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, color: '#1565C0', fontFamily: 'monospace' },
    empty: { alignItems: 'center', marginTop: 50 }
});
