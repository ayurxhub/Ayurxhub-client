"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";

const AuthContext = createContext(null);
<<<<<<< HEAD

// ✅ FIX 1: Use env var, fallback to localhost
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
=======
const API = process.env.NEXT_PUBLIC_API_URL;
>>>>>>> 923ac78263ccd6961891ea2e62a26abaf863aded

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const accessTokenRef = useRef(null);
<<<<<<< HEAD
=======
    const intervalRef = useRef(null);
    const authAxiosRef = useRef(axios.create({ baseURL: API, withCredentials: true }));
>>>>>>> 923ac78263ccd6961891ea2e62a26abaf863aded

    const setSession = (token, userData) => {
        accessTokenRef.current = token;
        setUser(userData);
    };

<<<<<<< HEAD
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
=======
    const logout = useCallback(async () => {
        try {
            await authAxiosRef.current.post("/auth/logout");
        } catch { }
        accessTokenRef.current = null;
        setUser(null);
    }, []);
>>>>>>> 923ac78263ccd6961891ea2e62a26abaf863aded

    // Silent refresh on app load
    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
<<<<<<< HEAD
                accessTokenRef.current = res.data.accessToken;
                if (res.data.user) {
                    setUser(res.data.user);
                } else {
=======
                setSession(res.data.accessToken, res.data.user ?? null);
                if (!res.data.user) {
>>>>>>> 923ac78263ccd6961891ea2e62a26abaf863aded
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
        if (!user) {
            clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(async () => {
            try {
                const res = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
                accessTokenRef.current = res.data.accessToken;
            } catch {
<<<<<<< HEAD
                accessTokenRef.current = null;
                setUser(null);
=======
                logout();
>>>>>>> 923ac78263ccd6961891ea2e62a26abaf863aded
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

<<<<<<< HEAD
    const logout = useCallback(async () => {
        try {
            await authAxios.post("/auth/logout");
        } catch { }
        accessTokenRef.current = null;
        setUser(null);
    }, [authAxios]);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, register, login, loginWithGoogle, logout, authAxios }}>
=======
    const authAxios = authAxiosRef.current;

    return (
        <AuthContext.Provider value={{ user, setUser, loading, register, login, loginWithGoogle, logout, authAxios, accessTokenRef }}>
>>>>>>> 923ac78263ccd6961891ea2e62a26abaf863aded
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}