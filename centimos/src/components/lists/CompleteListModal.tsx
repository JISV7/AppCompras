import { Ionicons } from "@expo/vector-icons";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

interface Store {
	store_id: string;
	name: string;
	address?: string;
}

interface CompleteListModalProps {
	visible: boolean;
	onClose: () => void;
	onConfirm: () => void;
	loading: boolean;
	storeSearchQuery: string;
	onStoreSearch: (text: string) => void;
	storeSearchResults: Store[];
	nearbyStores: Store[];
	selectedStoreId: string | null;
	onSelectStore: (storeId: string) => void;
	isNearbyExpanded: boolean;
	onToggleNearby: () => void;
}

export function CompleteListModal({
	visible,
	onClose,
	onConfirm,
	loading,
	storeSearchQuery,
	onStoreSearch,
	storeSearchResults,
	nearbyStores,
	selectedStoreId,
	onSelectStore,
	isNearbyExpanded,
	onToggleNearby,
}: CompleteListModalProps) {
	const bgColor = useThemeColor({}, "background");
	const cardColor = useThemeColor({}, "surfaceLight");
	const textColor = useThemeColor({}, "textMain");
	const subTextColor = useThemeColor({}, "textSecondary");
	const primaryColor = useThemeColor({}, "primary");

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<Pressable style={styles.modalOverlay} onPress={onClose}>
				<Pressable
					style={[styles.completeModalContent, { backgroundColor: cardColor }]}
					onPress={(e) => e.stopPropagation()}
				>
					<Text style={[styles.completeModalTitle, { color: textColor }]}>
						Finalizar Lista
					</Text>
					<Text style={[styles.completeModalSubtitle, { color: subTextColor }]}>
						Marcar todos los artículos como comprados en una misma tienda.
					</Text>

					<ScrollView
						style={{ width: "100%" }}
						showsVerticalScrollIndicator={false}
						nestedScrollEnabled
					>
						<View style={styles.storeSelectContainer}>
							<Text style={[styles.storeSelectLabel, { color: textColor }]}>
								Comprado en:
							</Text>

							<View
								style={[styles.modalSearchBar, { backgroundColor: bgColor }]}
							>
								<Ionicons name="search" size={18} color={subTextColor} />
								<TextInput
									style={[styles.modalSearchInput, { color: textColor }]}
									placeholder="Buscar nombre/dirección de tienda..."
									placeholderTextColor="#999"
									value={storeSearchQuery}
									onChangeText={onStoreSearch}
								/>
							</View>

							{storeSearchResults.length > 0 ? (
								<View style={styles.searchResultsContainer}>
									{storeSearchResults.map((store) => (
										<TouchableOpacity
											key={store.store_id}
											style={[
												styles.searchResultItem,
												selectedStoreId === store.store_id && {
													backgroundColor: `${primaryColor}22`,
												},
											]}
											onPress={() => onSelectStore(store.store_id)}
										>
											<Text
												style={[styles.searchResultText, { color: textColor }]}
											>
												{store.name}
											</Text>
											<Text
												style={styles.searchResultAddress}
												numberOfLines={1}
											>
												{store.address}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							) : selectedStoreId && !isNearbyExpanded ? (
								<View
									style={[
										styles.selectedStoreRow,
										{
											backgroundColor: `${primaryColor}11`,
											borderColor: primaryColor,
										},
									]}
								>
									<Ionicons
										name="checkmark-circle"
										size={20}
										color={primaryColor}
									/>
									<Text
										style={{
											color: textColor,
											fontWeight: "bold",
											marginLeft: 8,
										}}
									>
										{nearbyStores.find((s) => s.store_id === selectedStoreId)
											?.name ||
											storeSearchResults.find(
												(s) => s.store_id === selectedStoreId,
											)?.name ||
											"Tienda Seleccionada"}
									</Text>
								</View>
							) : null}

							<TouchableOpacity
								style={styles.nearbyToggle}
								onPress={onToggleNearby}
							>
								<Text style={{ color: primaryColor, fontWeight: "bold" }}>
									{isNearbyExpanded
										? "Ocultar Cercanas"
										: "Mostrar Tiendas Cercanas"}
								</Text>
								<Ionicons
									name={isNearbyExpanded ? "chevron-up" : "chevron-down"}
									size={16}
									color={primaryColor}
								/>
							</TouchableOpacity>

							{isNearbyExpanded && (
								<View style={styles.nearbyList}>
									{nearbyStores.length > 0 ? (
										nearbyStores.map((store) => (
											<TouchableOpacity
												key={store.store_id}
												style={[
													styles.searchResultItem,
													selectedStoreId === store.store_id && {
														backgroundColor: `${primaryColor}22`,
													},
												]}
												onPress={() => onSelectStore(store.store_id)}
											>
												<Text
													style={[
														styles.searchResultText,
														{ color: textColor },
													]}
												>
													{store.name}
												</Text>
												<Text
													style={styles.searchResultAddress}
													numberOfLines={1}
												>
													{store.address || "Dirección no disponible"}
												</Text>
											</TouchableOpacity>
										))
									) : (
										<Text
											style={{
												color: subTextColor,
												textAlign: "center",
												fontSize: 12,
											}}
										>
											No se encontraron tiendas cercanas.
										</Text>
									)}
								</View>
							)}
						</View>
					</ScrollView>

					<View style={{ width: "100%", marginTop: 10 }}>
						<TouchableOpacity
							style={[
								styles.completeButton,
								{
									backgroundColor: primaryColor,
									opacity: loading || !selectedStoreId ? 0.7 : 1,
								},
							]}
							onPress={onConfirm}
							disabled={loading || !selectedStoreId}
						>
							{loading ? (
								<ActivityIndicator color="white" />
							) : (
								<Text style={styles.completeButtonText}>
									Confirmar Finalización
								</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.cancelCompleteButton}
							onPress={onClose}
							disabled={loading}
						>
							<Text
								style={[
									styles.cancelCompleteButtonText,
									{ color: subTextColor },
								]}
							>
								Cancelar
							</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.7)",
		justifyContent: "center",
		alignItems: "center",
	},
	completeModalContent: {
		width: "90%",
		maxWidth: 400,
		maxHeight: "80%",
		borderRadius: 24,
		padding: 20,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 8,
	},
	completeModalTitle: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 8,
	},
	completeModalSubtitle: {
		fontSize: 14,
		textAlign: "center",
		marginBottom: 15,
		lineHeight: 20,
	},
	storeSelectContainer: {
		width: "100%",
		paddingBottom: 10,
	},
	storeSelectLabel: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 12,
		textAlign: "center",
	},
	modalSearchBar: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 14,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#eee",
	},
	modalSearchInput: {
		flex: 1,
		marginLeft: 8,
		fontSize: 14,
	},
	searchResultsContainer: {
		marginBottom: 12,
	},
	searchResultItem: {
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		borderRadius: 8,
	},
	searchResultText: {
		fontSize: 14,
		fontWeight: "600",
	},
	searchResultAddress: {
		fontSize: 11,
		color: "#888",
	},
	selectedStoreRow: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 10,
	},
	nearbyToggle: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
		paddingVertical: 8,
	},
	nearbyList: {
		marginTop: 10,
		marginBottom: 15,
		gap: 8,
	},
	completeButton: {
		width: "100%",
		paddingVertical: 15,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 5,
	},
	completeButtonText: {
		color: "white",
		fontSize: 17,
		fontWeight: "bold",
	},
	cancelCompleteButton: {
		paddingVertical: 8,
		alignItems: "center",
	},
	cancelCompleteButtonText: {
		fontSize: 15,
		fontWeight: "500",
	},
});
