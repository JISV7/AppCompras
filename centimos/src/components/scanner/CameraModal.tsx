import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { useState } from "react";
import {
	Modal,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

interface CameraModalProps {
	visible: boolean;
	onClose: () => void;
	onBarcodeScanned: (data: { type: string; data: string }) => void;
}

export function CameraModal({
	visible,
	onClose,
	onBarcodeScanned,
}: CameraModalProps) {
	const [torch, setTorch] = useState(false);

	if (!visible) return null;

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="fullScreen"
			statusBarTranslucent
		>
			<View style={styles.container}>
				{/* 1. The Camera (Background) */}
				<CameraView
					style={StyleSheet.absoluteFill}
					facing="back"
					enableTorch={torch}
					onBarcodeScanned={onBarcodeScanned}
					barcodeScannerSettings={{
						barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
					}}
				/>

				{/* 2. The Overlay */}
				<View style={styles.overlay}>
					<View style={styles.topBar}>
						<TouchableOpacity
							style={styles.iconButton}
							onPress={() => setTorch(!torch)}
						>
							<MaterialIcons
								name={torch ? "flashlight-on" : "flashlight-off"}
								size={28}
								color="white"
							/>
						</TouchableOpacity>

						<TouchableOpacity style={styles.iconButton} onPress={onClose}>
							<Ionicons name="close" size={30} color="white" />
						</TouchableOpacity>
					</View>

					<View style={styles.centerContainer}>
						<View style={styles.scanFrame} />
						<Text style={styles.instruction}>
							Alinea el código de barras dentro del cuadro
						</Text>
					</View>

					{/* Bottom spacer to prevent seeing background tabs */}
					<View style={styles.bottomBar} />
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "black" },
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "space-between",
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingTop: Platform.OS === "ios" ? 60 : 40,
	},
	centerContainer: {
		alignItems: "center",
		justifyContent: "center",
	},
	scanFrame: {
		width: 260,
		height: 260,
		borderWidth: 2,
		borderColor: "white",
		borderRadius: 24,
		backgroundColor: "transparent",
	},
	instruction: {
		color: "white",
		marginTop: 24,
		fontSize: 16,
		fontWeight: "600",
		textAlign: "center",
		paddingHorizontal: 40,
	},
	iconButton: {
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 25,
		width: 50,
		height: 50,
		alignItems: "center",
		justifyContent: "center",
	},
	bottomBar: {
		height: 100,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
});
