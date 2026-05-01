"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// ✅ FIX 1: Use env var, fallback to localhost
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const accessTokenRef = useRef(null);

    const setSession = (token, userData) => {
        accessTokenRef.current = token;
        setUser(userData);
    };

    // ✅ FIX 2: Create authAxios ONCE with useMemo — not on every render
    const authAxios = useMemo(() => {
        const instance = axios.create({ baseURL: API, withCredentials: true });

        instance.interceptors.request.use((config) => {
            if (accessTokenRef.current) {
                config.headers.Authorization = `Bearer ${accessTokenRef.current}`;
            }
            return config;
        });

        instance.interceptors.response.use(
            (res) => res,
            async (error) => {
                const original = error.config;
                if (error.response?.status === 401 && !original._retry) {
                    original._retry = true;
                    try {
                        const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                        accessTokenRef.current = res.data.accessToken;
                        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
                        return instance(original);
                    } catch {
                        accessTokenRef.current = null;
                        setUser(null);
                    }
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, []); // ✅ Created once, never recreated

    // Silent refresh on app load
    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                accessTokenRef.current = res.data.accessToken;
                if (res.data.user) {
                    setUser(res.data.user);
                } else {
                    const me = await axios.get(`${API}/auth/me`, {
                        headers: { Authorization: `Bearer ${res.data.accessToken}` },
                    });
                    setUser(me.data.user);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false); // ✅ Always runs
            }
        };
        initAuth();
    }, []);

    // Auto-refresh every 14 minutes
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(async () => {
            try {
                const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                accessTokenRef.current = res.data.accessToken;
            } catch {
                accessTokenRef.current = null;
                setUser(null);
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
        } catch { }
        accessTokenRef.current = null;
        setUser(null);
    }, [authAxios]);

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