"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const accessTokenRef = useRef(null);
    const intervalRef = useRef(null);

    const setSession = useCallback((token, userData) => {
        accessTokenRef.current = token;
        setUser(userData);
    }, []);

    const authAxios = useMemo(() => {
        const instance = axios.create({
            baseURL: API,
            withCredentials: true,
        });

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

                if (error.response?.status === 401 && original && !original._retry) {
                    original._retry = true;

                    try {
                        const res = await axios.post(
                            `${API}/auth/refresh`,
                            {},
                            { withCredentials: true }
                        );

                        accessTokenRef.current = res.data.accessToken;
                        original.headers = original.headers || {};
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
    }, []);

    const logout = useCallback(async () => {
        try {
            await authAxios.post("/auth/logout");
        } catch { }

        accessTokenRef.current = null;
        setUser(null);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [authAxios]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await axios.post(
                    `${API}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                accessTokenRef.current = res.data.accessToken;

                if (res.data.user) {
                    setUser(res.data.user);
                } else {
                    const me = await axios.get(`${API}/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${res.data.accessToken}`,
                        },
                    });

                    setUser(me.data.user);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    useEffect(() => {
        if (!user) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(async () => {
            try {
                const res = await axios.post(
                    `${API}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                accessTokenRef.current = res.data.accessToken;
            } catch {
                await logout();
            }
        }, 14 * 60 * 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [user, logout]);

    const register = async (name, email, password, role = "student") => {
        const res = await axios.post(
            `${API}/auth/register`,
            { name, email, password, role },
            { withCredentials: true }
        );

        setSession(res.data.accessToken, res.data.user);
        return res.data.user;
    };

    const login = async (email, password) => {
        const res = await axios.post(
            `${API}/auth/login`,
            { email, password },
            { withCredentials: true }
        );

        setSession(res.data.accessToken, res.data.user);
        return res.data.user;
    };

    const loginWithGoogle = async (idToken, role = null) => {
        const payload = { idToken };
        if (role) payload.role = role;

        const res = await axios.post(`${API}/auth/google`, payload, {
            withCredentials: true,
        });

        setSession(res.data.accessToken, res.data.user);
        return res.data.user;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                register,
                login,
                loginWithGoogle,
                logout,
                authAxios,
                accessTokenRef,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return ctx;
}