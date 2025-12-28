import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, Pressable, Platform, KeyboardAvoidingView, TextInput, Alert } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState, useEffect } from 'react';

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
}

interface ListItemSheetProps {
    visible: boolean;
    item: EnrichedListItem | null;
    onClose: () => void;
    onUpdateQuantity?: (newQty: number) => void;
    onUpdatePrice?: (newPrice: number) => void;
}

export function ListItemSheet({ visible, item, onClose, onUpdateQuantity, onUpdatePrice }: ListItemSheetProps) {
    const sheetColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'textMain');
    const subTextColor = '#888';
    const primaryColor = useThemeColor({}, 'primary');

    const [isEditingQty, setIsEditingQty] = useState(false);
    const [qtyValue, setQtyValue] = useState('');

    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [priceValue, setPriceValue] = useState('');

    const saveLock = React.useRef(false);

    useEffect(() => {
        if (visible) {
            setIsEditingQty(false);
            setIsEditingPrice(false);
            setQtyValue('');
            setPriceValue('');
        }
    }, [visible]);

    if (!item) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleString();
    };

    // --- QTY Handlers ---
    const handleQtyPress = () => {
        if (onUpdateQuantity) {
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
                onUpdateQuantity?.(num);
            }
            setIsEditingQty(false);
        } else {
            Alert.alert("Invalid", "1-99");
            setIsEditingQty(false);
        }
    };

    // --- Price Handlers ---
    const handlePricePress = () => {
        if (onUpdatePrice) {
            saveLock.current = false;
            const currentPrice = item.planned_price ?? item.estimatedPrice ?? 0;
            setPriceValue(currentPrice.toString());
            setIsEditingPrice(true);
        }
    };

    const handleSavePrice = () => {
        if (saveLock.current) return;

        const price = parseFloat(priceValue);
        if (!isNaN(price) && price >= 0) {
            if (price !== item.planned_price) {
                saveLock.current = true;
                onUpdatePrice?.(price);
            }
            setIsEditingPrice(false);
        } else {
            Alert.alert("Invalid Price", "Must be 0 or greater");
            setIsEditingPrice(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlayWrapper}>
                <Pressable style={styles.overlay} onPress={onClose}>
                    <Pressable style={[styles.sheet, { backgroundColor: sheetColor }]} onPress={(e) => e.stopPropagation()}>

                        <View style={styles.handle} />

                        <View style={styles.header}>
                            <Text style={[styles.title, { color: textColor }]}>Item Details</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close-circle" size={30} color={subTextColor} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.content}>
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
                                    <Text style={styles.statLabel}>Qty (Tap to Edit)</Text>
                                    {isEditingQty ? (
                                        <TextInput
                                            style={[styles.statValue, { color: textColor, minWidth: 40, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: primaryColor }]}
                                            value={qtyValue}
                                            onChangeText={(text) => setQtyValue(text.replace(/[^0-9]/g, ''))}
                                            keyboardType="numeric"
                                            autoFocus
                                            onBlur={handleSaveQty}
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
                                    <Text style={styles.statLabel}>Avg. Price (Edit)</Text>
                                    {isEditingPrice ? (
                                        <TextInput
                                            style={[styles.statValue, { color: primaryColor, minWidth: 60, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: primaryColor }]}
                                            value={priceValue}
                                            onChangeText={setPriceValue}
                                            keyboardType="decimal-pad"
                                            autoFocus
                                            onBlur={handleSavePrice}
                                            onSubmitEditing={handleSavePrice}
                                            selectTextOnFocus
                                        />
                                    ) : (
                                        <View>
                                            <Text style={[styles.statValue, { color: primaryColor }]}>
                                                ${(item.planned_price ?? item.estimatedPrice ?? 0).toFixed(2)}
                                            </Text>
                                            {item.planned_price !== undefined && item.planned_price !== null && (
                                                <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>(User Set)</Text>
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* PREDICTIVE BOX */}
                                <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
                                    <Text style={styles.statLabel}>Predictive</Text>
                                    <Text style={[styles.statValue, { color: '#2E7D32' }]}>
                                        ${item.predictedPrice ? item.predictedPrice.toFixed(2) : '-'}
                                    </Text>
                                </View>
                            </View>

                            {/* Added At Info */}
                            <View style={[styles.detailRow, { borderBottomColor: '#eee', borderBottomWidth: 1 }]}>
                                <Text style={{ color: subTextColor }}>Added on</Text>
                                <Text style={{ color: textColor, fontWeight: '500' }}>{formatDate(item.added_at)}</Text>
                            </View>

                        </View>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlayWrapper: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400, paddingBottom: 40 },
    handle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { flex: 1 },
    productRow: { flexDirection: 'row', marginBottom: 25 },
    image: { width: 80, height: 80, borderRadius: 12, backgroundColor: 'white', resizeMode: 'contain' },
    imagePlaceholder: { width: 80, height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    productName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    barcode: { fontSize: 14, fontFamily: 'monospace' },
    grid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statBox: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
    statValue: { fontSize: 20, fontWeight: 'bold', lineHeight: 28 }, // Added lineHeight for input alignment
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 }
});
