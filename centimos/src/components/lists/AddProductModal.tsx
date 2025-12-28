import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

interface AddProductModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (barcode: string) => void;
}

export function AddProductModal({ visible, onClose, onSubmit }: AddProductModalProps) {
    const [code, setCode] = useState('');
    const bgColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'textMain');
    const primaryColor = useThemeColor({}, 'primary');

    const handleAdd = () => {
        if (code.trim()) {
            onSubmit(code.trim());
            setCode('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
                    <Text style={[styles.title, { color: textColor }]}>Enter Barcode</Text>

                    <TextInput
                        style={[styles.input, { borderColor: primaryColor, color: textColor }]}
                        placeholder="Type barcode number..."
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={code}
                        onChangeText={setCode}
                        autoFocus
                        onSubmitEditing={handleAdd}
                    />

                    <View style={styles.buttonsRow}>
                        <TouchableOpacity onPress={onClose} style={styles.button}>
                            <Text style={{ color: '#666' }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleAdd}
                            style={[styles.button, styles.addButton, { backgroundColor: primaryColor }]}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center'
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center'
    },
    addButton: {

    }
});
