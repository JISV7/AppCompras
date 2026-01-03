import { AxiosError } from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
	getLatestExchangeRate,
	getNearbyStores,
	getProduct,
	getStores,
	searchStores,
} from "@/services/api";
import {
	addListItem,
	completeShoppingList,
	deleteListItem,
	type EnrichedListItem,
	getListDetails,
	type ShoppingList,
	updateList,
	updateListItem,
} from "@/services/lists";
import { normalizeToGtin13 } from "@/services/validate";

interface Store {
	store_id: string;
	name: string;
	address?: string;
}

export function useListDetail(id: string) {
	// State
	const [list, setList] = useState<ShoppingList | null>(null);
	const [items, setItems] = useState<EnrichedListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalPrice, setTotalPrice] = useState(0);
	const [selectedItem, setSelectedItem] = useState<EnrichedListItem | null>(
		null,
	);
	const [exchangeRate, setExchangeRate] = useState<number | null>(null);

	// Actions State
	const [showActions, setShowActions] = useState(false);
	const [isScanning, setIsScanning] = useState(false);
	const [isManualAdd, setIsManualAdd] = useState(false);

	// Complete List Modal State
	const [showCompleteModal, setShowCompleteModal] = useState(false);
	const [availableStores, setAvailableStores] = useState<Store[]>([]);
	const [selectedStoreForCompletion, setSelectedStoreForCompletion] = useState<
		string | null
	>(null);
	const [completingList, setCompletingList] = useState(false);

	// Store Search and Nearby State
	const [storeSearchQuery, setStoreSearchQuery] = useState("");
	const [storeSearchResults, setStoreSearchResults] = useState<Store[]>([]);
	const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
	const [isNearbyExpanded, setIsNearbyExpanded] = useState(false);

	const calculateTotal = useCallback((currentItems: EnrichedListItem[]) => {
		const total = currentItems.reduce((sum, item) => {
			const priceToUse = item.planned_price ?? item.estimatedPrice ?? 0;
			const quantity = item.quantity ?? 0;

			// Safety check: ensure both are valid numbers
			const validPrice =
				typeof priceToUse === "number" && !Number.isNaN(priceToUse)
					? priceToUse
					: 0;
			const validQty =
				typeof quantity === "number" && !Number.isNaN(quantity) ? quantity : 0;

			return sum + validQty * validPrice;
		}, 0);
		setTotalPrice(total);
	}, []);

	const processItems = useCallback(
		async (
			listData: ShoppingList,
			_rate: number | undefined,
			storesData: Store[],
		) => {
			const enrichedItems = await Promise.all(
				listData.items.map(async (item) => {
					try {
						const product = await getProduct(item.product_barcode);
						const avgPrice = Number(product?.estimated_price_usd) || 0;
						const predPrice = Number(product?.predicted_price_usd) || 0;
						const store = storesData.find(
							(s: Store) => s.store_id === item.store_id,
						);

						return {
							...item,
							productName: product?.name || "Producto Desconocido",
							productImage: product?.image_url,
							estimatedPrice: avgPrice,
							predictedPrice: predPrice,
							storeName: store?.name,
							added_at: item.added_at,
							planned_price: item.planned_price,
							is_purchased: item.is_purchased,
							store_id: item.store_id,
						};
					} catch {
						return {
							...item,
							productName: "Producto no encontrado",
							estimatedPrice: 0,
							predictedPrice: 0,
						};
					}
				}),
			);

			// Sorting Logic
			const sortedItems = enrichedItems.sort((a, b) => {
				if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
				if (!a.is_purchased) {
					const dateA = new Date(a.added_at || 0).getTime();
					const dateB = new Date(b.added_at || 0).getTime();
					return dateB - dateA;
				}
				return (a.productName || "").localeCompare(b.productName || "");
			});

			setItems(sortedItems);
			calculateTotal(sortedItems);
			return sortedItems;
		},
		[calculateTotal],
	);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const [listData, rateData, storesData] = await Promise.all([
				getListDetails(id),
				getLatestExchangeRate(),
				getStores(),
			]);

			setList(listData);
			if (rateData) setExchangeRate(rateData.rate_to_ves);
			setAvailableStores(storesData);

			await processItems(listData, rateData?.rate_to_ves, storesData);
		} catch (error) {
			console.error("Error fetching data:", error);
			Alert.alert("Error", "No se pudieron cargar los datos");
		} finally {
			setLoading(false);
		}
	}, [id, processItems]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleBarcodeScanned = async ({ data }: { data: string }) => {
		if (list?.status === "COMPLETED") {
			Alert.alert(
				"Lista Finalizada",
				"No se pueden agregar artículos a una lista finalizada.",
			);
			return;
		}
		setIsScanning(false);
		setIsManualAdd(false);

		try {
			const normalizedBarcode = normalizeToGtin13(data);
			await addListItem(id, normalizedBarcode, 1);
			await fetchData();
		} catch (error: unknown) {
			if (error instanceof AxiosError && error.response?.status === 404) {
				Alert.alert(
					"Producto Desconocido",
					"Por favor crea este producto en la pestaña de Inicio primero.",
				);
			} else {
				Alert.alert("Error", "No se pudo agregar el artículo.");
			}
		}
	};

	const handleRemoveItem = async (itemId: string) => {
		const originalItems = [...items];
		const filtered = items.filter((i) => i.item_id !== itemId);
		setItems(filtered);
		calculateTotal(filtered);

		try {
			await deleteListItem(id, itemId);
		} catch {
			setItems(originalItems);
			calculateTotal(originalItems);
			Alert.alert("Error", "No se pudo eliminar el artículo");
		}
	};

	const handleCompleteListPress = async () => {
		const allItemsHaveStores =
			items.length > 0 && items.every((i) => i.store_id);

		if (allItemsHaveStores && items[0]?.store_id) {
			setCompletingList(true);
			try {
				await completeShoppingList(id, items[0].store_id);
				Alert.alert("Éxito", "¡Lista cerrada y precios registrados!");
				fetchData();
				return;
			} catch {
				Alert.alert("Error", "No se pudo cerrar la lista.");
				setCompletingList(false);
				return;
			} finally {
				setCompletingList(false);
			}
		}

		setStoreSearchQuery("");
		setStoreSearchResults([]);
		setIsNearbyExpanded(false);
		setSelectedStoreForCompletion(null);
		setShowCompleteModal(true);

		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status === "granted") {
				const location = await Location.getCurrentPositionAsync({});
				const nearby = await getNearbyStores(
					location.coords.latitude,
					location.coords.longitude,
				);
				setNearbyStores(nearby);
				if (nearby.length > 0)
					setSelectedStoreForCompletion(nearby[0].store_id);
			}
		} catch (error) {
			console.error("Error fetching nearby stores:", error);
		}
	};

	const handleStoreSearch = useCallback(async (text: string) => {
		setStoreSearchQuery(text);
		if (text.length > 1) {
			try {
				const results = await searchStores(text);
				setStoreSearchResults(results);
			} catch (e) {
				console.error(e);
			}
		} else {
			setStoreSearchResults([]);
		}
	}, []);

	const handleConfirmCompleteList = async () => {
		if (!selectedStoreForCompletion) {
			Alert.alert(
				"Tienda no seleccionada",
				"Por favor selecciona una tienda para finalizar la lista.",
			);
			return;
		}

		setCompletingList(true);
		try {
			await completeShoppingList(id, selectedStoreForCompletion);
			Alert.alert("Éxito", "¡Lista finalizada y precios registrados!");
			setShowCompleteModal(false);
			fetchData();
		} catch (error) {
			console.error("Error completing list:", error);
			Alert.alert("Error", "No se pudo finalizar la lista.");
		} finally {
			setCompletingList(false);
		}
	};

	const handleUpdateItem = useCallback(
		async (updatedFields: {
			quantity?: number;
			planned_price?: number | null;
			is_purchased?: boolean;
			store_id?: string | null;
		}) => {
			if (!selectedItem) return;

			const originalItems = [...items];
			const itemToUpdate = selectedItem;

			const cleanUpdates: Partial<EnrichedListItem> = {
				quantity: updatedFields.quantity,
				is_purchased: updatedFields.is_purchased,
				planned_price: updatedFields.planned_price ?? undefined,
				store_id: updatedFields.store_id ?? undefined,
			};

			if (cleanUpdates.store_id !== undefined) {
				if (cleanUpdates.store_id === null) {
					cleanUpdates.storeName = undefined;
				} else {
					const store = availableStores.find(
						(s) => s.store_id === cleanUpdates.store_id,
					);
					if (store) cleanUpdates.storeName = store.name;
				}
			}

			const updatedItems = items.map((i) =>
				i.item_id === itemToUpdate.item_id ? { ...i, ...cleanUpdates } : i,
			);
			setItems(updatedItems);
			calculateTotal(updatedItems);
			setSelectedItem({ ...itemToUpdate, ...cleanUpdates });

			const apiData: {
				quantity?: number;
				is_purchased?: boolean;
				planned_price?: number | null;
				store_id?: string;
			} = {
				quantity: updatedFields.quantity,
				is_purchased: updatedFields.is_purchased,
				planned_price: updatedFields.planned_price,
				store_id: updatedFields.store_id ?? undefined,
			};

			if (updatedFields.store_id === null) delete apiData.store_id;

			try {
				await updateListItem(id, itemToUpdate.item_id, apiData);
				const updatedListData = await getListDetails(id);
				setList(updatedListData);
				const newlyProcessedItems = await processItems(
					updatedListData,
					exchangeRate || undefined,
					availableStores,
				);

				if (newlyProcessedItems) {
					const freshItem = newlyProcessedItems.find(
						(i: EnrichedListItem) => i.item_id === itemToUpdate.item_id,
					);
					setSelectedItem((prev) =>
						prev && prev.item_id === itemToUpdate.item_id
							? freshItem || null
							: prev,
					);
				}

				if (
					updatedListData.status === "ACTIVE" &&
					updatedListData.items.length > 0 &&
					updatedListData.items.every((i) => i.is_purchased) &&
					updatedFields.is_purchased === true
				) {
					Alert.alert(
						"¡Todo listo!",
						"Has marcado todos los productos como comprados. Puedes cerrar la lista cuando estés listo usando el botón al final.",
						[{ text: "Entendido" }],
					);
				}
			} catch (e) {
				console.error("Failed to update item:", e);
				setItems(originalItems);
				calculateTotal(originalItems);
				setSelectedItem(itemToUpdate);
				Alert.alert("Error", "No se pudo actualizar el artículo.");
			}
		},
		[
			selectedItem,
			items,
			availableStores,
			calculateTotal,
			id,
			processItems,
			exchangeRate,
		],
	);

	const handleReopenList = async () => {
		try {
			await updateList(id, { status: "ACTIVE" });
			Alert.alert("Éxito", "¡Lista Reabierta!");
			fetchData();
		} catch {
			Alert.alert("Error", "No se pudo reabrir la lista.");
		}
	};

	return {
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
		fetchData,
	};
}
