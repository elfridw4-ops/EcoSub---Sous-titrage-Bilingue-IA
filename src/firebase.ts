import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Force la sélection du compte pour gérer le multi-comptes Google
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Détection du device mobile
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Logique unifiée d'authentification Google (Mobile & Desktop)
 * Résout l'erreur "Unable to process request due to missing initial state"
 */
export const signInWithGoogle = async () => {
  try {
    // 1. Définir la persistance sur LOCAL pour éviter la perte de session
    await setPersistence(auth, browserLocalPersistence);
    
    // 2. Nettoyer le sessionStorage des anciens états Firebase corrompus
    // C'est la cause principale de l'erreur "missing initial state" sur mobile
    try {
      Object.keys(window.sessionStorage).forEach(key => {
        if (key.startsWith('firebase:')) {
          window.sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Impossible de nettoyer le sessionStorage", e);
    }

    // 3. Utiliser signInWithPopup sur tous les appareils
    // signInWithRedirect pose problème sur iOS Safari (ITP) et dans les WebViews/iframes
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
