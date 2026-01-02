import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { createStore } from "@/services/api";

interface CreateStoreModalProps {
	visible: boolean;
	onClose: () => void;
	onStoreCreated: () => void;
}

export function CreateStoreModal({
	visible,
	onClose,
	onStoreCreated,
}: CreateStoreModalProps) {
	const bgColor = useThemeColor({}, "background");
	const cardColor = useThemeColor({}, "surfaceLight");
	const textColor = useThemeColor({}, "textMain");
	const subTextColor = useThemeColor({}, "textSecondary");
	const primaryColor = useThemeColor({}, "primary");

	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [loadingLocation, setLoadingLocation] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const addressRef = useRef<TextInput>(null);

	const fetchLocation = useCallback(async () => {
		setLoadingLocation(true);
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permiso denegado",
					"Se requiere acceso a la ubicación para crear una tienda.",
				);
				setLoadingLocation(false);
				return;
			}

			const location = await Location.getCurrentPositionAsync({});
			setLocation(location);
		} catch (error) {
			console.log("Error fetching location", error);
			Alert.alert("Error", " No se pudo obtener la ubicación.");
		} finally {
			setLoadingLocation(false);
		}
	}, []);

	useEffect(() => {
		if (visible) {
			setName("");
			setAddress("");
			setLocation(null);
			fetchLocation();
		}
	}, [visible, fetchLocation]);

	const handleCreate = async () => {
		if (!name.trim()) {
			Alert.alert("Error", "Por favor ingresa el nombre de la tienda");
			return;
		}
		if (!location) {
			Alert.alert(
				"Error",
				"La ubicación es obligatoria. Asegúrate de tener el GPS activado.",
			);
			return;
		}

		setSubmitting(true);
		try {
			await createStore(
				name,
				address,
				location.coords.latitude,
				location.coords.longitude,
			);
			Alert.alert("Éxito", "¡Tienda creada correctamente!");
			onStoreCreated();
			onClose();
		} catch (_error) {
			Alert.alert(
				"Error",
				"No se pudo crear la tienda. Es posible que ya exista.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.overlayWrapper}
			>
				<View style={styles.overlay}>
					{/* Backdrop sibling to prevent gesture conflicts and fix transparent gaps */}
					<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

					<View style={[styles.modalContent, { backgroundColor: bgColor }]}>
						<View style={styles.handle} />

						<View style={styles.header}>
							<Text style={[styles.title, { color: textColor }]}>
								Agregar Nueva Tienda
							</Text>
							<TouchableOpacity onPress={onClose}>
								<Ionicons name="close-circle" size={28} color={subTextColor} />
							</TouchableOpacity>
						</View>

						<ScrollView
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
						>
							{/* Location Status */}
							<View
								style={[
									styles.locationBox,
									{
										backgroundColor: cardColor,
										borderColor: location ? primaryColor : "#ccc",
									},
								]}
							>
								{loadingLocation ? (
									<View style={styles.row}>
										<ActivityIndicator color={primaryColor} size="small" />
										<Text style={{ marginLeft: 10, color: subTextColor }}>
											Obteniendo GPS...
										</Text>
									</View>
								) : location ? (
									<View style={styles.row}>
										<Ionicons name="location" size={20} color={primaryColor} />
										<Text
											style={{
												marginLeft: 10,
												color: textColor,
												fontWeight: "500",
											}}
										>
											{location.coords.latitude.toFixed(5)},{" "}
											{location.coords.longitude.toFixed(5)}
										</Text>
									</View>
								) : (
									<TouchableOpacity style={styles.row} onPress={fetchLocation}>
										<Ionicons name="warning" size={20} color="orange" />
										<Text style={{ marginLeft: 10, color: "orange" }}>
											Ubicación no encontrada. Toca para reintentar.
										</Text>
									</TouchableOpacity>
								)}
							</View>

							<Text style={[styles.label, { color: subTextColor }]}>
								Nombre de la Tienda
							</Text>
							<TextInput
								style={[
									styles.input,
									{ backgroundColor: cardColor, color: textColor },
								]}
								placeholder="Ej. Supermercado Vida"
								placeholderTextColor="#999"
								value={name}
								onChangeText={setName}
								returnKeyType="next"
								onSubmitEditing={() => addressRef.current?.focus()}
								blurOnSubmit={false}
							/>

							<Text style={[styles.label, { color: subTextColor }]}>
								Dirección / Referencia (Opcional)
							</Text>
							<TextInput
								ref={addressRef}
								style={[
									styles.input,
									{ backgroundColor: cardColor, color: textColor, height: 80 },
								]}
								placeholder="Ej. Av. Bolivar, al lado del banco"
								placeholderTextColor="#999"
								value={address}
								onChangeText={setAddress}
								multiline
								returnKeyType="done"
								onSubmitEditing={handleCreate}
							/>

							<TouchableOpacity
								style={[
									styles.createButton,
									{
										backgroundColor: primaryColor,
										opacity: submitting || !location ? 0.6 : 1,
									},
								]}
								onPress={handleCreate}
								disabled={submitting || !location}
							>
								{submitting ? (
									<ActivityIndicator color="white" />
								) : (
									<Text style={styles.createButtonText}>Crear Tienda</Text>
								)}
							</TouchableOpacity>
						</ScrollView>
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
		justifyContent: "flex-end",
	},
	modalContent: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		paddingBottom: Platform.OS === "ios" ? 40 : 24,
		maxHeight: "90%",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.2,
		shadowRadius: 10,
		elevation: 10,
	},
	handle: {
		width: 40,
		height: 5,
		backgroundColor: "#E0E0E0",
		borderRadius: 10,
		alignSelf: "center",
		marginBottom: 20,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	title: {
		fontSize: 22,
		fontWeight: "bold",
	},
	locationBox: {
		padding: 15,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
	},
	label: {
		fontSize: 14,
		marginBottom: 8,
		marginLeft: 4,
		fontWeight: "600",
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
		alignItems: "center",
		marginTop: 10,
	},
	createButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
});
