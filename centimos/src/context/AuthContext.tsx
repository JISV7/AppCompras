import { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { Alert } from "react-native";
import api from "@/services/api";

type User = {
	user_id: string;
	email: string;
	username: string;
};

type AuthContextType = {
	isAuthenticated: boolean;
	user: User | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (
		email: string,
		password: string,
		username: string,
	) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Helper to fetch full user details after we have a token
	const fetchUserProfile = useCallback(async (token: string) => {
		try {
			// 1. Call the new Backend Endpoint
			const response = await api.get("/users/me", {
				headers: { Authorization: `Bearer ${token}` },
			});

			const userData = response.data;

			// 2. Update State with REAL data from DB
			setUser({
				user_id: userData.user_id,
				email: userData.email,
				username: userData.username,
			});
			setIsAuthenticated(true);
		} catch (error) {
			if (error instanceof AxiosError && error.response?.status === 404) {
				console.log("User not found, re-throwing.", error);
				throw error; // Re-throw to be caught by callers
			}
			console.log("Error fetching profile, falling back to token data", error);
			// Fallback for other errors
			const decoded = jwtDecode<{ sub: string }>(token);
			setUser({
				user_id: decoded.sub,
				email: decoded.sub,
				username: "User",
			});
			setIsAuthenticated(true);
		}
	}, []);

	const logout = useCallback(async () => {
		await SecureStore.deleteItemAsync("token");
		setIsAuthenticated(false);
		setUser(null);
	}, []);

	useEffect(() => {
		const loadUser = async () => {
			try {
				const token = await SecureStore.getItemAsync("token");
				if (token) {
					await fetchUserProfile(token);
				}
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 404) {
					console.log("User session invalid, logging out.", error);
					await logout();
				} else {
					console.log("Failed to load token or user profile", error);
				}
			} finally {
				setIsLoading(false);
			}
		};
		loadUser();
	}, [fetchUserProfile, logout]);

	const login = async (email: string, password: string) => {
		try {
			const formData = new URLSearchParams();
			formData.append("username", email);
			formData.append("password", password);

			const response = await api.post("/auth/login", formData.toString(), {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			});

			const { access_token } = response.data;
			await SecureStore.setItemAsync("token", access_token);

			await fetchUserProfile(access_token);
		} catch (error: unknown) {
			if (error instanceof AxiosError && error.response?.status === 404) {
				await logout();
			}
			let msg =
				error instanceof AxiosError
					? error.response?.data?.detail
					: "Login failed";
			if (Array.isArray(msg)) {
				msg = msg.map((err: { msg: string }) => err.msg).join("\n");
			}
			Alert.alert("Error", msg);
			throw error;
		}
	};

	const register = async (
		email: string,
		password: string,
		username: string,
	) => {
		try {
			// Backend Register
			const response = await api.post("/auth/register", {
				email,
				password,
				username,
			});

			const newUser = response.data;

			await login(email, password);

			setUser({
				user_id: newUser.user_id,
				email: newUser.email,
				username: newUser.username,
			});
		} catch (error: unknown) {
			let msg =
				error instanceof AxiosError
					? error.response?.data?.detail
					: "Registration failed";
			if (Array.isArray(msg)) {
				msg = msg.map((err: { msg: string }) => err.msg).join("\n");
			}
			Alert.alert("Error", msg);
			throw error;
		}
	};

	return (
		<AuthContext.Provider
			value={{ isAuthenticated, user, isLoading, login, register, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
