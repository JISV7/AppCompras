import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getNearbyStores, searchStores } from "@/services/api";

interface Store {
	store_id: string;
	name: string;
	address?: string;
	latitude?: number;
	longitude?: number;
}

interface StoreSelectorModalProps {
	visible: boolean;
	onClose: () => void;
	onSelect: (store: Store) => void;
}

export function StoreSelectorModal({
	visible,
	onClose,
	onSelect,
}: StoreSelectorModalProps) {
	const bgColor = useThemeColor({}, "background");
	const cardColor = useThemeColor({}, "surfaceLight");
	const textColor = useThemeColor({}, "textMain");
	const subTextColor = useThemeColor({}, "textSecondary");
	const primaryColor = useThemeColor({}, "primary");

	const [stores, setStores] = useState<Store[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const loadInitialStores = useCallback(async () => {
		setLoading(true);
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status === "granted") {
				const location = await Location.getCurrentPositionAsync({});
				const nearby = await getNearbyStores(
					location.coords.latitude,
					location.coords.longitude,
				);
				setStores(nearby);
			} else {
				// Don't list all stores by default if no location
				setStores([]);
			}
		} catch (error) {
			console.error("Error cargando tiendas", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (visible) {
			setSearchQuery("");
			loadInitialStores();
		}
	}, [visible, loadInitialStores]);

	const handleSearch = async (text: string) => {
		setSearchQuery(text);
		if (text.length > 1) {
			setLoading(true);
			try {
				const results = await searchStores(text);
				setStores(results);
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		} else if (text.length === 0) {
			loadInitialStores();
		}
	};

	const renderItem = ({ item }: { item: Store }) => (
		<TouchableOpacity
			style={[styles.item, { borderBottomColor: cardColor }]}
			onPress={() => onSelect(item)}
		>
			<View style={styles.iconBox}>
				<FontAwesome5 name="store" size={16} color={primaryColor} />
			</View>
			<View style={styles.info}>
				<Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
				<Text
					style={[styles.address, { color: subTextColor }]}
					numberOfLines={1}
				>
					{item.address || "Sin dirección"}
				</Text>
			</View>
			<Ionicons name="add-circle-outline" size={24} color={primaryColor} />
		</TouchableOpacity>
	);

	return (
		<Modal
			visible={visible}
			animationType="fade"
			transparent
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<View style={styles.overlay}>
				{/* Sibling backdrop behind the content */}
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

				<View style={[styles.content, { backgroundColor: bgColor }]}>
					<View style={styles.header}>
						<Text style={[styles.title, { color: textColor }]}>
							Seleccionar Tienda
						</Text>
						<TouchableOpacity onPress={onClose}>
							<Ionicons name="close" size={24} color={subTextColor} />
						</TouchableOpacity>
					</View>

					<View style={[styles.searchBar, { backgroundColor: cardColor }]}>
						<Ionicons name="search" size={20} color={subTextColor} />
						<TextInput
							style={[styles.input, { color: textColor }]}
							placeholder="Buscar por nombre o dirección..."
							placeholderTextColor="#999"
							value={searchQuery}
							onChangeText={handleSearch}
						/>
					</View>

					{loading ? (
						<ActivityIndicator color={primaryColor} style={{ margin: 20 }} />
					) : (
						<FlatList
							data={stores}
							renderItem={renderItem}
							keyExtractor={(item) => item.store_id}
							ListEmptyComponent={
								<Text
									style={{
										textAlign: "center",
										color: subTextColor,
										marginTop: 20,
									}}
								>
									{searchQuery.length > 0
										? "No se encontraron coincidencias."
										: "Busca una tienda o activa la ubicación para ver opciones cercanas."}
								</Text>
							}
							contentContainerStyle={{ paddingBottom: 20 }}
						/>
					)}
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.7)",
		justifyContent: "center",
		padding: 20,
	},
	content: {
		borderRadius: 20,
		maxHeight: "80%",
		padding: 20,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 5,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
	},
	title: { fontSize: 18, fontWeight: "bold" },
	searchBar: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		borderRadius: 12,
		marginBottom: 15,
	},
	input: { flex: 1, marginLeft: 10, fontSize: 16 },
	item: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	iconBox: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#E0F2F1",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	info: { flex: 1 },
	name: { fontSize: 16, fontWeight: "600" },
	address: { fontSize: 12 },
});
