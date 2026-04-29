/**
 * Firebase Client SDK — Google Auth helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Setup (add these to your frontend .env.local):
 *
 *   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
 *   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
 *
 * All values come from Firebase Console → Project Settings → Your apps → Web app
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent duplicate initialization in Next.js hot-reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Request additional scopes if needed
googleProvider.addScope("profile");
googleProvider.addScope("email");

/**
 * Opens a Google sign-in popup and returns the Firebase ID token.
 * Throws on cancel or error.
 */
export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return {
        idToken,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
    };
}

/**
 * Sign out from Firebase (does not affect your backend JWT —
 * call your own logout endpoint separately if needed).
 */
export async function signOutGoogle() {
    await signOut(auth);
}

export { auth };