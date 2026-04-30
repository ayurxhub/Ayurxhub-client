"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const API = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const accessTokenRef = useRef(null);
    const intervalRef = useRef(null);
    const authAxiosRef = useRef(axios.create({ baseURL: API, withCredentials: true }));

    const setSession = (token, userData) => {
        accessTokenRef.current = token;
        setUser(userData);
    };

    const logout = useCallback(async () => {
        try {
            await authAxiosRef.current.post("/auth/logout");
        } catch { }
        accessTokenRef.current = null;
        setUser(null);
    }, []);

    // Silent refresh on app load
    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                setSession(res.data.accessToken, res.data.user ?? null);
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
        if (!user) {
            clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(async () => {
            try {
                const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                accessTokenRef.current = res.data.accessToken;
            } catch {
                logout();
            }
        }, 14 * 60 * 1000);
        return () => clearInterval(intervalRef.current);
    }, [user, logout]);

    // Axios interceptors — attached once
    useEffect(() => {
        const instance = authAxiosRef.current;

        const reqInterceptor = instance.interceptors.request.use((config) => {
            if (accessTokenRef.current) {
                config.headers.Authorization = `Bearer ${accessTokenRef.current}`;
            }
            return config;
        });

        const resInterceptor = instance.interceptors.response.use(
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
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            instance.interceptors.request.eject(reqInterceptor);
            instance.interceptors.response.eject(resInterceptor);
        };
    }, [logout]);

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

    const authAxios = authAxiosRef.current;

    return (
        <AuthContext.Provider value={{ user, setUser, loading, register, login, loginWithGoogle, logout, authAxios, accessTokenRef }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}