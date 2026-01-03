import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function RegisterScreen() {
	const color = useThemeColor({}, "background");
	const textColor = useThemeColor({}, "textMain");
	const textSecondaryColor = useThemeColor({}, "textSecondary");
	const primaryColor = useThemeColor({}, "primary");
	const surfaceColor = useThemeColor({}, "surfaceLight");

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const emailRef = useRef<TextInput>(null);
	const passwordRef = useRef<TextInput>(null);
	const confirmPasswordRef = useRef<TextInput>(null);

	const { register } = useAuth();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const togglePasswordVisibility = () => setShowPassword(!showPassword);
	const toggleConfirmPasswordVisibility = () =>
		setShowConfirmPassword(!showConfirmPassword);

	const handleRegister = async () => {
		if (!email || !password || !fullName) {
			alert("Por favor completa todos los campos");
			return;
		}

		if (password !== confirmPassword) {
			alert("Las contraseñas no coinciden");
			return;
		}

		try {
			await register(email, password, fullName);
			// AuthContext handles the redirect if successful
		} catch {
			console.log("Registration failed");
		}
	};

	const passwordStrength = {
		length: password.length >= 8,
		number: /\d/.test(password),
		symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
	};

	return (
		<ThemedView
			style={[
				styles.container,
				{ backgroundColor: color, paddingBottom: insets.bottom },
			]}
		>
			{/* Header Section */}
			<View style={styles.header}>
				{/* CHANGED: Replaced Link with simple onPress */}
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<MaterialIcons name="arrow-back" size={24} color={textColor} />
				</TouchableOpacity>
				<View style={styles.spacer} />
			</View>

			{/* Main Content Area */}
			<ScrollView
				style={styles.scrollContainer}
				contentContainerStyle={styles.content}
			>
				{/* Logo / Branding Area */}
				<View style={styles.logoArea}>
					<View
						style={[
							styles.logoContainer,
							{ backgroundColor: `${primaryColor}1a` },
						]}
					>
						<MaterialIcons name="savings" size={32} color={primaryColor} />
					</View>
					<Text style={[styles.title, { color: textColor }]}>Crear cuenta</Text>
					<Text style={[styles.subtitle, { color: textSecondaryColor }]}>
						Únete a CéntimosVE para empezar a optimizar tu presupuesto.
					</Text>
				</View>

				{/* Form Section */}
				<View style={styles.form}>
					<View style={styles.inputGroup}>
						<TextInput
							style={[
								styles.floatingInput,
								{ color: textColor, backgroundColor: surfaceColor },
							]}
							placeholder="Centimos App"
							placeholderTextColor="#9CA3AF"
							value={fullName}
							onChangeText={setFullName}
							autoCapitalize="words"
							returnKeyType="next"
							onSubmitEditing={() => emailRef.current?.focus()}
							submitBehavior="submit"
						/>
						<Text style={[styles.floatingLabel, { color: textSecondaryColor }]}>
							Nombre completo
						</Text>
					</View>

					<View style={styles.inputGroup}>
						<TextInput
							ref={emailRef}
							style={[
								styles.floatingInput,
								{ color: textColor, backgroundColor: surfaceColor },
							]}
							placeholder="Centimos@shopping.com"
							placeholderTextColor="#9CA3AF"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							returnKeyType="next"
							onSubmitEditing={() => passwordRef.current?.focus()}
							submitBehavior="submit"
						/>
						<Text style={[styles.floatingLabel, { color: textSecondaryColor }]}>
							Correo electrónico
						</Text>
					</View>

					<View style={styles.inputGroup}>
						<TextInput
							ref={passwordRef}
							style={[
								styles.floatingInput,
								{ color: textColor, backgroundColor: surfaceColor },
							]}
							placeholder="••••••••"
							placeholderTextColor="#9CA3AF"
							value={password}
							onChangeText={setPassword}
							secureTextEntry={!showPassword}
							returnKeyType="next"
							onSubmitEditing={() => confirmPasswordRef.current?.focus()}
							submitBehavior="submit"
						/>
						<Text style={[styles.floatingLabel, { color: textSecondaryColor }]}>
							Contraseña
						</Text>
						<TouchableOpacity
							style={styles.passwordToggle}
							onPress={togglePasswordVisibility}
						>
							<MaterialIcons
								name={showPassword ? "visibility" : "visibility-off"}
								size={20}
								color={textSecondaryColor}
							/>
						</TouchableOpacity>
					</View>

					{/* Password Strength */}
					<View style={styles.strengthIndicators}>
						<View style={styles.strengthItem}>
							<View
								style={[
									styles.strengthIndicator,
									{
										backgroundColor: passwordStrength.length
											? primaryColor
											: "transparent",
										borderColor: passwordStrength.length
											? primaryColor
											: "#D1D5DB",
									},
								]}
							>
								{passwordStrength.length && (
									<MaterialIcons name="check" size={10} color="white" />
								)}
							</View>
							<Text
								style={[styles.strengthText, { color: textSecondaryColor }]}
							>
								8+ caracteres
							</Text>
						</View>

						<View
							style={[
								styles.strengthItem,
								{ opacity: passwordStrength.number ? 1 : 0.5 },
							]}
						>
							<View
								style={[
									styles.strengthIndicator,
									{
										backgroundColor: passwordStrength.number
											? primaryColor
											: "transparent",
										borderColor: passwordStrength.number
											? primaryColor
											: "#D1D5DB",
									},
								]}
							>
								{passwordStrength.number && (
									<MaterialIcons name="check" size={10} color="white" />
								)}
							</View>
							<Text
								style={[styles.strengthText, { color: textSecondaryColor }]}
							>
								1 número
							</Text>
						</View>

						<View
							style={[
								styles.strengthItem,
								{ opacity: passwordStrength.symbol ? 1 : 0.5 },
							]}
						>
							<View
								style={[
									styles.strengthIndicator,
									{
										backgroundColor: passwordStrength.symbol
											? primaryColor
											: "transparent",
										borderColor: passwordStrength.symbol
											? primaryColor
											: "#D1D5DB",
									},
								]}
							>
								{passwordStrength.symbol && (
									<MaterialIcons name="check" size={10} color="white" />
								)}
							</View>
							<Text
								style={[styles.strengthText, { color: textSecondaryColor }]}
							>
								1 símbolo
							</Text>
						</View>
					</View>

					<View style={styles.inputGroup}>
						<TextInput
							ref={confirmPasswordRef}
							style={[
								styles.floatingInput,
								{ color: textColor, backgroundColor: surfaceColor },
							]}
							placeholder="••••••••"
							placeholderTextColor="#9CA3AF"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry={!showConfirmPassword}
							returnKeyType="done"
						/>
						<Text style={[styles.floatingLabel, { color: textSecondaryColor }]}>
							Confirmar contraseña
						</Text>
						<TouchableOpacity
							style={styles.passwordToggle}
							onPress={toggleConfirmPasswordVisibility}
						>
							<MaterialIcons
								name={showConfirmPassword ? "visibility" : "visibility-off"}
								size={20}
								color={textSecondaryColor}
							/>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={[styles.signupButton, { backgroundColor: primaryColor }]}
						onPress={handleRegister}
					>
						<Text style={styles.signupButtonText}>Registrarse</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.dividerContainer}>
					<View
						style={[
							styles.divider,
							{ backgroundColor: useThemeColor({}, "textSecondary") },
						]}
					/>
					<Text
						style={[
							styles.dividerText,
							{
								backgroundColor: color,
								color: useThemeColor({}, "textSecondary"),
							},
						]}
					>
						O continuar con
					</Text>
					<View
						style={[
							styles.divider,
							{ backgroundColor: useThemeColor({}, "textSecondary") },
						]}
					/>
				</View>

				<View style={styles.socialButtons}>
					<TouchableOpacity
						style={[styles.socialButton, { backgroundColor: surfaceColor }]}
					>
						<MaterialIcons name="mail" size={20} color="#4285F4" />
						<Text style={[styles.socialButtonText, { color: textColor }]}>
							Google
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.socialButton, { backgroundColor: surfaceColor }]}
					>
						<MaterialIcons name="apple" size={20} color={textColor} />
						<Text style={[styles.socialButtonText, { color: textColor }]}>
							Apple
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>

			{/* Footer */}
			<View style={styles.footer}>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Text
						style={[
							styles.footerText,
							{ color: useThemeColor({}, "textSecondary") },
						]}
					>
						¿Ya tienes una cuenta?{" "}
					</Text>
					{/* CHANGED: Replaced Link with simple onPress */}
					<TouchableOpacity onPress={() => router.push("/(auth)/login")}>
						<Text style={{ color: primaryColor, fontWeight: "bold" }}>
							Inicia sesión
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f6f8f7",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		paddingTop: 24,
		zIndex: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
	},
	spacer: {
		width: 40, // Spacer for balance
	},
	scrollContainer: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		width: "100%",
		maxWidth: 420,
		paddingHorizontal: 24,
		paddingBottom: 32,
	},
	logoArea: {
		alignItems: "center",
		marginBottom: 32,
		marginTop: 16,
	},
	logoContainer: {
		width: 64,
		height: 64,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		textAlign: "center",
		color: "#4c9a80",
	},
	form: {
		width: "100%",
		marginBottom: 32,
	},
	inputGroup: {
		position: "relative",
		marginBottom: 20,
	},
	floatingInput: {
		paddingVertical: 20,
		paddingHorizontal: 16,
		paddingRight: 44,
		borderRadius: 16,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	floatingLabel: {
		position: "absolute",
		left: 16,
		top: 20,
		zIndex: 1,
		fontSize: 12,
		color: "#9CA3AF",
		transform: [{ translateY: -12 }, { scale: 0.85 }],
	},
	passwordToggle: {
		position: "absolute",
		right: 16,
		top: 20,
		zIndex: 1,
	},
	strengthIndicators: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		paddingHorizontal: 4,
		marginBottom: 20,
	},
	strengthItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	strengthIndicator: {
		width: 16,
		height: 16,
		borderRadius: 8,
		borderWidth: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	strengthText: {
		fontSize: 12,
		fontWeight: "500",
	},
	signupButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 16,
		borderRadius: 16,
		shadowColor: "#10b77f",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
		marginTop: 8,
	},
	signupButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
		marginRight: 8,
	},
	dividerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 24,
	},
	divider: {
		flex: 1,
		height: 1,
	},
	dividerText: {
		paddingHorizontal: 8,
		fontSize: 14,
	},
	socialButtons: {
		flexDirection: "row",
		gap: 16,
	},
	socialButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	socialButtonText: {
		fontSize: 14,
		fontWeight: "500",
		marginLeft: 8,
	},
	footer: {
		alignItems: "center",
		paddingBottom: 24,
	},
	footerText: {
		fontSize: 14,
	},
});
