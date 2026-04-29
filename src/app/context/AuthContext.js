"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const API = "http://localhost:5000/api";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const accessTokenRef = useRef(null); // In-memory only — not localStorage

    const setSession = (token, userData) => {
        accessTokenRef.current = token;
        setUser(userData);
    };

    // Silent refresh on app load (uses HttpOnly cookie automatically)
    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                setSession(res.data.accessToken, res.data.user ?? null);
                // Fetch user if not returned
                if (!res.data.user) {
                    const me = await axios.get(`${API}/auth/me`, {
                        headers: { Authorization: `Bearer ${res.data.accessToken}` },
                    });
                    setUser(me.data.user);
                }
            } catch {
                // No valid session — user stays null
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    // Auto-refresh access token every 14 minutes
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(async () => {
            try {
                const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                accessTokenRef.current = res.data.accessToken;
            } catch {
                logout(); // Refresh failed — force logout
            }
        }, 14 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    const register = async (name, email, password, role = "student") => {
        const res = await axios.post(`${API}/auth/register`, { name, email, password, role }, { withCredentials: true });
        setSession(res.data.accessToken, res.data.user);
        return res.data.user;
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
        setSession(res.data.accessToken, res.data.user);
        return res.data.user;
    };

    // Google OAuth login — idToken from Firebase, role only needed for new users
    const loginWithGoogle = async (idToken, role = null) => {
        const payload = { idToken };
        if (role) payload.role = role;
        const res = await axios.post(`${API}/auth/google`, payload, { withCredentials: true });
        setSession(res.data.accessToken, res.data.user);
        return res.data.user;
    };

    const logout = useCallback(async () => {
        try {
            await authAxios.post("/auth/logout");
        } catch { } // Still clear client state even if request fails
        accessTokenRef.current = null;
        setUser(null);
    }, []);

    // Axios instance with auto-token injection
    const authAxios = axios.create({ baseURL: API, withCredentials: true });
    authAxios.interceptors.request.use((config) => {
        if (accessTokenRef.current) {
            config.headers.Authorization = `Bearer ${accessTokenRef.current}`;
        }
        return config;
    });

    // Auto-retry on 401 with token refresh
    authAxios.interceptors.response.use(
        (res) => res,
        async (error) => {
            const original = error.config;
            if (error.response?.status === 401 && !original._retry) {
                original._retry = true;
                try {
                    const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                    accessTokenRef.current = res.data.accessToken;
                    original.headers.Authorization = `Bearer ${res.data.accessToken}`;
                    return authAxios(original);
                } catch {
                    logout();
                }
            }
            return Promise.reject(error);
        }
    );

    return (

        <AuthContext.Provider value={{ user, setUser, loading, register, login, loginWithGoogle, logout, authAxios }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}