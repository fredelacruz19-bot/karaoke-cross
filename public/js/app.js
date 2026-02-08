import { functions, db, getErrorMessage } from "./firebase.js";
import { getCurrentUser, getUserProfile, checkUserAccess } from "./auth.js";
import {
  httpsCallable,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =====================================================================
// CLOUD FUNCTIONS CALLABLES
// =====================================================================

const createSessionFn = httpsCallable(functions, "createSession");
const endSessionFn = httpsCallable(functions, "endSession");
const addToQueueFn = httpsCallable(functions, "addToQueue");
const removeFromQueueFn = httpsCallable(functions, "removeFromQueue");
const toggleRequestsStatusFn = httpsCallable(functions, "toggleRequestsStatus");
const updateSessionSettingsFn = httpsCallable(functions, "updateSessionSettings");
const createUserProfileFn = httpsCallable(functions, "createUserProfile");
const updateUserSettingsFn = httpsCallable(functions, "updateUserSettings");
const getCacheStatsFn = httpsCallable(functions, "getCacheStats");
const getUserMetricsFn = httpsCallable(functions, "getUserMetrics");

// =====================================================================
// GESTIÓN DE SESIONES
// =====================================================================

export async function createSession(sessionName) {
  try {
    const result = await createSessionFn({ sessionName });
    return result.data;
  } catch (error) {
    console.error("Error creating session:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

export async function endSession(sessionId) {
  try {
    const result = await endSessionFn({ sessionId });
    return result.data;
  } catch (error) {
    console.error("Error ending session:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

export async function getUserSessions(uid) {
  try {
    const q = query(
      collection(db, "sessions"),
      where("owner", "==", uid),
      where("status", "==", "active")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting user sessions:", error);
    return [];
  }
}

export function subscribeToSession(sessionId, callback) {
  const unsub = onSnapshot(doc(db, "sessions", sessionId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
  return unsub;
}

// =====================================================================
// GESTIÓN DE COLA
// =====================================================================

export async function addToQueue(sessionId, title, url, thumbnail, duration, priority = 0) {
  try {
    const result = await addToQueueFn({
      sessionId,
      title,
      url,
      thumbnail,
      duration,
      priority
    });
    return result.data;
  } catch (error) {
    console.error("Error adding to queue:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

export async function removeFromQueue(sessionId, queueId) {
  try {
    const result = await removeFromQueueFn({ sessionId, queueId });
    return result.data;
  } catch (error) {
    console.error("Error removing from queue:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

// =====================================================================
// CONTROLES REMOTOS (PanelDJ)
// =====================================================================

export async function toggleRequests(sessionId, enabled) {
  try {
    const result = await toggleRequestsStatusFn({ sessionId, enabled });
    return result.data;
  } catch (error) {
    console.error("Error toggling requests:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

export async function updateSessionSettings(sessionId, autoPlay, timeBetweenSongs) {
  try {
    const result = await updateSessionSettingsFn({
      sessionId,
      autoPlay,
      timeBetweenSongs
    });
    return result.data;
  } catch (error) {
    console.error("Error updating session settings:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

// =====================================================================
// GESTIÓN DE USUARIOS (AdminUser)
// =====================================================================

export async function createUserProfile(email, displayName, role, maxSessions, expirationDate) {
  try {
    const result = await createUserProfileFn({
      email,
      displayName,
      role,
      maxSessions,
      expirationDate
    });
    return result.data;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

export async function updateUserSettings(userId, updates) {
  try {
    const result = await updateUserSettingsFn({ userId, updates });
    return result.data;
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

// =====================================================================
// ESTADÍSTICAS Y MÉTRICAS
// =====================================================================

export async function getCacheStats() {
  try {
    const result = await getCacheStatsFn();
    return result.data;
  } catch (error) {
    console.error("Error getting cache stats:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

export async function getUserMetrics() {
  try {
    const result = await getUserMetricsFn();
    return result.data;
  } catch (error) {
    console.error("Error getting user metrics:", error);
    throw new Error(getErrorMessage(error.code));
  }
}

// =====================================================================
// VALIDACIÓN Y REDIRECCIÓN
// =====================================================================

export async function initializePageProtection() {
  const isAuthorized = await checkUserAccess();
  return isAuthorized;
}

export async function requireAdminAccess() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "Index.html";
    return false;
  }

  const profile = await getUserProfile(user.uid);
  if (!profile || profile.role !== "AdminUser") {
    window.location.href = "AccessDenied.html?reason=nopermission";
    return false;
  }

  return true;
}

console.log("✓ Cross Karaoke Core Loaded");

