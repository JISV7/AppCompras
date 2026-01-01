import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, Pressable, Platform, KeyboardAvoidingView, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { StoreSelectorModal } from '../stores/StoreSelectorModal';

interface EnrichedListItem {
    item_id: string;
    product_barcode: string;
    quantity: number;
    productName?: string;
    productImage?: string;
    estimatedPrice?: number; // Average
    predictedPrice?: number; // AI / Exchange Rate 
    added_at?: string; // We'll pass this string
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
}

export function ListItemSheet({ visible, item, onClose, onUpdateItem, priceLocked = false }: ListItemSheetProps) {
    const insets = useSafeAreaInsets();
    const sheetColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'textMain');
    const subTextColor = '#888';
    const primaryColor = useThemeColor({}, 'primary');

    const [isEditingQty, setIsEditingQty] = useState(false);
    const [qtyValue, setQtyValue] = useState('');

    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [priceValue, setPriceValue] = useState('');

    const [isPurchasedState, setIsPurchasedState] = useState(item?.is_purchased || false);
    const [selectedStoreId, setSelectedStoreId] = useState(item?.store_id || null);
    const [storeSelectorVisible, setStoreSelectorVisible] = useState(false);

    const saveLock = React.useRef(false);

    useEffect(() => {
        if (visible) {
            setIsEditingQty(false);
            setIsEditingPrice(false);
            setQtyValue('');
            setPriceValue('');
            setIsPurchasedState(item?.is_purchased || false);
            setSelectedStoreId(item?.store_id || null);
        }
    }, [visible, item]);

    if (!item) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown';

        const isoUtcString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
        const date = new Date(isoUtcString);

        const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };

        const formattedDate = date.toLocaleDateString(undefined, dateOptions);
        const formattedTime = date.toLocaleTimeString(undefined, timeOptions);

        return `${formattedDate}, ${formattedTime}`;
    };

    const handleQtyPress = () => {
        if (isPurchasedState) {
            Alert.alert("Item Comprado", "Desmarca como comprado para editar la cantidad.");
            return;
        }
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
            Alert.alert("Inválido", "1-99");
            setIsEditingQty(false);
        }
    };

    const handlePricePress = () => {
        if (priceLocked) {
            Alert.alert("Precio Bloqueado", "La lista está completada. Reabre la lista para editar el precio.");
            return;
        }
        if (isPurchasedState) {
            Alert.alert("Item Comprado", "Desmarca como comprado para editar el precio.");
            return;
        }
        if (onUpdateItem) {
            saveLock.current = false;
            const currentPrice = item.planned_price ?? item.estimatedPrice ?? 0;
            setPriceValue(currentPrice.toString());
            setIsEditingPrice(true);
        }
    };

    const handleSavePrice = () => {
        if (saveLock.current) return;

        if (priceValue === '' || priceValue === '0') {
             saveLock.current = true;
             onUpdateItem?.({ planned_price: null });
             setIsEditingPrice(false);
             return;
        }

        const price = parseFloat(priceValue);
        if (!isNaN(price) && price >= 0) {
            if (price !== item.planned_price) {
                saveLock.current = true;
                onUpdateItem?.({ planned_price: price });
            }
            setIsEditingPrice(false);
        } else {
            Alert.alert("Precio Inválido", "Debe ser 0 o mayor");
            setIsEditingPrice(false);
        }
    };

    const handleTogglePurchased = (newValue: boolean) => {
        setIsPurchasedState(newValue);
        onUpdateItem?.({ is_purchased: newValue, store_id: selectedStoreId });
    };

    const handleSelectStore = (store: any) => {
        setSelectedStoreId(store.store_id);
        setStoreSelectorVisible(false);
        onUpdateItem?.({ store_id: store.store_id });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlayWrapper}>
                <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} onPress={onClose}>
                    <Pressable style={[styles.sheet, { backgroundColor: sheetColor, paddingBottom: insets.bottom + 20 }]} onPress={(e) => e.stopPropagation()}>

                        <View style={styles.handle} />

                        <View style={styles.header}>
                            <Text style={[styles.title, { color: textColor }]}>Detalle del Item</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close-circle" size={30} color={subTextColor} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            {/* Product Info */}
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

                            {/* Stats Grid */}
                            <View style={styles.grid}>
                                {/* QTY BOX */}
                                <TouchableOpacity
                                    style={[styles.statBox, { backgroundColor: '#F5F5F5', borderColor: primaryColor, borderWidth: 1 }]}
                                    onPress={handleQtyPress}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.statLabel}>Cant. (Toca)</Text>
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

                                {/* PRICE BOX - EDITABLE */}
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
                                            onChangeText={setPriceValue}
                                            keyboardType="decimal-pad"
                                            autoFocus
                                            onSubmitEditing={handleSavePrice}
                                            selectTextOnFocus
                                        />
                                    ) : (
                                        <View>
                                            <Text style={[styles.statValue, { color: primaryColor }]}>
                                                ${(item.planned_price ?? item.estimatedPrice ?? 0).toFixed(2)}
                                            </Text>
                                            {item.planned_price !== undefined && item.planned_price !== null && (
                                                <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>(Editado)</Text>
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* PREDICTIVE BOX */}
                                <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
                                    <Text style={styles.statLabel}>Predictivo</Text>
                                    <Text style={[styles.statValue, { color: '#2E7D32' }]}>
                                        ${item.predictedPrice ? item.predictedPrice.toFixed(2) : '-'}
                                    </Text>
                                </View>
                            </View>

                            {/* Added At Info */}
                            <View style={[styles.detailRow, { borderBottomColor: '#eee', borderBottomWidth: 1 }]}>
                                <Text style={{ color: subTextColor }}>Agregado el</Text>
                                <Text style={{ color: textColor, fontWeight: '500' }}>{formatDate(item.added_at)}</Text>
                            </View>

                            {/* Is Purchased Toggle */}
                            <View style={[styles.detailRow, { borderBottomColor: '#eee', borderBottomWidth: 1 }]}>
                                <Text style={{ color: subTextColor }}>¿Comprado?</Text>
                                <Switch
                                    onValueChange={handleTogglePurchased}
                                    value={isPurchasedState}
                                    trackColor={{ false: '#767577', true: primaryColor }}
                                    thumbColor={isPurchasedState ? '#f4f3f4' : '#f4f3f4'}
                                    disabled={false}
                                />
                            </View>

                            {/* Store Selection */}
                            <TouchableOpacity 
                                style={styles.detailRow} 
                                onPress={() => setStoreSelectorVisible(true)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialIcons name="storefront" size={20} color={subTextColor} />
                                    <Text style={{ color: subTextColor }}>Tienda</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ color: textColor, fontWeight: '500' }}>
                                        {item.storeName || 'Seleccionar...'}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={subTextColor} />
                                </View>
                            </TouchableOpacity>
                        </ScrollView>

                        <StoreSelectorModal
                            visible={storeSelectorVisible}
                            onClose={() => setStoreSelectorVisible(false)}
                            onSelect={handleSelectStore}
                        />
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlayWrapper: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
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
    grid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statBox: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
    statValue: { fontSize: 20, fontWeight: 'bold', lineHeight: 28 }, 
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, alignItems: 'center' }
});