import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getExchangeRateHistory } from '@/services/api';

interface ExchangeRateRecord {
    rate_id: string;
    currency_code: string;
    rate_to_ves: string;
    source: string;
    recorded_at: string;
}

interface ExchangeRateHistorySheetProps {
    visible: boolean;
    onClose: () => void;
}

export function ExchangeRateHistorySheet({ visible, onClose }: ExchangeRateHistorySheetProps) {
    const sheetColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'textMain');
    const subTextColor = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'surfaceLight');

    const [history, setHistory] = useState<ExchangeRateRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            fetchHistory();
        }
    }, [visible]);

    const fetchHistory = async () => {
        setLoading(true);
        const data = await getExchangeRateHistory(50);
        setHistory(data);
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z');
        return date.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderItem = ({ item }: { item: ExchangeRateRecord }) => (
        <View style={[styles.historyRow, { borderBottomColor: cardColor }]}>
            <View>
                <Text style={[styles.dateText, { color: textColor }]}>{formatDate(item.recorded_at)}</Text>
                <Text style={[styles.sourceText, { color: subTextColor }]}>{item.source}</Text>
            </View>
            <Text style={[styles.rateText, { color: primaryColor }]}>
                {parseFloat(item.rate_to_ves).toFixed(2)} Bs
            </Text>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
            <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} onPress={onClose}>
                <Pressable style={[styles.sheet, { backgroundColor: sheetColor }]} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>Histórico de Tasa</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={30} color={subTextColor} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={history}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.rate_id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={{ textAlign: 'center', color: subTextColor, marginTop: 50 }}>
                                    No hay datos históricos disponibles.
                                </Text>
                            }
                        />
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '80%', paddingBottom: 40 },
    handle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 'bold' },
    listContent: { paddingBottom: 20 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    dateText: { fontSize: 16, fontWeight: '600' },
    sourceText: { fontSize: 12 },
    rateText: { fontSize: 18, fontWeight: 'bold' }
});
