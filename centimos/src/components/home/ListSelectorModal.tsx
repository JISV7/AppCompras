import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { createList, getMyLists, type ShoppingList } from "@/services/lists";

interface ListSelectorModalProps {
	visible: boolean;
	onClose: () => void;
	onSelect: (listId: string) => void;
}

export function ListSelectorModal({
	visible,
	onClose,
	onSelect,
}: ListSelectorModalProps) {
	const bgColor = useThemeColor({}, "background");
	const textColor = useThemeColor({}, "textMain");
	const subTextColor = useThemeColor({}, "textSecondary");
	const primaryColor = useThemeColor({}, "primary");
	const cardColor = useThemeColor({}, "surfaceLight");

	const [lists, setLists] = useState<ShoppingList[]>([]);
	const [loading, setLoading] = useState(false);

	// New List State
	const [showCreate, setShowCreate] = useState(false);
	const [newListName, setNewListName] = useState("");
	const [newListBudget, setNewListBudget] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const fetchLists = useCallback(async () => {
		setLoading(true);
		try {
			const allLists = await getMyLists();
			const activeLists = allLists.filter((l) => l.status === "ACTIVE");
			setLists(activeLists);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (visible) {
			fetchLists();
			setShowCreate(false);
			setNewListName("");
			setNewListBudget("");
		}
	}, [visible, fetchLists]);

	const handleCreateAndSelect = async () => {
		if (!newListName.trim()) return;

		setIsCreating(true);
		try {
			const budget = newListBudget ? parseFloat(newListBudget) : undefined;
			const newList = await createList(newListName.trim(), budget);
			onSelect(newList.list_id);
		} catch {
			Alert.alert("Error", "No se pudo crear la lista");
		} finally {
			setIsCreating(false);
		}
	};

	const renderItem = ({ item }: { item: ShoppingList }) => (
		<TouchableOpacity
			style={[styles.listCard, { backgroundColor: cardColor }]}
			onPress={() => onSelect(item.list_id)}
		>
			<View style={styles.iconBox}>
				<MaterialIcons name="playlist-add" size={24} color={primaryColor} />
			</View>
			<View style={styles.info}>
				<Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
				<Text style={[styles.details, { color: subTextColor }]}>
					{item.items?.length || 0} artículos • {item.currency}
					{item.budget_limit || "0"}
				</Text>
			</View>
			<Ionicons name="chevron-forward" size={20} color="#ccc" />
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
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.overlayWrapper}
			>
				<View style={styles.overlay}>
					<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

					<View style={[styles.content, { backgroundColor: bgColor }]}>
						<View style={styles.header}>
							<Text style={[styles.title, { color: textColor }]}>
								Agregar a la lista...
							</Text>
							<TouchableOpacity onPress={onClose}>
								<Ionicons name="close" size={24} color={subTextColor} />
							</TouchableOpacity>
						</View>

						{loading ? (
							<ActivityIndicator color={primaryColor} style={{ margin: 20 }} />
						) : (
							<FlatList
								data={lists}
								renderItem={renderItem}
								keyExtractor={(item) => item.list_id}
								ListEmptyComponent={
									<View style={styles.empty}>
										<Text style={{ textAlign: "center", color: subTextColor }}>
											No tienes listas abiertas.
										</Text>
									</View>
								}
								contentContainerStyle={{ paddingBottom: 10 }}
								style={{ maxHeight: 300 }}
							/>
						)}

						<View style={[styles.divider, { backgroundColor: cardColor }]} />

						{showCreate ? (
							<View style={styles.createContainer}>
								<TextInput
									style={[
										styles.input,
										{ backgroundColor: cardColor, color: textColor },
									]}
									placeholder="Nombre de la nueva lista"
									placeholderTextColor="#999"
									value={newListName}
									onChangeText={setNewListName}
									autoFocus
								/>
								<TextInput
									style={[
										styles.input,
										{ backgroundColor: cardColor, color: textColor },
									]}
									placeholder="Límite de presupuesto (Opcional)"
									placeholderTextColor="#999"
									value={newListBudget}
									onChangeText={setNewListBudget}
									keyboardType="numeric"
								/>
								<View style={styles.createButtons}>
									<TouchableOpacity
										style={styles.cancelBtn}
										onPress={() => setShowCreate(false)}
									>
										<Text style={{ color: subTextColor }}>Cancelar</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.confirmBtn,
											{ backgroundColor: primaryColor },
										]}
										onPress={handleCreateAndSelect}
										disabled={isCreating || !newListName.trim()}
									>
										{isCreating ? (
											<ActivityIndicator color="white" size="small" />
										) : (
											<Text style={styles.confirmBtnText}>Crear y agregar</Text>
										)}
									</TouchableOpacity>
								</View>
							</View>
						) : (
							<TouchableOpacity
								style={[styles.createToggle, { borderColor: primaryColor }]}
								onPress={() => setShowCreate(true)}
							>
								<Ionicons name="add-circle" size={20} color={primaryColor} />
								<Text
									style={[styles.createToggleText, { color: primaryColor }]}
								>
									Crear nueva lista
								</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlayWrapper: { flex: 1 },
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.7)",
		justifyContent: "center",
		padding: 20,
	},
	content: {
		borderRadius: 24,
		padding: 20,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 5,
		width: "100%",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
	},
	title: { fontSize: 18, fontWeight: "bold" },
	listCard: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 16,
		marginBottom: 8,
	},
	iconBox: {
		width: 40,
		height: 40,
		borderRadius: 10,
		backgroundColor: "#E8F5E9",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	info: { flex: 1 },
	name: { fontSize: 15, fontWeight: "600" },
	details: { fontSize: 12, marginTop: 2 },
	empty: { padding: 20, alignItems: "center" },

	divider: { height: 1, marginVertical: 15 },

	createToggle: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderStyle: "dashed",
		gap: 8,
	},
	createToggleText: { fontWeight: "bold" },

	createContainer: { gap: 12 },
	input: { padding: 12, borderRadius: 12, fontSize: 16 },
	createButtons: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 12,
		alignItems: "center",
	},
	cancelBtn: { padding: 10 },
	confirmBtn: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 10,
		minWidth: 120,
		alignItems: "center",
	},
	confirmBtnText: { color: "white", fontWeight: "bold" },
});
