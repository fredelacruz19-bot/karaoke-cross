import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

// =====================================================================
// CONFIGURACIÓN DE FIREBASE
// =====================================================================

const firebaseConfig = {
  apiKey: "AIzaSyAs7D9YKhwSA1QCdZyr7749SmkktcILpFo",
  authDomain: "karaoke-cross.firebaseapp.com",
  projectId: "karaoke-cross",
  storageBucket: "karaoke-cross.firebasestorage.app",
  messagingSenderId: "1093569310601",
  appId: "1:1093569310601:web:89828615c1f85787027b58"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// =====================================================================
// CONFIGURACIÓN DE ERRORES GLOBALES PARA FIREBASE
// =====================================================================

window.FirebaseErrorMessages = {
  "auth/user-not-found": "Usuario no encontrado",
  "auth/wrong-password": "Contraseña incorrecta",
  "auth/weak-password": "La contraseña es muy débil",
  "auth/email-already-in-use": "El email ya está registrado",
  "auth/invalid-email": "Email inválido",
  "auth/operation-not-allowed": "Operación no permitida",
  "auth/too-many-requests": "Demasiados intentos, intenta más tarde",
  "permission-denied": "No tienes permiso para realizar esta acción",
  "not-found": "Recurso no encontrado",
  "unauthenticated": "Debes estar autenticado",
  "resource-exhausted": "Límite de recursos alcanzado",
  "invalid-argument": "Argumento inválido"
};

export function getErrorMessage(code) {
  return window.FirebaseErrorMessages[code] || "Error desconocido";
}

