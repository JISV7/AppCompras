import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ActivityIndicator, Pressable, Platform, KeyboardAvoidingView, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { StoreSelectorModal } from '../stores/StoreSelectorModal';
import { getProductPriceComparison, PriceComparison } from '@/services/api';
import * as Location from 'expo-location';

interface EnrichedListItem {
    item_id: string;
    product_barcode: string;
    quantity: number;
    productName?: string;
    productImage?: string;
    estimatedPrice?: number; // Average
    predictedPrice?: number; // AI / Exchange Rate 
    added_at?: string; 
    planned_price?: number;
    is_purchased?: boolean;
    store_id?: string;
    storeName?: string;
}

interface ListItemSheetProps {
    visible: boolean;
    item: EnrichedListItem | null;
    onClose: () => void;
    onUpdateItem?: (updatedFields: { quantity?: number; planned_price?: number | null; is_purchased?: boolean; store_id?: string | null }) => void;
    priceLocked?: boolean;
    exchangeRate?: number | null;
}

export function ListItemSheet({ visible, item, onClose, onUpdateItem, priceLocked = false, exchangeRate = null }: ListItemSheetProps) {
    const insets = useSafeAreaInsets();
    const sheetColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'textMain');
    const subTextColor = '#888';
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'surfaceLight');

    const [isEditingQty, setIsEditingQty] = useState(false);
    const [qtyValue, setQtyValue] = useState('');

    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [priceValue, setPriceValue] = useState('');

    const [isEditingPriceBs, setIsEditingPriceBs] = useState(false);
    const [priceBsValue, setPriceBsValue] = useState('');

    const [isPurchasedState, setIsPurchasedState] = useState(item?.is_purchased || false);
    const [selectedStoreId, setSelectedStoreId] = useState(item?.store_id || null);
    const [storeSelectorVisible, setStoreSelectorVisible] = useState(false);

    // Comparison state
    const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
    const [loadingComparisons, setLoadingComparisons] = useState(false);

    const saveLock = React.useRef(false);

    useEffect(() => {
        if (visible) {
            saveLock.current = false; // Reset lock
            setIsEditingQty(false);
            setIsEditingPrice(false);
            setIsEditingPriceBs(false);
            setQtyValue('');
            
            const currentPrice = item?.planned_price ?? item?.estimatedPrice ?? 0;
            setPriceValue(currentPrice.toString());
            
            if (exchangeRate) {
                setPriceBsValue((currentPrice * exchangeRate).toFixed(2));
            } else {
                setPriceBsValue('0.00');
            }

            setIsPurchasedState(item?.is_purchased || false);
            setSelectedStoreId(item?.store_id || null);
            
            if (item) fetchComparisons();
        }
    }, [visible, item, exchangeRate]);

    const fetchComparisons = async () => {
        if (!item) return;
        setLoadingComparisons(true);
        try {
            let lat, lon;
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                lat = loc.coords.latitude;
                lon = loc.coords.longitude;
            }
            const data = await getProductPriceComparison(item.product_barcode, lat, lon);
            setComparisons(data);
        } catch (error) {
            console.error("Comparison fetch failed", error);
        } finally {
            setLoadingComparisons(false);
        }
    };

    if (!item) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Desconocido';
        const isoUtcString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
        const date = new Date(isoUtcString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleQtyPress = () => {
        if (isPurchasedState) return Alert.alert("Ítem Comprado", "Desmarca como comprado para editar.");
        if (onUpdateItem) {
            saveLock.current = false;
            setQtyValue(item.quantity.toString());
            setIsEditingQty(true);
        }
    };

    const handleSaveQty = () => {
        if (saveLock.current) return;
        const num = parseInt(qtyValue, 10);
        if (!isNaN(num) && num > 0 && num <= 99) {
            if (num !== item.quantity) {
                saveLock.current = true;
                onUpdateItem?.({ quantity: num });
            }
            setIsEditingQty(false);
        } else {
            Alert.alert("Inválido", "Cantidad debe ser 1-99");
            setIsEditingQty(false);
        }
    };

    const handlePricePress = () => {
        if (priceLocked) return Alert.alert("Lista Finalizada", "No se pueden editar precios en una lista ya finalizada.");
        if (isPurchasedState) return Alert.alert("Ítem Comprado", "Desmarca como comprado para editar el precio.");
        saveLock.current = false;
        setIsEditingPrice(true);
    };

    const handlePriceBsPress = () => {
        if (priceLocked) return Alert.alert("Lista Finalizada", "No se pueden editar precios en una lista ya finalizada.");
        if (isPurchasedState) return Alert.alert("Ítem Comprado", "Desmarca como comprado para editar el precio.");
        saveLock.current = false;
        setIsEditingPriceBs(true);
    };

    const handlePriceChange = (text: string) => {
        if (text === '') { setPriceValue(''); setPriceBsValue(''); return; }
        if (!/^\d*\.?\d*$/.test(text)) return;
        setPriceValue(text);
        const usd = parseFloat(text);
        if (!isNaN(usd) && exchangeRate) setPriceBsValue((usd * exchangeRate).toFixed(2));
    };

    const handlePriceBsChange = (text: string) => {
        if (text === '') { setPriceBsValue(''); setPriceValue(''); return; }
        if (!/^\d*\.?\d*$/.test(text)) return;
        setPriceBsValue(text);
        const bs = parseFloat(text);
        if (!isNaN(bs) && exchangeRate) setPriceValue((bs / exchangeRate).toFixed(6));
    };

    const handleSavePrice = () => {
        if (saveLock.current) return;
        
        const price = parseFloat(priceValue);
        const originalPrice = item.planned_price ?? item.estimatedPrice ?? 0;

        if (priceValue === '' || priceValue === '0' || isNaN(price)) {
             if (item.planned_price !== null && item.planned_price !== undefined) {
                saveLock.current = true;
                onUpdateItem?.({ planned_price: null });
             }
             setIsEditingPrice(false);
             setIsEditingPriceBs(false);
             return;
        }

        if (price >= 0) {
            if (Math.abs(price - originalPrice) > 0.0001) { 
                saveLock.current = true;
                onUpdateItem?.({ planned_price: price });
            }
            setIsEditingPrice(false);
            setIsEditingPriceBs(false);
        } else {
            setIsEditingPrice(false);
            setIsEditingPriceBs(false);
        }
    };

    const handleTogglePurchased = (newValue: boolean) => {
        setIsPurchasedState(newValue);
        saveLock.current = false;
        onUpdateItem?.({ is_purchased: newValue, store_id: selectedStoreId });
    };

    const handleSelectStore = (store: any) => {
        setSelectedStoreId(store.store_id);
        setStoreSelectorVisible(false);
        saveLock.current = false;
        onUpdateItem?.({ store_id: store.store_id });
    };

    const formatDistance = (meters?: number) => {
        if (meters === undefined) return null;
        return meters < 1000 ? `${meters.toFixed(0)}m` : `${(meters / 1000).toFixed(1)}km`;
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlayWrapper}>
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                    
                    <View style={[styles.sheet, { backgroundColor: sheetColor, paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.handle} />

                        <View style={styles.header}>
                            <Text style={[styles.title, { color: textColor }]}>Detalle del Item</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close-circle" size={30} color={subTextColor} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            showsVerticalScrollIndicator={false} 
                            contentContainerStyle={styles.scrollContent}
                            nestedScrollEnabled={true}
                            overScrollMode="never"
                        >
                            <View style={styles.productRow}>
                                {item.productImage ? (
                                    <Image source={{ uri: item.productImage }} style={styles.image} />
                                ) : (
                                    <View style={[styles.imagePlaceholder, { backgroundColor: '#f0f0f0' }]}>
                                        <FontAwesome5 name="box-open" size={40} color="#ccc" />
                                    </View>
                                )}
                                <View style={styles.info}>
                                    <Text style={[styles.productName, { color: textColor }]}>{item.productName}</Text>
                                    <Text style={[styles.barcode, { color: subTextColor }]}>{item.product_barcode}</Text>
                                </View>
                            </View>

                            <View style={styles.grid}>
                                <View style={styles.gridRow}>
                                    <TouchableOpacity
                                        style={[styles.statBox, { backgroundColor: '#F5F5F5', borderColor: primaryColor, borderWidth: 1 }]}
                                        onPress={handleQtyPress}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.statLabel}>Cantidad (Toca)</Text>
                                        {isEditingQty ? (
                                            <TextInput
                                                style={[styles.statValue, { color: textColor, minWidth: 40, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: primaryColor }]}
                                                value={qtyValue}
                                                onChangeText={(text) => setQtyValue(text.replace(/[^0-9]/g, ''))}
                                                keyboardType="numeric"
                                                autoFocus
                                                onSubmitEditing={handleSaveQty}
                                                maxLength={2}
                                                selectTextOnFocus
                                            />
                                        ) : (
                                            <Text style={[styles.statValue, { color: textColor }]}>{item.quantity}</Text>
                                        )}
                                    </TouchableOpacity>

                                    <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
                                        <Text style={styles.statLabel}>Predictivo</Text>
                                        <Text style={[styles.statValue, { color: '#2E7D32' }]}>
                                            ${item.predictedPrice ? item.predictedPrice.toFixed(2) : '-'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.gridRow}>
                                    <TouchableOpacity
                                        style={[styles.statBox, { backgroundColor: '#E3F2FD', borderColor: primaryColor, borderWidth: 1 }]}
                                        onPress={handlePricePress}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.statLabel}>Precio ($)</Text>
                                        {isEditingPrice ? (
                                            <TextInput
                                                style={[styles.statValue, { color: primaryColor, minWidth: 60, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: primaryColor }]}
                                                value={priceValue}
                                                onChangeText={handlePriceChange}
                                                keyboardType="decimal-pad"
                                                autoFocus
                                                onBlur={handleSavePrice}
                                                onSubmitEditing={handleSavePrice}
                                                selectTextOnFocus
                                            />
                                        ) : (
                                            <View>
                                                <Text style={[styles.statValue, { color: primaryColor }]}>
                                                    ${parseFloat(priceValue || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                </Text>
                                                {item.planned_price !== undefined && item.planned_price !== null && (
                                                    <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>(Editado)</Text>
                                                )}
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.statBox, { backgroundColor: '#E3F2FD', borderColor: primaryColor, borderWidth: 1 }]}
                                        onPress={handlePriceBsPress}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.statLabel}>Precio (Bs)</Text>
                                        {isEditingPriceBs ? (
                                            <TextInput
                                                style={[styles.statValue, { color: primaryColor, minWidth: 60, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: primaryColor }]}
                                                value={priceBsValue}
                                                onChangeText={handlePriceBsChange}
                                                keyboardType="decimal-pad"
                                                autoFocus
                                                onBlur={handleSavePrice}
                                                onSubmitEditing={handleSavePrice}
                                                selectTextOnFocus
                                            />
                                        ) : (
                                            <View>
                                                <Text style={[styles.statValue, { color: primaryColor }]}>
                                                    Bs{parseFloat(priceBsValue || '0').toFixed(2)}
                                                </Text>
                                                {item.planned_price !== undefined && item.planned_price !== null && (
                                                    <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>(Editado)</Text>
                                                )}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Store Reminder Hint */}
                            {item.planned_price !== null && item.planned_price !== undefined && !item.store_id && (
                                <View style={styles.hintBox}>
                                    <Ionicons name="information-circle" size={16} color="#0277BD" />
                                    <Text style={styles.hintText}>
                                        Selecciona una tienda abajo para registrar este precio en tu historial comparativo.
                                    </Text>
                                </View>
                            )}

                            {/* Comparison Section */}
                            <Text style={[styles.sectionTitle, { color: textColor, marginTop: 10, marginBottom: 15 }]}>Comparativa de precios</Text>
                            {loadingComparisons ? (
                                <ActivityIndicator color={primaryColor} style={{ marginVertical: 15 }} />
                            ) : comparisons.length > 0 ? (
                                <View style={styles.comparisonList}>
                                    {comparisons.map((c, idx) => (
                                        <TouchableOpacity 
                                            key={c.store_id} 
                                            style={[styles.comparisonItem, { borderBottomColor: cardColor, borderBottomWidth: idx === comparisons.length - 1 ? 0 : 1 }]}
                                            onPress={() => handleSelectStore(c)}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.storeName, { color: textColor }]}>{c.store_name}</Text>
                                                <Text style={{ color: subTextColor, fontSize: 12 }}>
                                                    {formatDistance(c.distance_meters)} • {new Date(c.recorded_at).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={[styles.priceText, { color: idx === 0 ? primaryColor : textColor }]}>${c.price.toFixed(2)}</Text>
                                                {idx === 0 && <View style={styles.bestPriceBadge}><Text style={styles.bestPriceText}>MEJOR PRECIO</Text></View>}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyBox}><Text style={{ color: subTextColor, textAlign: 'center' }}>Sin registros en otras tiendas.</Text></View>
                            )}

                            <View style={[styles.detailRow, { borderBottomColor: '#eee', borderBottomWidth: 1, marginTop: 20 }]}>
                                <Text style={{ color: subTextColor }}>Agregado el</Text>
                                <Text style={{ color: textColor, fontWeight: '500' }}>{formatDate(item.added_at)}</Text>
                            </View>

                            <View style={[styles.detailRow, { borderBottomColor: '#eee', borderBottomWidth: 1 }]}>
                                <Text style={{ color: subTextColor }}>¿Comprado?</Text>
                                <Switch onValueChange={handleTogglePurchased} value={isPurchasedState} trackColor={{ false: '#767577', true: primaryColor }} />
                            </View>

                            <TouchableOpacity style={styles.detailRow} onPress={() => setStoreSelectorVisible(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialIcons name="storefront" size={20} color={subTextColor} />
                                    <Text style={{ color: subTextColor }}>Tienda</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ color: textColor, fontWeight: '500' }}>{item.storeName || 'Seleccionar...'}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={subTextColor} />
                                </View>
                            </TouchableOpacity>
                        </ScrollView>

                        <StoreSelectorModal visible={storeSelectorVisible} onClose={() => setStoreSelectorVisible(false)} onSelect={handleSelectStore} />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlayWrapper: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400, maxHeight: '85%' },
    handle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    title: { fontSize: 20, fontWeight: 'bold' },
    scrollContent: { paddingBottom: 0 },
    productRow: { flexDirection: 'row', marginBottom: 25 },
    image: { width: 80, height: 80, borderRadius: 12, backgroundColor: 'white', resizeMode: 'contain' },
    imagePlaceholder: { width: 80, height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    productName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    barcode: { fontSize: 14, fontFamily: 'monospace' },
    grid: { gap: 15, marginBottom: 25 },
    gridRow: { flexDirection: 'row', gap: 15 },
    statBox: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
    statValue: { fontSize: 20, fontWeight: 'bold', lineHeight: 28 }, 
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, alignItems: 'center' },
    
    // Comparison Styles
    sectionTitle: { fontSize: 16, fontWeight: 'bold' },
    comparisonList: { backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 16, overflow: 'hidden' },
    comparisonItem: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    storeName: { fontWeight: '600', fontSize: 14, marginBottom: 2 },
    priceText: { fontSize: 16, fontWeight: 'bold' },
    bestPriceBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    bestPriceText: { color: '#2E7D32', fontSize: 8, fontWeight: 'bold' },
    emptyBox: { padding: 20, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 16 },
    hintBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E1F5FE',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#B3E5FC'
    },
    hintText: {
        color: '#0277BD',
        fontSize: 13,
        flex: 1,
        lineHeight: 18
    }
});
