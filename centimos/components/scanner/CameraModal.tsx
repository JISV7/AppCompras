import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (data: { type: string; data: string }) => void;
}

export function CameraModal({ visible, onClose, onBarcodeScanned }: CameraModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        
        {/* 1. The Camera (Background) */}
        <CameraView
          style={StyleSheet.absoluteFill} // Fills the whole screen
          facing="back"
          onBarcodeScanned={onBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
          }}
        />

        {/* 2. The Overlay (Foreground - Siblings, not Children!) */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.instruction}>Align barcode within frame</Text>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  overlay: {
    ...StyleSheet.absoluteFillObject, // Sits exactly on top of camera
    backgroundColor: 'rgba(0,0,0,0.5)', // Darken background
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250, height: 250,
    borderWidth: 2, borderColor: 'white', borderRadius: 20,
    backgroundColor: 'transparent'
  },
  instruction: {
    color: 'white', marginTop: 20, fontSize: 16, fontWeight: '500'
  },
  closeButton: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8
  }
});