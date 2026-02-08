import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface User {
  uid: string;
  email: string;
  role: "User" | "AdminUser";
  displayName?: string;
  expirationDate?: number;
  maxSessions?: number;
  createdAt: number;
}

interface Session {
  id: string;
  owner: string;
  name: string;
  status: "active" | "ended";
  createdAt: number;
  updatedAt: number;
  queue: QueueItem[];
  currentSong?: QueueItem;
  autoPlay: boolean;
  timeBetweenSongs: number;
  requestsEnabled: boolean;
  history: HistoryItem[];
}

interface QueueItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  requestedBy?: string;
  addedAt: number;
  priority: number;
}

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  playedAt: number;
  duration: number;
}

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN Y VALIDACIÓN
// ============================================================================

async function validateUser(uid: string): Promise<User | null> {
  try {
    const doc = await db.collection("users").doc(uid).get();
    return doc.exists ? (doc.data() as User) : null;
  } catch (error) {
    console.error("Error validating user:", error);
    return null;
  }
}

async function checkUserExpiration(user: User): Promise<boolean> {
  if (user.role === "AdminUser") return true;
  if (!user.expirationDate) return true;
  return user.expirationDate > Date.now();
}

async function checkUserSessionLimit(uid: string): Promise<boolean> {
  const user = await validateUser(uid);
  if (!user) return false;
  if (user.role === "AdminUser") return true;

  const maxSessions = user.maxSessions || 1;
  const userSessions = await db
    .collection("sessions")
    .where("owner", "==", uid)
    .where("status", "==", "active")
    .get();

  return userSessions.size < maxSessions;
}

// ============================================================================
// GESTIÓN DE USUARIOS (AdminUser only)
// ============================================================================

export const createUserProfile = functions.https.onCall(
  async (data: any, context: any) => {
    // Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const requesterUid = context.auth.uid;
    const requester = await validateUser(requesterUid);

    if (!requester || requester.role !== "AdminUser") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only AdminUser can create user profiles"
      );
    }

    const { email, displayName, role, maxSessions, expirationDate } = data;

    if (!email || !role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email and role are required"
      );
    }

    if (!["User", "AdminUser"].includes(role)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid role"
      );
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await db.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName: displayName || "",
        role,
        maxSessions: maxSessions || 1,
        expirationDate: expirationDate || null,
        createdAt: Date.now(),
      });

      return {
        success: true,
        uid: userRecord.uid,
        message: "User profile created",
      };
    } catch (error: any) {
      throw new functions.https.HttpsError(
        "internal",
        `Error creating user: ${error.message}`
      );
    }
  }
);

export const updateUserSettings = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const requesterUid = context.auth.uid;
    const requester = await validateUser(requesterUid);

    if (!requester || requester.role !== "AdminUser") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only AdminUser can update user settings"
      );
    }

    const { userId, updates } = data;

    if (!userId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "userId is required"
      );
    }

    try {
      await db.collection("users").doc(userId).update(updates);
      return { success: true, message: "User settings updated" };
    } catch (error: any) {
      throw new functions.https.HttpsError(
        "internal",
        `Error updating user: ${error.message}`
      );
    }
  }
);

// ============================================================================
// GESTIÓN DE SESIONES
// ============================================================================

export const createSession = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = context.auth.uid;
    const user = await validateUser(uid);

    if (!user) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User not found"
      );
    }

    // Verificar expiración
    const isActive = await checkUserExpiration(user);
    if (!isActive) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "User account is expired"
      );
    }

    // Verificar límite de sesiones
    const canCreate = await checkUserSessionLimit(uid);
    if (!canCreate) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Session limit reached"
      );
    }

    const { sessionName } = data;

    if (!sessionName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "sessionName is required"
      );
    }

    try {
      const sessionRef = db.collection("sessions").doc();
      const now = Date.now();

      const session: Session = {
        id: sessionRef.id,
        owner: uid,
        name: sessionName,
        status: "active",
        createdAt: now,
        updatedAt: now,
        queue: [],
        autoPlay: false,
        timeBetweenSongs: 3,
        requestsEnabled: true,
        history: [],
      };

      await sessionRef.set(session);

      return {
        success: true,
        sessionId: sessionRef.id,
        message: "Session created",
      };
    } catch (error: any) {
      throw new functions.https.HttpsError(
        "internal",
        `Error creating session: ${error.message}`
      );
    }
  }
);

export const endSession = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = context.auth.uid;
    const { sessionId } = data;

    if (!sessionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "sessionId is required"
      );
    }

    try {
      const sessionDoc = await db.collection("sessions").doc(sessionId).get();

      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Session not found");
      }

      const session = sessionDoc.data() as Session;
      const requester = await validateUser(uid);

      // Verificar permisos
      if (uid !== session.owner && requester?.role !== "AdminUser") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Cannot end this session"
        );
      }

      await db.collection("sessions").doc(sessionId).update({
        status: "ended",
        updatedAt: Date.now(),
      });

      return { success: true, message: "Session ended" };
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        `Error ending session: ${error.message}`
      );
    }
  }
);

// ============================================================================
// GESTIÓN DE COLA
// ============================================================================

export const addToQueue = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const uid = context.auth.uid;
  const { sessionId, title, url, thumbnail, duration, priority = 0 } = data;

  if (!sessionId || !title || !url) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "sessionId, title, and url are required"
    );
  }

  try {
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Session not found");
    }

    const session = sessionDoc.data() as Session;
    const requester = await validateUser(uid);

    // Verificar permisos
    if (uid !== session.owner && requester?.role !== "AdminUser") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Cannot modify this session"
      );
    }

    const queueItem: QueueItem = {
      id: db.collection("_").doc().id,
      title,
      url,
      thumbnail: thumbnail || "",
      duration: duration || 0,
      requestedBy: uid,
      addedAt: Date.now(),
      priority: priority || 0,
    };

    const queue = session.queue || [];
    queue.push(queueItem);

    await db.collection("sessions").doc(sessionId).update({
      queue: queue,
      updatedAt: Date.now(),
    });

    return { success: true, queueId: queueItem.id, message: "Added to queue" };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Error adding to queue: ${error.message}`
    );
  }
});

export const removeFromQueue = functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = context.auth.uid;
    const { sessionId, queueId } = data;

    if (!sessionId || !queueId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "sessionId and queueId are required"
      );
    }

    try {
      const sessionDoc = await db.collection("sessions").doc(sessionId).get();

      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Session not found");
      }

      const session = sessionDoc.data() as Session;
      const requester = await validateUser(uid);

      if (uid !== session.owner && requester?.role !== "AdminUser") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Cannot modify this session"
        );
      }

      const queue = (session.queue || []).filter((item) => item.id !== queueId);

      await db.collection("sessions").doc(sessionId).update({
        queue: queue,
        updatedAt: Date.now(),
      });

      return { success: true, message: "Removed from queue" };
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        `Error removing from queue: ${error.message}`
      );
    }
  }
);

// ============================================================================
// REQUEST BLOCK / CONTROL REMOTO
// ============================================================================

export const toggleRequestsStatus = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = context.auth.uid;
    const { sessionId, enabled } = data;

    if (!sessionId || typeof enabled !== "boolean") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "sessionId and enabled are required"
      );
    }

    try {
      const sessionDoc = await db.collection("sessions").doc(sessionId).get();

      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Session not found");
      }

      const session = sessionDoc.data() as Session;

      if (uid !== session.owner && (await validateUser(uid))?.role !== "AdminUser") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Cannot modify this session"
        );
      }

      await db.collection("sessions").doc(sessionId).update({
        requestsEnabled: enabled,
        updatedAt: Date.now(),
      });

      return { success: true, message: `Requests ${enabled ? "enabled" : "disabled"}` };
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        `Error updating requests status: ${error.message}`
      );
    }
  }
);

export const updateSessionSettings = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = context.auth.uid;
    const { sessionId, autoPlay, timeBetweenSongs } = data;

    if (!sessionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "sessionId is required"
      );
    }

    try {
      const sessionDoc = await db.collection("sessions").doc(sessionId).get();

      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Session not found");
      }

      const session = sessionDoc.data() as Session;

      if (uid !== session.owner && (await validateUser(uid))?.role !== "AdminUser") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Cannot modify this session"
        );
      }

      const updates: any = { updatedAt: Date.now() };
      if (typeof autoPlay === "boolean") updates.autoPlay = autoPlay;
      if (typeof timeBetweenSongs === "number")
        updates.timeBetweenSongs = Math.min(Math.max(timeBetweenSongs, 0), 8);

      await db.collection("sessions").doc(sessionId).update(updates);

      return { success: true, message: "Settings updated" };
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        `Error updating settings: ${error.message}`
      );
    }
  }
);

// ============================================================================
// GESTIÓN DE CACHE PARA BÚSQUEDAS DE YOUTUBE
// ============================================================================

export const getCacheStats = functions.https.onCall(async (_: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const requester = await validateUser(context.auth.uid);
  if (!requester || requester.role !== "AdminUser") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only AdminUser can view cache stats"
    );
  }

  try {
    const cacheSnap = await db.collection("cache").get();
    const totalSize = cacheSnap.size;
    const totalHits = cacheSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().hits || 0),
      0
    );

    return {
      totalCached: totalSize,
      totalHits,
      averageHitsPerEntry: totalSize > 0 ? totalHits / totalSize : 0,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      "internal",
      `Error getting cache stats: ${error.message}`
    );
  }
});

// ============================================================================
// LIMPIEZA AUTOMÁTICA DE CACHE (Scheduled Functions)
// ============================================================================
// TODO: Actualizar a la sintaxis correcta de Firebase Functions v4
/*
export const cleanupCacheDaily = functions.scheduler.onSchedule(
  "every 24 hours",
  async (event: any) => {
    try {
      const now = Date.now();
      const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

      // Borrar entradas de cache de 90 días sin hits
      const oldCacheSnap = await db
        .collection("cache")
        .where("cachedAt", "<", ninetyDaysAgo)
        .where("hits", "==", 0)
        .get();

      const batch = db.batch();
      oldCacheSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`Deleted ${oldCacheSnap.size} old cache entries`);

      // Resetear hits para entradas de 60-90 días
      const mediumCacheSnap = await db
        .collection("cache")
        .where("cachedAt", ">=", ninetyDaysAgo)
        .where("cachedAt", "<", sixtyDaysAgo)
        .get();

      const batch2 = db.batch();
      mediumCacheSnap.docs.forEach((doc) => {
        batch2.update(doc.ref, { hits: 0 });
      });
      await batch2.commit();

      console.log(
        `Reset hits for ${mediumCacheSnap.size} medium-age cache entries`
      );
    } catch (error) {
      console.error("Error cleaning up cache:", error);
    }
  }
);
*/

// ============================================================================
// ESTADÍSTICAS Y MÉTRICAS
// ============================================================================

export const getUserMetrics = functions.https.onCall(async (_: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const requester = await validateUser(context.auth.uid);
  if (!requester || requester.role !== "AdminUser") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only AdminUser can view metrics"
    );
  }

  try {
    const usersSnap = await db.collection("users").get();
    const sessionsSnap = await db.collection("sessions").get();

    const totalUsers = usersSnap.size;
    const activeSessions = sessionsSnap.docs.filter(
      (doc) => doc.data().status === "active"
    ).length;
    const expiredUsers = usersSnap.docs.filter(
      (doc) =>
        doc.data().role !== "AdminUser" &&
        doc.data().expirationDate &&
        doc.data().expirationDate < Date.now()
    ).length;

    return {
      totalUsers,
      activeSessions,
      expiredUsers,
      adminUsers: usersSnap.docs.filter(
        (doc) => doc.data().role === "AdminUser"
      ).length,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      "internal",
      `Error getting metrics: ${error.message}`
    );
  }
});
