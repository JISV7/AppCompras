import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

interface UserProfile {
  full_name?: string;
  username?: string;
  email: string;
  user_id?: string;
}

interface ProfileSheetProps {
  visible: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileSheet({ visible, user, onClose, onLogout }: ProfileSheetProps) {
  const sheetColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textMain');
  const subTextColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Backdrop sibling to prevent gesture conflicts */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        {/* The Sheet */}
        <View style={[styles.sheet, { backgroundColor: sheetColor }]}>
          
          {/* Handle */}
          <View style={styles.handle} />

          {/* 1. User Header */}
          <View style={styles.header}>
            <View style={[styles.avatarContainer, { backgroundColor: primaryColor }]}>
              <Text style={styles.avatarText}>
                {user?.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : user?.username
                    ? user.username.charAt(0).toUpperCase()
                    : "U"}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: textColor }]}>
                {user?.full_name || user?.username || "Usuario"}
              </Text>
              <Text style={[styles.userEmail, { color: subTextColor }]}>
                {user?.email || "Sin correo"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: cardColor }]} />

          {/* 2. Menu Options */}
          <View style={styles.menu}>
            
            {/* Account Settings */}
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <FontAwesome5 name="user-cog" size={18} color="#1976D2" />
              </View>
              <Text style={[styles.menuText, { color: textColor }]}>Ajustes de Cuenta</Text>
              <Ionicons name="chevron-forward" size={20} color={subTextColor} />
            </TouchableOpacity>

            {/* App Settings */}
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="settings-sharp" size={20} color="#7B1FA2" />
              </View>
              <Text style={[styles.menuText, { color: textColor }]}>Preferencias de la App</Text>
              <Ionicons name="chevron-forward" size={20} color={subTextColor} />
            </TouchableOpacity>

            {/* Help / About */}
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}>
                <FontAwesome5 name="question" size={18} color="#00796B" />
              </View>
              <Text style={[styles.menuText, { color: textColor }]}>Ayuda y Soporte</Text>
              <Ionicons name="chevron-forward" size={20} color={subTextColor} />
            </TouchableOpacity>

          </View>

          {/* 3. Logout Button */}
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: '#FFEBEE' }]} 
            onPress={onLogout}
          >
            <MaterialIcons name="logout" size={20} color="#D32F2F" />
            <Text style={[styles.logoutText, { color: '#D32F2F' }]}>Cerrar Sesión</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' 
  },
  sheet: { 
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, elevation: 10
  },
  handle: { 
    width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 
  },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { 
    width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginRight: 15 
  },
  avatarText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold' },
  userEmail: { fontSize: 14 },

  divider: { height: 1, width: '100%', marginBottom: 20 },

  // Menu
  menu: { gap: 15, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { 
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 
  },
  menuText: { fontSize: 16, fontWeight: '500', flex: 1 },

  // Logout
  logoutButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 15, borderRadius: 16, gap: 10 
  },
  logoutText: { fontWeight: 'bold', fontSize: 16 }
});
