import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ConverterSheetProps {
    visible: boolean;
    rate: number;
    onClose: () => void;
}

export function ConverterSheet({ visible, rate, onClose }: ConverterSheetProps) {
    const sheetColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'textMain');
    const subTextColor = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'surfaceLight');

    const [usd, setUsd] = useState('1.000');
    const [ves, setVes] = useState(rate.toFixed(3));

    useEffect(() => {
        if (visible) {
            setUsd('1.000');
            setVes(rate.toFixed(3));
        }
    }, [visible, rate]);

    const handleUsdChange = (val: string) => {
        const cleanVal = val.replace(',', '.');
        setUsd(cleanVal);
        if (cleanVal && !isNaN(parseFloat(cleanVal))) {
            setVes((parseFloat(cleanVal) * rate).toFixed(3));
        } else {
            setVes('');
        }
    };

    const handleVesChange = (val: string) => {
        const cleanVal = val.replace(',', '.');
        setVes(cleanVal);
        if (cleanVal && !isNaN(parseFloat(cleanVal))) {
            setUsd((parseFloat(cleanVal) / rate).toFixed(3));
        } else {
            setUsd('');
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.content, { backgroundColor: sheetColor }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>Calculadora de Divisas</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color={subTextColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.rateInfo}>
                        <Text style={{ color: subTextColor }}>Tasa aplicada: </Text>
                        <Text style={{ color: primaryColor, fontWeight: 'bold' }}>{rate.toFixed(3)} Bs/$</Text>
                    </View>

                    <View style={styles.converterContainer}>
                        {/* USD Input */}
                        <View style={[styles.inputWrapper, { backgroundColor: cardColor }]}>
                            <View style={styles.labelRow}>
                                <MaterialCommunityIcons name="currency-usd" size={20} color={primaryColor} />
                                <Text style={[styles.inputLabel, { color: subTextColor }]}>Dólares (USD)</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={usd}
                                onChangeText={handleUsdChange}
                                keyboardType="decimal-pad"
                                placeholder="0.000"
                                placeholderTextColor="#999"
                                selectTextOnFocus
                            />
                        </View>

                        <View style={styles.swapIcon}>
                            <Ionicons name="swap-vertical" size={24} color={subTextColor} />
                        </View>

                        {/* VES Input */}
                        <View style={[styles.inputWrapper, { backgroundColor: cardColor }]}>
                            <View style={styles.labelRow}>
                                <MaterialCommunityIcons name="currency-bdt" size={20} color="#388E3C" />
                                <Text style={[styles.inputLabel, { color: subTextColor }]}>Bolívares (VES)</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={ves}
                                onChangeText={handleVesChange}
                                keyboardType="decimal-pad"
                                placeholder="0.000"
                                placeholderTextColor="#999"
                                selectTextOnFocus
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.closeBtn, { backgroundColor: primaryColor }]} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Listo</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    content: { borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    title: { fontSize: 20, fontWeight: 'bold' },
    rateInfo: { flexDirection: 'row', marginBottom: 25, alignItems: 'center' },
    converterContainer: { gap: 10 },
    inputWrapper: { padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
    inputLabel: { fontSize: 12, fontWeight: '600' },
    input: { fontSize: 24, fontWeight: 'bold', padding: 0 },
    swapIcon: { alignSelf: 'center', height: 30, justifyContent: 'center' },
    closeBtn: { marginTop: 25, paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
    closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});