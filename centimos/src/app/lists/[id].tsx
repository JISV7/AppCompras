import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Modular Components
import { AddProductModal } from "@/components/lists/AddProductModal";
import { CompleteListModal } from "@/components/lists/CompleteListModal";
import { ListActionMenu } from "@/components/lists/ListActionMenu";
import { ListDetailItem } from "@/components/lists/ListDetailItem";
import { ListItemSheet } from "@/components/lists/ListItemSheet";
import { ListSummary } from "@/components/lists/ListSummary";
import { CameraModal } from "@/components/scanner/CameraModal";
import { useThemeColor } from "@/hooks/use-theme-color";
// Logic
import { useListDetail } from "@/hooks/useListDetail";

export default function ListDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const bgColor = useThemeColor({}, "background");
	const primaryColor = useThemeColor({}, "primary");

	const {
		list,
		items,
		loading,
		totalPrice,
		selectedItem,
		setSelectedItem,
		exchangeRate,
		showActions,
		setShowActions,
		isScanning,
		setIsScanning,
		isManualAdd,
		setIsManualAdd,
		showCompleteModal,
		setShowCompleteModal,
		completingList,
		storeSearchQuery,
		storeSearchResults,
		nearbyStores,
		selectedStoreForCompletion,
		setSelectedStoreForCompletion,
		isNearbyExpanded,
		setIsNearbyExpanded,
		handleBarcodeScanned,
		handleRemoveItem,
		handleCompleteListPress,
		handleStoreSearch,
		handleConfirmCompleteList,
		handleUpdateItem,
		handleReopenList,
	} = useListDetail(id);

	return (
		<View style={[styles.container, { backgroundColor: bgColor }]}>
			<Stack.Screen
				options={{
					title: list?.name || "Cargando...",
					headerBackTitle: "Listas",
				}}
			/>

			<ListSummary
				totalPrice={totalPrice}
				budgetLimit={list?.budget_limit}
				currency={list?.currency}
			/>

			{loading ? (
				<ActivityIndicator size="large" style={{ marginTop: 20 }} />
			) : (
				<FlatList
					data={items}
					renderItem={({ item }) => (
						<ListDetailItem
							item={item}
							onPress={setSelectedItem}
							onRemove={handleRemoveItem}
						/>
					)}
					keyExtractor={(item) => item.item_id}
					style={{ flex: 1 }}
					contentContainerStyle={{
						padding: 15,
						paddingBottom: 120 + insets.bottom,
					}}
					ListFooterComponent={
						items.length > 0 &&
						items.every((i) => i.is_purchased) &&
						list?.status === "ACTIVE" ? (
							<TouchableOpacity
								style={[
									styles.finalizeShortcut,
									{ backgroundColor: primaryColor },
								]}
								onPress={handleCompleteListPress}
							>
								<MaterialIcons name="done-all" size={20} color="white" />
								<Text style={styles.finalizeShortcutText}>Finalizar Lista</Text>
							</TouchableOpacity>
						) : null
					}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<FontAwesome5 name="clipboard-list" size={50} color="#ddd" />
							<Text style={styles.emptyText}>La lista está vacía</Text>
						</View>
					}
				/>
			)}

			<ListActionMenu
				visible={showActions}
				onToggle={() => setShowActions(!showActions)}
				onCompleteList={handleCompleteListPress}
				onManualAdd={() => setIsManualAdd(true)}
				onScan={() => {
					setShowActions(false);
					setIsScanning(true);
				}}
				isCompleted={list?.status === "COMPLETED"}
				hasSelecteditem={!!selectedItem}
			/>

			{list?.status === "COMPLETED" && (
				<TouchableOpacity
					style={[styles.reopenFab, { backgroundColor: "#FF9800" }]}
					onPress={handleReopenList}
				>
					<Text style={styles.reopenText}>Reabrir Lista</Text>
				</TouchableOpacity>
			)}

			<CameraModal
				visible={isScanning}
				onClose={() => setIsScanning(false)}
				onBarcodeScanned={handleBarcodeScanned}
			/>

			<AddProductModal
				visible={isManualAdd}
				onClose={() => setIsManualAdd(false)}
				onSubmit={(code) => handleBarcodeScanned({ data: code })}
			/>

			<ListItemSheet
				visible={!!selectedItem}
				item={selectedItem}
				onClose={() => setSelectedItem(null)}
				onUpdateItem={handleUpdateItem}
				priceLocked={list?.status === "COMPLETED"}
				exchangeRate={exchangeRate}
			/>

			<CompleteListModal
				visible={showCompleteModal}
				onClose={() => setShowCompleteModal(false)}
				onConfirm={handleConfirmCompleteList}
				loading={completingList}
				storeSearchQuery={storeSearchQuery}
				onStoreSearch={handleStoreSearch}
				storeSearchResults={storeSearchResults}
				nearbyStores={nearbyStores}
				selectedStoreId={selectedStoreForCompletion}
				onSelectStore={setSelectedStoreForCompletion}
				isNearbyExpanded={isNearbyExpanded}
				onToggleNearby={() => setIsNearbyExpanded(!isNearbyExpanded)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	finalizeShortcut: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 18,
		borderRadius: 16,
		marginTop: 20,
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	finalizeShortcutText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 17,
	},
	emptyContainer: {
		alignItems: "center",
		marginTop: 50,
	},
	emptyText: {
		color: "#888",
		marginTop: 10,
	},
	reopenFab: {
		position: "absolute",
		bottom: 60,
		right: 30,
		paddingHorizontal: 24,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 5,
		zIndex: 10,
	},
	reopenText: {
		color: "white",
		fontWeight: "bold",
	},
});
