import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useState } from 'react';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import api, { uploadImage } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateProductScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams<{ barcode: string }>(); 
  const insets = useSafeAreaInsets();
  
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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permiso requerido", "Has rechazado el acceso a la cámara.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // Native confirmation step
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Falta información", "Por favor ingresa un nombre para el producto.");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = null;

      // 1. Upload Image if exists
      if (imageUri) {
        finalImageUrl = await uploadImage(imageUri);
        if (!finalImageUrl) {
            Alert.alert("Advertencia", "No se pudo subir la imagen. El producto se guardará sin foto.");
        }
      }

      // 2. Save Product
      await api.post('/products/', {
        barcode: barcode,
        name: name,
        brand: brand || null,
        category: category || null,
        image_url: finalImageUrl 
      });

      Alert.alert("Éxito", "¡Producto guardado!", [
        { text: "OK", onPress: () => router.back() } 
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Agregar Producto', headerBackTitle: 'Atrás' }} />
      
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor, paddingBottom: insets.bottom + 20 }]}>
        
        {/* Photo Section */}
        <View style={styles.photoContainer}>
            <TouchableOpacity onPress={pickImage} style={[styles.photoCircle, { backgroundColor: inputBg, borderColor: primaryColor }]}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.photo} />
                ) : (
                    <MaterialIcons name="add-a-photo" size={40} color={primaryColor} />
                )}
            </TouchableOpacity>
            <Text style={[styles.photoLabel, { color: primaryColor }]}>
                {imageUri ? 'Cambiar foto' : 'Agregar foto'}
            </Text>
        </View>

        {/* Read-only Barcode */}
        <Text style={[styles.label, { color: subTextColor }]}>Código de barras</Text>
        <View style={[styles.readOnlyBox, { backgroundColor: inputBg, borderColor: primaryColor }]}>
           <Ionicons name="barcode-outline" size={24} color={textColor} />
           <Text style={[styles.barcodeText, { color: textColor }]}>{barcode}</Text>
        </View>

        {/* Name Input */}
        <Text style={[styles.label, { color: subTextColor }]}>Nombre del producto *</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Ej. Harina PAN"
          placeholderTextColor={subTextColor}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        {/* Brand Input */}
        <Text style={[styles.label, { color: subTextColor }]}>Marca (Opcional)</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Ej. Empresas Polar"
          placeholderTextColor={subTextColor}
          value={brand}
          onChangeText={setBrand}
        />

        {/* Category Input */}
        <Text style={[styles.label, { color: subTextColor }]}>Categoría (Opcional)</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Ej. Despensa, Snacks, Bebidas"
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
             <Text style={styles.saveButtonText}>Guardar Producto</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  
  photoContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  photoCircle: { 
      width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', 
      borderWidth: 2, borderStyle: 'dashed', overflow: 'hidden'
  },
  photo: { width: '100%', height: '100%' },
  photoLabel: { marginTop: 8, fontSize: 14, fontWeight: '600' },

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
    marginTop: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 4
  },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
