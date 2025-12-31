import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { createStore } from '@/services/api';

interface CreateStoreModalProps {
  visible: boolean;
  onClose: () => void;
  onStoreCreated: () => void;
}

export function CreateStoreModal({ visible, onClose, onStoreCreated }: CreateStoreModalProps) {
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setAddress('');
      setLocation(null);
      fetchLocation();
    }
  }, [visible]);

  const fetchLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.log('Error fetching location', error);
      Alert.alert('Could not fetch location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return;
    }
    if (!location) {
        Alert.alert('Error', 'Location is required to create a store. Please ensure GPS is enabled.');
        return;
    }

    setSubmitting(true);
    try {
      await createStore(
        name, 
        address, 
        location.coords.latitude, 
        location.coords.longitude
      );
      Alert.alert('Success', 'Store created successfully!');
      onStoreCreated();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create store. It might already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Add New Store</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={subTextColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Location Status */}
            <View style={[styles.locationBox, { backgroundColor: cardColor, borderColor: location ? primaryColor : '#ccc' }]}>
                {loadingLocation ? (
                    <View style={styles.row}>
                        <ActivityIndicator color={primaryColor} size="small" />
                        <Text style={{ marginLeft: 10, color: subTextColor }}>Getting GPS...</Text>
                    </View>
                ) : location ? (
                    <View style={styles.row}>
                        <Ionicons name="location" size={20} color={primaryColor} />
                        <Text style={{ marginLeft: 10, color: textColor, fontWeight: '500' }}>
                            {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.row} onPress={fetchLocation}>
                        <Ionicons name="warning" size={20} color="orange" />
                         <Text style={{ marginLeft: 10, color: 'orange' }}>Location not found. Tap to retry.</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text style={[styles.label, { color: subTextColor }]}>Store Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: cardColor, color: textColor }]}
              placeholder="e.g. Supermercado Vida"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: subTextColor }]}>Address / Reference (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: cardColor, color: textColor, height: 80 }]}
              placeholder="e.g. Av. Bolivar, next to the bank"
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
              multiline
            />

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: primaryColor, opacity: (submitting || !location) ? 0.6 : 1 }]}
              onPress={handleCreate}
              disabled={submitting || !location}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createButtonText}>Create Store</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  locationBox: {
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 20,
      justifyContent: 'center',
      alignItems: 'center'
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
