import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useState } from 'react';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import api from '@/services/api';

export default function CreateProductScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams<{ barcode: string }>(); // Receive the barcode
  
  // Theme colors
  const bgColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const inputBg = useThemeColor({}, 'surfaceLight');
  const primaryColor = useThemeColor({}, 'primary');

  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Info", "Please enter a product name.");
      return;
    }

    setLoading(true);
    try {
      // POST to backend
      await api.post('/products/', {
        barcode: barcode,
        name: name,
        brand: brand || null,
        category: category || null,
        image_url: null 
      });

      Alert.alert("Success", "Product saved!", [
        { text: "OK", onPress: () => router.back() } // Return to scanner
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Configure the header title */}
      <Stack.Screen options={{ title: 'Add New Product', headerBackTitle: 'Scan' }} />
      
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>
        
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.circle, { backgroundColor: inputBg }]}>
            <FontAwesome5 name="box-open" size={40} color={primaryColor} />
          </View>
        </View>

        {/* Read-only Barcode */}
        <Text style={[styles.label, { color: subTextColor }]}>Barcode</Text>
        <View style={[styles.readOnlyBox, { backgroundColor: inputBg, borderColor: primaryColor }]}>
           <Ionicons name="barcode-outline" size={24} color={textColor} />
           <Text style={[styles.barcodeText, { color: textColor }]}>{barcode}</Text>
        </View>

        {/* Name Input */}
        <Text style={[styles.label, { color: subTextColor }]}>Product Name *</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="e.g. Harina PAN"
          placeholderTextColor={subTextColor}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        {/* Brand Input */}
        <Text style={[styles.label, { color: subTextColor }]}>Brand (Optional)</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="e.g. Empresas Polar"
          placeholderTextColor={subTextColor}
          value={brand}
          onChangeText={setBrand}
        />

        {/* Category Input */}
        <Text style={[styles.label, { color: subTextColor }]}>Category (Optional)</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="e.g. Pantry, Snacks, Drinks"
          placeholderTextColor={subTextColor}
          value={category}
          onChangeText={setCategory}
        />

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="white" />
          ) : (
             <Text style={styles.saveButtonText}>Save Product</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  circle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: { 
    height: 54, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 20 
  },
  readOnlyBox: {
    flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 12, 
    paddingHorizontal: 16, marginBottom: 20, borderWidth: 1, gap: 10, opacity: 0.8
  },
  barcodeText: { fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold' },

  saveButton: {
    height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 4
  },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});