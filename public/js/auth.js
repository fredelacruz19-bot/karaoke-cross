import { auth, db, getErrorMessage } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =====================================================================
// MANEJO DE AUTENTICACIÓN
// =====================================================================

const googleProvider = new GoogleAuthProvider();

export async function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
}

export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Verificar si el usuario existe en Firestore
    const userProfile = await getUserProfile(user.uid);

    // Si no existe, crear perfil inicial (solo User normal)
    if (!userProfile) {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        role: "User",
        expirationDate: null,
        maxSessions: 1,
        createdAt: Date.now()
      });
    }

    return user;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
}

export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email login error:", error);
    throw error;
  }
}

export async function registerWithEmail(email, password, displayName) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Actualizar profile
    await updateProfile(user, { displayName });

    // Crear documento en Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || "",
      role: "User",
      expirationDate: null,
      maxSessions: 1,
      createdAt: Date.now()
    });

    return user;
  } catch (error) {
    console.error("Email registration error:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// =====================================================================
// VALIDACIÓN DE USUARIO
// =====================================================================

export async function checkUserAccess() {
  const user = await getCurrentUser();

  if (!user) {
    // Redirigir a login
    window.location.href = "Index.html";
    return false;
  }

  const profile = await getUserProfile(user.uid);

  if (!profile) {
    // Usuario sin perfil, logout
    await logoutUser();
    window.location.href = "Index.html";
    return false;
  }

  // Verificar expiración (solo si no es AdminUser)
  if (profile.role !== "AdminUser" && profile.expirationDate) {
    if (profile.expirationDate < Date.now()) {
      // Usuario expirado
      window.location.href = "AccessDenied.html?reason=expired";
      return false;
    }
  }

  return true;
}

// =====================================================================
// INICIALIZACIÓN GLOBAL DE AUTENTICACIÓN
// =====================================================================

export function initializeAuthUI() {
  const loginBtnGoogle = document.getElementById("login-btn-google");
  const loginBtnEmail = document.getElementById("login-btn-email");

  if (loginBtnGoogle) {
    loginBtnGoogle.addEventListener("click", async () => {
      loginBtnGoogle.disabled = true;
      try {
        await loginWithGoogle();
        window.location.href = "home.html";
      } catch (error) {
        alert(getErrorMessage(error.code));
        loginBtnGoogle.disabled = false;
      }
    });
  }

  if (loginBtnEmail) {
    loginBtnEmail.addEventListener("click", async () => {
      const email = document.getElementById("email-input")?.value;
      const password = document.getElementById("password-input")?.value;

      if (!email || !password) {
        alert("Por favor completa todos los campos");
        return;
      }

      loginBtnEmail.disabled = true;
      try {
        await loginWithEmail(email, password);
        window.location.href = "home.html";
      } catch (error) {
        alert(getErrorMessage(error.code));
        loginBtnEmail.disabled = false;
      }
    });
  }

  // Log out button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logoutUser();
      window.location.href = "Index.html";
    });
  }
}

