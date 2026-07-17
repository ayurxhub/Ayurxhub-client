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

// ─── Retry helper ─────────────────────────────────────────────────────────────
// Retries a promise-returning fn up to `attempts` times with exponential backoff.
// Only gives up (and propagates the error) after all retries are exhausted.
// This is the core fix for Render free-tier cold starts: a 50-60s spin-up delay
// causes the refresh request to time out, which previously triggered an immediate
// logout. With retries, we wait out the cold start instead.
const withRetry = async (fn, attempts = 3, delayMs = 2000) => {
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            // Don't retry on 401/403 — those are real auth errors, not transient failures
            const status = err?.response?.status;
            if (status === 401 || status === 403) throw err;
            if (i < attempts - 1) {
                await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
            }
        }
    }
    throw lastError;
};

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
                        // FIX: retry the refresh up to 3 times with backoff so a
                        // Render cold-start timeout doesn't cause a false logout
                        const res = await withRetry(() =>
                            axios.post(`${API}/auth/refresh`, {}, { withCredentials: true })
                        );

                        accessTokenRef.current = res.data.accessToken;
                        original.headers = original.headers || {};
                        original.headers.Authorization = `Bearer ${res.data.accessToken}`;

                        return instance(original);
                    } catch {
                        // Only reach here after all retries failed — genuine session expiry
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

    // ── On mount: restore session from the HttpOnly refresh-token cookie ──────
    useEffect(() => {
        const initAuth = async () => {
            // Keep retrying for up to 90 seconds — enough to outlast Render's
            // free-tier cold start (typically 50-60s). Uses exponential backoff
            // capped at 15s so we don't hammer a starting server.
            // Only stops early for real 401/403 (no session / invalid token).
            const refreshWithColdStartTolerance = async () => {
                const TIMEOUT = 90_000;
                const start = Date.now();
                let delay = 2000;
                let lastError;

                while (Date.now() - start < TIMEOUT) {
                    try {
                        return await axios.post(
                            `${API}/auth/refresh`, {},
                            { withCredentials: true, timeout: 20000 }
                        );
                    } catch (err) {
                        lastError = err;
                        const status = err?.response?.status;
                        // Real auth failure — stop immediately, no point retrying
                        if (status === 401 || status === 403) throw err;
                        // Network/timeout — wait and retry if still within window
                        const remaining = TIMEOUT - (Date.now() - start);
                        if (remaining > delay) {
                            await new Promise(r => setTimeout(r, delay));
                            delay = Math.min(delay * 2, 15000);
                        } else {
                            break;
                        }
                    }
                }
                throw lastError;
            };

            try {
                const res = await refreshWithColdStartTolerance();

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
                // Genuine failure after full retry window — no valid session
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // ── Proactive token refresh interval ──────────────────────────────────────
    useEffect(() => {
        if (!user) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // FIX 1: Fire at 12 minutes instead of 14 — gives 3 minutes of breathing
        // room for cold-start delays (Render can take 50-60s to wake up).
        // The access token itself lives 15 minutes, so 12 → 3min window is safe.
        //
        // FIX 2: On failure, retry with backoff before logging out.
        // A transient Render cold-start timeout previously caused an immediate
        // logout on every user across every device within 5-10 minutes.
        intervalRef.current = setInterval(async () => {
            try {
                const res = await withRetry(
                    () => axios.post(`${API}/auth/refresh`, {}, { withCredentials: true }),
                    3,    // 3 attempts
                    3000  // starting delay 3s → 6s → 12s (total up to ~21s)
                );
                accessTokenRef.current = res.data.accessToken;
                // Keep user state fresh if the backend returns updated user data
                if (res.data.user) setUser(res.data.user);
            } catch {
                // Only reach here if all 3 retries failed — genuine expiry or
                // the refresh token itself is gone/invalid. Log out cleanly.
                await logout();
            }
        }, 12 * 60 * 1000); // 12 minutes

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