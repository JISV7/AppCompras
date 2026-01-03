import { Link } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function WelcomeScreen() {
	const color = useThemeColor({}, "background");
	const textColor = useThemeColor({}, "textMain");
	const textSubColor = useThemeColor({}, "textSub");
	const primaryColor = useThemeColor({}, "primary");
	const insets = useSafeAreaInsets();

	const heroImage = require("@/assets/images/welcome/step4.png");

	return (
		<ThemedView
			style={[
				styles.container,
				{ backgroundColor: color, paddingBottom: insets.bottom },
			]}
		>
			{/* Content Wrapper */}
			<View style={styles.contentWrapper}>
				{/* Top Branding / Illustration Area */}
				<View style={styles.topArea}>
					{/* App Logo / Icon Placeholder */}
					<View
						style={[
							styles.logoContainer,
							{ backgroundColor: `${primaryColor}1a` },
						]}
					>
						<Text style={[styles.logoIcon, { color: primaryColor }]}>🛒</Text>
					</View>

					{/* Hero Illustration */}
					<View style={styles.illustrationContainer}>
						<Image
							source={heroImage}
							style={styles.illustration}
							resizeMode="contain"
						/>
						{/* Decorative Elements to enhance visual interest */}
						<View
							style={[
								styles.decorativeElement1,
								{ backgroundColor: "#FFD70033" },
							]}
						/>
						<View
							style={[
								styles.decorativeElement2,
								{ backgroundColor: `${primaryColor}1a` },
							]}
						/>
					</View>
				</View>

				{/* Text Content Area */}
				<View style={styles.textArea}>
					<Text style={[styles.title, { color: textColor }]}>
						Compra inteligente en Venezuela
					</Text>
					<Text style={[styles.subtitle, { color: textSubColor }]}>
						Sigue los precios, monitorea el dólar y ahorra en cada compra.
					</Text>
				</View>

				{/* Action Buttons Area */}
				<View style={styles.buttonArea}>
					{/* Create Account Button (Primary) */}
					<Link href="/(auth)/register" asChild>
						<TouchableOpacity style={styles.primaryButton}>
							<Text style={styles.primaryButtonText}>Crear cuenta</Text>
						</TouchableOpacity>
					</Link>

					{/* Login Button (Primary) */}
					<Link href="/(auth)/login" asChild>
						<TouchableOpacity style={styles.primaryButton}>
							<Text style={styles.primaryButtonText}>Iniciar sesión</Text>
						</TouchableOpacity>
					</Link>
				</View>
			</View>

			{/* Background Decorative Blobs for depth (Subtle) */}
			<View style={styles.backgroundBlobs}>
				<View
					style={[styles.blob1, { backgroundColor: `${primaryColor}0d` }]}
				/>
				<View style={[styles.blob2, { backgroundColor: "#3b82f60d" }]} />
			</View>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "space-between",
		alignItems: "center",
		overflow: "hidden",
		position: "relative",
		backgroundColor: "#f6f8f7",
	},
	contentWrapper: {
		flex: 1,
		justifyContent: "flex-end",
		width: "100%",
		maxWidth: 420,
		paddingHorizontal: 24,
		paddingTop: 32,
		paddingBottom: 40,
	},
	topArea: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingTop: 16,
	},
	logoContainer: {
		width: 56,
		height: 56,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 1,
		elevation: 1,
	},
	logoIcon: {
		fontSize: 28,
	},
	illustrationContainer: {
		width: "100%",
		height: 200,
		position: "relative",
	},
	illustration: {
		width: "100%",
		height: "100%",
	},
	decorativeElement1: {
		position: "absolute",
		top: -16,
		right: -16,
		width: 48,
		height: 48,
		borderRadius: 24,
		opacity: 0.2,
	},
	decorativeElement2: {
		position: "absolute",
		bottom: 0,
		left: 0,
		width: 96,
		height: 96,
		borderRadius: 48,
		opacity: 0.2,
	},
	textArea: {
		alignItems: "center",
		marginBottom: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		lineHeight: 36,
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 15,
		lineHeight: 22,
		textAlign: "center",
		maxWidth: 280,
	},
	buttonArea: {
		width: "100%",
		marginBottom: 8,
	},
	primaryButton: {
		height: 50,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
		backgroundColor: "#10b77f",
	},
	primaryButtonText: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "600",
	},
	guestArea: {
		width: "100%",
		justifyContent: "center",
	},
	guestButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	guestButtonText: {
		fontSize: 14,
		fontWeight: "500",
	},
	guestButtonIcon: {
		fontSize: 16,
	},
	backgroundBlobs: {
		position: "absolute",
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
		overflow: "hidden",
		pointerEvents: "none",
	},
	blob1: {
		position: "absolute",
		top: "-10%",
		right: "-10%",
		width: "50%",
		height: "30%",
		borderRadius: 9999,
		opacity: 0.2,
	},
	blob2: {
		position: "absolute",
		bottom: "-5%",
		left: "-10%",
		width: "60%",
		height: "40%",
		borderRadius: 9999,
		opacity: 0.2,
	},
});
