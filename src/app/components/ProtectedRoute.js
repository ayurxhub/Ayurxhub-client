"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            router.push("/dashboard");
            return;
        }

        // Expert verification gate
        if (user.role === "expert") {
            const status = user.verificationStatus;
            const isOnboarding = window.location.pathname === "/onboarding";

            if (!status || status === "none" || status === "pending" || status === "rejected") {
                if (!isOnboarding) router.push("/onboarding");
            }
        }
    }, [user, loading]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return children;
}